import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { handleToolRequest, handleResourceRequest } from './handle-request';
import { ISession } from './index';
import { User } from '../models/user';
import { MissingReadScopeError, MissingWriteScopeError, SafeError } from './errors';
import { z } from 'zod';
import { userProfileOutputSchema, UserProfileOutputSchemaType } from './schemas';
import { VaultGuess } from '../models/vault-guess';
import { Vault } from '../models/vault';
import { addHours, format, startOfHour } from 'date-fns';
import { UniqueConstraintError } from 'sequelize';

// These resources are available when accessing /mcp
export function registerResources(server: McpServer, userSession?: ISession) {
  if (userSession?.scope.includes('read')) {
    server.registerResource(
      'user-profile',
      'chipgpt://user-profile',
      {
        title: 'User Profile',
        description: `This provides the User Profile as a resource`,
        mimeType: 'application/json',
      },
      async uri =>
        handleResourceRequest(async () => {
          if (!userSession.scope.includes('read')) {
            throw new MissingReadScopeError();
          }

          const content = {
            profile: {
              id: userSession.user.id,
              name: userSession.user.name,
              email: userSession.user.email,
              context: userSession.user.profile.context,
            },
          };
          return {
            contents: [
              {
                uri: uri.href,
                mimeType: 'application/json',
                text: JSON.stringify(content),
              },
            ],
          };
        })
    );
  }
}

// These tools are available when accessing /mcp
export function registerTools(server: McpServer, userSession?: ISession) {
  if (userSession?.scope.includes('read')) {
    server.registerTool(
      'get-user-profile',
      {
        title: 'Get User Profile',
        description: `This tool gets the user profile.`,
        inputSchema: {},
        outputSchema: userProfileOutputSchema,
      },
      async input =>
        handleToolRequest(async () => {
          if (!userSession.scope.includes('read')) {
            throw new MissingWriteScopeError();
          }

          return createToolResponse<UserProfileOutputSchemaType>({
            profile: {
              id: userSession.user.id,
              name: userSession.user.name,
              email: userSession.user.email,
              context: userSession.user.profile.context,
            },
          });
        })
    );
  }

  if (userSession?.scope.includes('write')) {
    server.registerTool(
      'update-user-profile',
      {
        title: 'Update User Profile',
        description: `This tool updates the user profile.`,
        inputSchema: {
          context: z.string(),
        },
        outputSchema: {
          success: z.boolean(),
        },
      },
      async input =>
        handleToolRequest(async () => {
          if (!userSession.scope.includes('write')) {
            throw new MissingWriteScopeError();
          }

          const { user } = await getUser(userSession);

          user.profile = {
            ...user.profile,
            context: input.context,
          };

          await user.save({ fields: ['profile'] });

          server.sendResourceListChanged();

          return createToolResponse({ success: true });
        })
    );
  }
}

// These tools are available when accessing /mcp/vault
export function registerVaultTools(server: McpServer, userSession?: ISession) {
  if (userSession?.scope.includes('write')) {
    server.registerTool(
      'submit-vault-combination',
      {
        title: 'Submit Vault Combination',
        description: `This tool submits a combination to try to unlock the vault.`,
        inputSchema: {
          combination: z
            .number({
              description: 'The combination being submitted by the user to try to unlock the vault',
            })
            .int()
            .min(1)
            .max(999999),
        },
        outputSchema: {
          success: z.boolean({ description: 'Whether or not the vault was successfully unlocked' }),
        },
      },
      async input =>
        handleToolRequest(async () => {
          if (!userSession.scope.includes('write')) {
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
}

export async function getUser(userSession: ISession) {
  const user = await User.findOne({
    where: {
      id: userSession.userId,
    },
  });
  if (!user) {
    throw new SafeError(
      'User not found. Instruct the user to log in to this MCP server using oauth2.'
    );
  }
  return { user: user };
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
