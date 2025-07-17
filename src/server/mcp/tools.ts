import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { handleToolRequest, handleResourceRequest } from './handle-request';
import { ISession } from './index';
import { User } from '../models/user';
import { MissingReadScopeError, MissingWriteScopeError, SafeError } from './errors';
import { z } from 'zod';
import { userProfileOutputSchema } from './schemas';

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

          const content = {
            profile: {
              id: userSession.user.id,
              name: userSession.user.name,
              email: userSession.user.email,
              context: userSession.user.profile.context,
            },
          };

          return {
            structuredContent: content,
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(content),
              },
            ],
          };
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

          const content = {
            success: true,
          };

          return {
            structuredContent: content,
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(content),
              },
            ],
          };
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
