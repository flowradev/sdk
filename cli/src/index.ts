#!/usr/bin/env node
import { parseArgv } from './args.js';
import { printBanner } from './banner.js';
import { login, whoami, discover, connect, executeTool } from './commands.js';
import { formatUsage } from './help.js';
import { fail, printJson } from './io.js';

const VERSION = '0.1.1';

async function main(): Promise<void> {
  let parsed;
  try {
    parsed = parseArgv(process.argv.slice(2));
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }

  const { command, positional, flags } = parsed;
  if (flags.version) {
    printBanner();
    printJson({ name: '@flowra/cli', version: VERSION, bin: 'flowra' });
    return;
  }
  if (flags.help || !command) {
    printBanner();
    process.stdout.write(formatUsage(process.stdout));
    return;
  }

  // Brand for interactive humans; stdout stays JSON for agents.
  if (command === 'login' || command === 'whoami') {
    printBanner();
  }

  try {
    switch (command) {
      case 'login':
        await login(flags);
        return;
      case 'whoami':
        await whoami(flags);
        return;
      case 'discover': {
        const useCase = positional.join(' ').trim();
        if (!useCase) {
          fail('discover needs a use case, e.g. flowra discover "Gmail list recent inbox emails"');
        }
        await discover(useCase, flags);
        return;
      }
      case 'connect': {
        const toolkit = (positional[0] || '').trim();
        if (!toolkit) {
          fail('connect needs a toolkit slug from discover, e.g. flowra connect gmail');
        }
        await connect(toolkit, flags);
        return;
      }
      case 'execute': {
        const slug = (positional[0] || '').trim();
        if (!slug) {
          fail('execute needs a tool slug from discover, e.g. flowra execute GMAIL_SEND_EMAIL -d \'{}\'');
        }
        await executeTool(slug, flags);
        return;
      }
      default:
        fail(`Unknown command ${command}.`, { hint: 'flowra --help' });
    }
  } catch (error) {
    const detail =
      error && typeof error === 'object' && 'detail' in error
        ? (error as { detail: unknown }).detail
        : undefined;
    fail(error instanceof Error ? error.message : String(error), detail);
  }
}

void main();
