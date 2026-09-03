export type Flags = {
  key?: string;
  data?: string;
  sessionId?: string;
  baseUrl?: string;
  username?: string;
  noWait: boolean;
  wait: boolean;
  help: boolean;
  version: boolean;
};

export type ParsedCli = {
  command: string | null;
  positional: string[];
  flags: Flags;
};

function takeValue(argv: string[], i: number): { value: string; next: number } {
  const current = argv[i] ?? '';
  const eq = current.indexOf('=');
  if (eq >= 0) {
    return { value: current.slice(eq + 1), next: i };
  }
  const next = argv[i + 1];
  if (!next || next.startsWith('-')) {
    throw new Error(`Missing value for ${current.split('=')[0]}`);
  }
  return { value: next, next: i + 1 };
}

export function parseArgv(argv: string[]): ParsedCli {
  const flags: Flags = { noWait: false, wait: false, help: false, version: false };
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] ?? '';
    if (arg === '--') {
      positional.push(...argv.slice(i + 1));
      break;
    }
    if (arg === '-h' || arg === '--help') {
      flags.help = true;
      continue;
    }
    if (arg === '-V' || arg === '--version') {
      flags.version = true;
      continue;
    }
    if (arg === '--no-wait') {
      flags.noWait = true;
      continue;
    }
    if (arg === '--wait') {
      flags.wait = true;
      continue;
    }
    if (arg === '-d' || arg === '--data' || arg.startsWith('--data=')) {
      const taken = takeValue(argv, i);
      flags.data = taken.value;
      i = taken.next;
      continue;
    }
    if (arg === '--key' || arg.startsWith('--key=')) {
      const taken = takeValue(argv, i);
      flags.key = taken.value;
      i = taken.next;
      continue;
    }
    if (arg === '--session-id' || arg.startsWith('--session-id=')) {
      const taken = takeValue(argv, i);
      flags.sessionId = taken.value;
      i = taken.next;
      continue;
    }
    if (arg === '--base-url' || arg.startsWith('--base-url=')) {
      const taken = takeValue(argv, i);
      flags.baseUrl = taken.value;
      i = taken.next;
      continue;
    }
    if (arg === '--username' || arg === '--user-id' || arg.startsWith('--username=') || arg.startsWith('--user-id=')) {
      const taken = takeValue(argv, i);
      flags.username = taken.value;
      i = taken.next;
      continue;
    }
    if (arg.startsWith('-')) {
      throw new Error(`Unknown flag ${arg}`);
    }
    positional.push(arg);
  }

  const command = positional[0] ?? null;
  return { command, positional: positional.slice(1), flags };
}
