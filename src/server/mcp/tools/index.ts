import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { IUserSession } from '../index';
import { MissingReadScopeError, MissingWriteScopeError, SafeError } from '../errors';
import { User } from '../../models/user';
import { handleToolRequest } from '../handle-request';
import { OAuthClientScopeEnum } from '../../models/oauth-client';
import z from 'zod';
import {
  submitVaultCombinationInputSchema,
  updateProfileInputSchema,
  userProfileOutputSchema,
  UserProfileOutputSchemaType,
  vaultOutputSchema,
  VaultOutputSchemaType,
} from '../schemas';
import { Vault } from '../../models/vault';
import { VaultGuess } from '../../models/vault-guess';
import { addHours, format, startOfHour } from 'date-fns';
import { UniqueConstraintError } from 'sequelize';

export interface IMcpSession {
  id: string;
  // Define any session state here
}

export const GET_PROFILE_TOOL = 'get-profile';
export const UPDATE_PROFILE_TOOL = 'update-profile';
export const GET_VAULT_TOOL = 'get-vault';
export const SUBMIT_VAULT_COMBINATION_TOOL = 'submit-vault-combination';

export function registerTools(
  server: McpServer,
  mcpSession: IMcpSession,
  userSession?: IUserSession
) {
  server.registerTool(
    GET_PROFILE_TOOL,
    {
      title: 'Get Profile',
      description: `This tool gets the user profile.`,
      _meta: {
        securitySchemes: [{ type: 'oauth2', scopes: [OAuthClientScopeEnum.Read] }],
        'openai/outputTemplate': 'chipgpt://ui/profile.html',
        'openai/widgetAccessible': true,
        'openai/toolInvocation/invoking': 'Loading your profile',
        'openai/toolInvocation/invoked': 'Loaded your profile',
      },
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {},
      outputSchema: userProfileOutputSchema,
    },
    async () =>
      handleToolRequest(async () => {
        if (!userSession?.scope.includes(OAuthClientScopeEnum.Read)) {
          throw new MissingReadScopeError();
        }

        const user = await getUser(userSession);
        if (!user) {
          throw new SafeError('User not found');
        }

        return createToolResponse<UserProfileOutputSchemaType>({
          profile: {
            id: user.id,
            name: user.name,
            email: user.email,
            context: user.profile.context,
          },
        });
      })
  );

  server.registerTool(
    UPDATE_PROFILE_TOOL,
    {
      title: 'Update Profile',
      description: `This tool updates the user profile.`,
      _meta: {
        securitySchemes: [{ type: 'oauth2', scopes: [OAuthClientScopeEnum.Write] }],
      },
      inputSchema: updateProfileInputSchema,
      outputSchema: {
        success: z.boolean(),
        message: z.string(),
      },
    },
    async input =>
      handleToolRequest(async () => {
        if (!userSession?.scope.includes(OAuthClientScopeEnum.Write)) {
          throw new MissingWriteScopeError();
        }

        const user = await getUser(userSession);

        user.profile = {
          ...user.profile,
          context: input.context,
        };

        await user.save({ fields: ['profile'] });

        return createToolResponse({ success: true, message: 'Profile updated successfully' });
      })
  );
}

