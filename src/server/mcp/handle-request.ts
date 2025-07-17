import { CallToolResult, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { ValidationError } from 'sequelize';
import { SafeError } from './errors';

export async function handleResourceRequest(cb: () => Promise<ReadResourceResult>) {
  try {
    return await cb();
  } catch (e) {
    if (e instanceof SafeError) {
      return {
        contents: [{ uri: 'chipgpt://process-error.txt', text: e.message }],
        isError: true,
      };
    } else if (e instanceof ValidationError) {
      return {
        contents: [
          {
            uri: 'chipgpt://validation-error.txt',
            text: e.errors.map(error => error.message).join(', '),
          },
        ],
        isError: true,
      };
    } else {
      console.error(e);
      return {
        contents: [
          { uri: 'chipgpt://unknown-error.txt', text: 'An unexpected error has occurred' },
        ],
        isError: true,
      };
    }
  }
}

export async function handleToolRequest(cb: () => Promise<CallToolResult>) {
  try {
    return await cb();
  } catch (e) {
    if (e instanceof SafeError) {
      return {
        content: [{ type: 'text' as const, text: e.message }],
        isError: true,
      };
    }
    if (e instanceof ValidationError) {
      return {
        content: [{ type: 'text' as const, text: e.errors.map(error => error.message).join(', ') }],
        isError: true,
      };
    } else {
      console.error(e);
      return {
        content: [{ type: 'text' as const, text: 'An unexpected error has occurred' }],
        isError: true,
      };
    }
  }
}
