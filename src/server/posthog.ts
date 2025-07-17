import { PostHog } from 'posthog-node';
import { CONFIG } from './config';

// NOTE: This is a Node.js client, so you can use it for sending events from the server side to PostHog.
export default function PostHogClient() {
  const posthogClient = new PostHog(CONFIG.posthog.apiKey, {
    host: CONFIG.posthog.host,
    flushAt: 1,
    flushInterval: 0,
  });
  return posthogClient;
}