export function registerVaultTools(
  server: McpServer,
  mcpSession: IMcpSession,
  userSession?: IUserSession
) {
  server.registerTool(
    GET_VAULT_TOOL,
    {
      title: 'Get Vault',
      description: `This tool gets the current vault game information.`,
      _meta: {
        securitySchemes: [{ type: 'oauth2', scopes: [OAuthClientScopeEnum.Read] }],
        'openai/outputTemplate': 'chipgpt://ui/vault.html',
        'openai/widgetAccessible': true,
        'openai/toolInvocation/invoking': 'Loading the vault',
        'openai/toolInvocation/invoked': 'Loaded the vault',
      },
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {},
      outputSchema: vaultOutputSchema,
    },
    async () =>
      handleToolRequest(async () => {
        if (!userSession?.scope.includes(OAuthClientScopeEnum.Read)) {
          throw new MissingReadScopeError();
        }

        const vault = await Vault.findOne({
          order: [['createdAt', 'DESC']],
        });
        if (!vault) {
          throw new SafeError('No vault currently available');
        }

        const vaultGuess = await VaultGuess.findOne({
          where: {
            hour: format(new Date(), 'yyyy-MM-dd HH'),
            vaultId: vault.id,
            userId: userSession.userId,
          },
        });

        return createToolResponse<VaultOutputSchemaType>({
          vault: {
            id: vault.id,
            name: vault.name,
            min: vault.min,
            max: vault.max,
            value: vault.value,
            openedAt: vault.openedAt,
            guessed: !!vaultGuess,
          },
        });
      })
  );

  server.registerTool(
    SUBMIT_VAULT_COMBINATION_TOOL,
    {
      title: 'Submit Vault Combination',
      description: `This tool submits a combination to try to unlock the vault game.`,
      _meta: {
        securitySchemes: [{ type: 'oauth2', scopes: [OAuthClientScopeEnum.Write] }],
        'openai/widgetAccessible': true,
      },
      inputSchema: submitVaultCombinationInputSchema,
      outputSchema: {
        success: z.boolean({ description: 'Whether or not the vault was successfully unlocked' }),
      },
    },
    async input =>
      handleToolRequest(async () => {
        if (!userSession?.scope.includes(OAuthClientScopeEnum.Write)) {
          throw new MissingWriteScopeError();
        }

        // Get the latest vault that is not opened
        const vault = await Vault.findOne({
          where: {
            openedAt: null,
            winningVaultGuessId: null,
          },
          order: [['createdAt', 'DESC']],
        });
        if (!vault) {
          throw new SafeError('No vault currently available to open');
        }

        // Submit the guess to the database
        let success = false;
        try {
          // Create the vault guess for today
          // It will be rejected if the key has already been submitted this vault
          // It will be rejected if the user has already submitted a guess for today
          const vaultGuess = await VaultGuess.create({
            key: input.combination,
            hour: format(new Date(), 'yyyy-MM-dd HH'),
            vaultId: vault.id,
            userId: userSession.userId,
          });

          // If the guess is correct, update the vault `openedAt` and set the `winningVaultGuessId`
          if (vaultGuess.key === vault.key) {
            await vault.update({
              openedAt: new Date(),
              winningVaultGuessId: vaultGuess.id,
            });
            success = true;
          }
        } catch (error) {
          if (error instanceof UniqueConstraintError) {
            // User has already submitted a guess for today for this vault
            // @ts-ignore - Sequelize types are not correct - `error.parent.constraint` is not typed
            if (error.parent.constraint === 'VaultGuesses_vaultId_userId_hour_unique') {
              throw new SafeError(
                `You have already submitted a guess for this hour to this vault. You can submit again at ${startOfHour(
                  addHours(new Date(), 1)
                ).toISOString()}`
              );
            }
            // Key has already been submitted for this vault
            // @ts-ignore - Sequelize types are not correct - `error.parent.constraint` is not typed
            if (error.parent.constraint === 'VaultGuesses_vaultId_key_unique') {
              throw new SafeError(
                `That combination has already been submitted to this vault. Try a different combination.`
              );
            }
          }
          // Some unknown sequelize error
          throw error;
        }

        return createToolResponse({ success });
      })
  );
}

function createToolResponse<T extends Object>(content: T) {
  return {
    structuredContent: content,
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(content),
      },
    ],
  };
}

export async function getUser(userSession: IUserSession) {
  const user = await User.findOne({
    where: {
      id: userSession.userId,
    },
  });
  if (!user) {
    throw new SafeError(
      'User not found. Please log in using oauth2 authentication with this MCP server.'
    );
  }
  return user;
}
