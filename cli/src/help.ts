import { colorEnabled, palette } from './style.js';

/** Plain help — used when stdout is not a TTY / NO_COLOR. */
export const USAGE = `Usage: flowra <command>

Terminal door for a Flowra project. MCP is still the default for Cursor/OpenClaw.
Do not print API keys. JSON on stdout.

Commands:
  login [--key <sk>] [--no-wait]   Save a project API key (Dashboard → API Keys)
  whoami                           Confirm the key without printing it
  discover <use case>              FLOWRA_DISCOVER_TOOLS (never invent slugs)
  connect <toolkit> [--wait]       FLOWRA_MANAGE_CONNECTIONS (stop on redirectUrl)
  execute <TOOL_SLUG> -d '{...}'   Run a discovered slug

Global:
  --base-url <url>   Default https://flowra.dev
  --username <id>    x-username (default project_default_user)
  --session-id <id>  Reuse DISCOVER session.id
  --help
`;

type Cmd = { name: string; usage: string; blurb: string };

const COMMANDS: Cmd[] = [
  {
    name: 'login',
    usage: 'login [--key <sk>] [--no-wait]',
    blurb: 'Save a project API key (Dashboard → API Keys)',
  },
  {
    name: 'whoami',
    usage: 'whoami',
    blurb: 'Confirm the key without printing it',
  },
  {
    name: 'discover',
    usage: 'discover <use case>',
    blurb: 'FLOWRA_DISCOVER_TOOLS — never invent slugs',
  },
  {
    name: 'connect',
    usage: 'connect <toolkit> [--wait]',
    blurb: 'FLOWRA_MANAGE_CONNECTIONS — stop on redirectUrl',
  },
  {
    name: 'execute',
    usage: "execute <TOOL_SLUG> -d '{...}'",
    blurb: 'Run a discovered slug',
  },
];

const GLOBALS: Array<{ flag: string; blurb: string }> = [
  { flag: '--base-url <url>', blurb: 'Default https://flowra.dev' },
  { flag: '--username <id>', blurb: 'x-username (default project_default_user)' },
  { flag: '--session-id <id>', blurb: 'Reuse DISCOVER session.id' },
  { flag: '--help', blurb: 'Show this help' },
  { flag: '--version', blurb: 'Print package version as JSON' },
];

const EXAMPLES = [
  'flowra login --no-wait',
  'flowra whoami',
  'flowra discover "Gmail list recent inbox emails"',
  'flowra connect gmail',
  "flowra execute GMAIL_SEND_EMAIL -d '{\"subject\":\"Hi\"}'",
];

/** Colored, sectioned help for interactive terminals. */
export function formatUsage(stream: { isTTY?: unknown } = process.stdout): string {
  const enabled = colorEnabled(stream);
  if (!enabled) {
    return USAGE;
  }
  const c = palette(true);
  const heading = (label: string) => c.bold(c.brightCyan(label));
  const lines: string[] = [];

  lines.push(heading('Usage'));
  lines.push(`  ${c.dim('$')} ${c.bold('flowra')} ${c.cyan('<command>')}`);
  lines.push('');
  lines.push(c.dim('  Terminal door for a Flowra project. MCP stays default for Cursor/OpenClaw.'));
  lines.push(c.dim('  Never print API keys. JSON on stdout · brand/status on stderr.'));
  lines.push('');

  lines.push(heading('Commands'));
  const usageWidth = Math.max(...COMMANDS.map((cmd) => cmd.usage.length));
  for (const cmd of COMMANDS) {
    const padded = cmd.usage.padEnd(usageWidth);
    // Color the command verb; leave flags dimmer in the usage column via whole-line styling
    const verb = cmd.name;
    const rest = padded.slice(verb.length);
    lines.push(`  ${c.bold(c.green(verb))}${c.dim(rest)}  ${c.white(cmd.blurb)}`);
  }
  lines.push('');

  lines.push(heading('Global'));
  const flagWidth = Math.max(...GLOBALS.map((g) => g.flag.length));
  for (const g of GLOBALS) {
    lines.push(`  ${c.cyan(g.flag.padEnd(flagWidth))}  ${c.dim(g.blurb)}`);
  }
  lines.push('');

  lines.push(heading('Examples'));
  for (const ex of EXAMPLES) {
    lines.push(`  ${c.dim('$')} ${c.brightGreen(ex)}`);
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
}
