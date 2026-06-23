import { toUserFriendlyApiError } from './api.js';
import { printError } from './output.js';

export function handleCliError(error: unknown): never {
  const friendlyError = toUserFriendlyApiError(error);
  printError(friendlyError.message);
  process.exit(1);
}
