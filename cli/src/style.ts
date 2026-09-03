/** Tiny ANSI helpers — no chalk. Respect NO_COLOR / FORCE_COLOR / non-TTY. */

export function colorEnabled(stream?: unknown): boolean {
  if (process.env.NO_COLOR !== undefined && process.env.NO_COLOR !== '') {
    return false;
  }
  if (process.env.FORCE_COLOR === '0') {
    return false;
  }
  if (process.env.FORCE_COLOR) {
    return true;
  }
  return Boolean(
    stream &&
      typeof stream === 'object' &&
      'isTTY' in stream &&
      Boolean((stream as { isTTY?: unknown }).isTTY),
  );
}

type Paint = (text: string) => string;

function paint(open: string, close = '\u001b[0m'): Paint {
  return (text: string) => `${open}${text}${close}`;
}

function identity(text: string): string {
  return text;
}

export type Palette = {
  bold: Paint;
  dim: Paint;
  cyan: Paint;
  brightCyan: Paint;
  green: Paint;
  brightGreen: Paint;
  yellow: Paint;
  red: Paint;
  magenta: Paint;
  white: Paint;
  reset: Paint;
};

export function palette(enabled: boolean): Palette {
  if (!enabled) {
    return {
      bold: identity,
      dim: identity,
      cyan: identity,
      brightCyan: identity,
      green: identity,
      brightGreen: identity,
      yellow: identity,
      red: identity,
      magenta: identity,
      white: identity,
      reset: identity,
    };
  }
  return {
    bold: paint('\u001b[1m'),
    dim: paint('\u001b[2m'),
    cyan: paint('\u001b[36m'),
    brightCyan: paint('\u001b[96m'),
    green: paint('\u001b[32m'),
    brightGreen: paint('\u001b[92m'),
    yellow: paint('\u001b[33m'),
    red: paint('\u001b[31m'),
    magenta: paint('\u001b[35m'),
    white: paint('\u001b[37m'),
    reset: paint('\u001b[0m'),
  };
}

/** Human status on stderr; silent when not a TTY (agents / pipes), unless FORCE_COLOR. */
export function hum(message: string, stream: NodeJS.WritableStream = process.stderr): void {
  const tty = 'isTTY' in stream && Boolean(stream.isTTY);
  if (!tty && !process.env.FORCE_COLOR) {
    return;
  }
  if (process.env.NO_COLOR && !process.env.FORCE_COLOR) {
    return;
  }
  const c = palette(colorEnabled(stream));
  stream.write(`${c.dim('│')} ${message}\n`);
}

export function humOk(label: string, detail?: string): void {
  const c = palette(colorEnabled(process.stderr));
  hum(`${c.brightGreen('✓')} ${c.bold(label)}${detail ? c.dim(`  ${detail}`) : ''}`);
}

export function humStep(label: string, detail?: string): void {
  const c = palette(colorEnabled(process.stderr));
  hum(`${c.brightCyan('→')} ${c.bold(label)}${detail ? c.dim(`  ${detail}`) : ''}`);
}

export function humWarn(label: string, detail?: string): void {
  const c = palette(colorEnabled(process.stderr));
  hum(`${c.yellow('!')} ${c.bold(label)}${detail ? c.dim(`  ${detail}`) : ''}`);
}

/** Syntax-color JSON for interactive terminals only. */
export function colorizeJson(raw: string, enabled = colorEnabled(process.stdout)): string {
  if (!enabled) {
    return raw;
  }
  const c = palette(true);
  return raw.replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (match, stringLit: string | undefined, colon: string | undefined, lit: string | undefined) => {
      if (stringLit !== undefined) {
        return colon !== undefined ? `${c.cyan(stringLit)}${colon}` : c.green(stringLit);
      }
      if (lit === 'true' || lit === 'false') {
        return c.magenta(lit);
      }
      if (lit === 'null') {
        return c.dim('null');
      }
      return c.yellow(match);
    },
  );
}

export function stripAnsi(text: string): string {
  return text.replace(/\u001b\[[0-9;]*m/g, '');
}
