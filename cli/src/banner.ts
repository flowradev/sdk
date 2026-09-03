import { colorEnabled, palette } from './style.js';

/** Same slant banner as the marketing terminal — keep in sync with the landing CLI section. */
export const FLOWRA_BANNER = [
  '    ________',
  '   / ____/ /___ _      ___________ _',
  '  / /_  / / __ \\ | /| / / ___/ __ `/',
  ' / __/ / / /_/ / |/ |/ / /  / /_/ /',
  '/_/   /_/\\____/|__/|__/_/   \\__,_/',
].join('\n');

export const FLOWRA_BANNER_TAG = '@flowra/cli';

function colorBanner(enabled: boolean): string {
  const lines = FLOWRA_BANNER.split('\n');
  if (!enabled) {
    return `${FLOWRA_BANNER}\n${FLOWRA_BANNER_TAG}`;
  }
  const c = palette(true);
  const paints = [c.brightCyan, c.cyan, c.cyan, c.green, c.brightGreen];
  const painted = lines.map((line, i) => paints[i]!(line)).join('\n');
  return `${painted}\n${c.dim(FLOWRA_BANNER_TAG)}`;
}

/**
 * Human-facing brand on stderr only. Never touch stdout — agents parse JSON there.
 * Skip when stderr is not a TTY (piped / CI / agent shells), unless FORCE_COLOR is set.
 */
export function printBanner(stream: NodeJS.WritableStream = process.stderr): void {
  const tty = 'isTTY' in stream && Boolean(stream.isTTY);
  if (!tty && !process.env.FORCE_COLOR) {
    return;
  }
  if (process.env.NO_COLOR && !process.env.FORCE_COLOR) {
    return;
  }
  stream.write(`${colorBanner(colorEnabled(stream))}\n\n`);
}
