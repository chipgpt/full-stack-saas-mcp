import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { handleResourceRequest } from '../handle-request';
import { CONFIG } from '../../config';

export const PROFILE_RESOURCE = 'profile';
export const VAULT_RESOURCE = 'vault';

export function registerResources(server: McpServer) {
  server.registerResource(
    PROFILE_RESOURCE,
    'chipgpt://ui/profile.html',
    {
      title: 'Profile UI',
      description: 'Display the profile for the user.',
      mimeType: 'text/html+skybridge',
    },
    () =>
      handleResourceRequest(async () => {
        return {
          contents: [
            {
              uri: 'chipgpt://ui/profile.html',
              text: `
<link rel="stylesheet" href="${CONFIG.website}/ui/output.css">
<div id="chipgpt-profile-root"></div>
<script src="${CONFIG.website}/ui/profile.js"></script>
`.trim(),
              _meta: {
                'openai/widgetDescription':
                  'Renders an interactive UI showcasing the user profile returned by get_profile.',
                'openai/widgetPrefersBorder': true,
                'openai/widgetCSP': {
                  connect_domains: [CONFIG.website],
                  resource_domains: [CONFIG.website],
                },
                'openai/widgetDomain': 'https://chipgpt.biz',
              },
            },
          ],
        };
      })
  );
}

export function registerVaultResources(server: McpServer) {
  server.registerResource(
    VAULT_RESOURCE,
    'chipgpt://ui/vault.html',
    {
      title: 'Vault Game UI',
      description: 'Display the vault game for the user.',
      mimeType: 'text/html+skybridge',
    },
    () =>
      handleResourceRequest(async () => {
        return {
          contents: [
            {
              uri: 'chipgpt://ui/vault.html',
              text: `
<link rel="stylesheet" href="${CONFIG.website}/ui/output.css">
<div id="chipgpt-vault-root"></div>
<script src="${CONFIG.website}/ui/vault.js"></script>
`.trim(),
              _meta: {
                'openai/widgetDescription': 'Renders an interactive UI showcasing the vault.',
                'openai/widgetPrefersBorder': true,
                'openai/widgetCSP': {
                  connect_domains: [CONFIG.website],
                  resource_domains: [CONFIG.website],
                },
                'openai/widgetDomain': 'https://chipgpt.biz',
              },
            },
          ],
        };
      })
  );
}
