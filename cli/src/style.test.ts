import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { colorEnabled, colorizeJson, stripAnsi } from '../dist/style.js';
import { formatUsage, USAGE } from '../dist/help.js';

describe('style', () => {
  it('respects NO_COLOR', () => {
    const prevNo = process.env.NO_COLOR;
    const prevForce = process.env.FORCE_COLOR;
    process.env.NO_COLOR = '1';
    delete process.env.FORCE_COLOR;
    try {
      assert.equal(colorEnabled({ isTTY: true }), false);
    } finally {
      if (prevNo === undefined) delete process.env.NO_COLOR;
      else process.env.NO_COLOR = prevNo;
      if (prevForce === undefined) delete process.env.FORCE_COLOR;
      else process.env.FORCE_COLOR = prevForce;
    }
  });

  it('colorizes JSON keys and values', () => {
    const raw = JSON.stringify({ ok: true, n: 1, s: 'hi', z: null }, null, 2);
    const painted = colorizeJson(raw, true);
    assert.match(painted, /\u001b\[/);
    assert.equal(JSON.parse(stripAnsi(painted)).ok, true);
  });
});

describe('help', () => {
  it('returns plain USAGE without color', () => {
    const prev = process.env.NO_COLOR;
    process.env.NO_COLOR = '1';
    try {
      assert.equal(formatUsage({ isTTY: true }), USAGE);
    } finally {
      if (prev === undefined) delete process.env.NO_COLOR;
      else process.env.NO_COLOR = prev;
    }
  });

  it('returns sectioned colored help on TTY', () => {
    const prevNo = process.env.NO_COLOR;
    const prevForce = process.env.FORCE_COLOR;
    delete process.env.NO_COLOR;
    process.env.FORCE_COLOR = '1';
    try {
      const text = formatUsage({ isTTY: true });
      assert.match(text, /Commands/);
      assert.match(text, /Examples/);
      assert.match(text, /\u001b\[/);
      assert.match(stripAnsi(text), /flowra discover/);
    } finally {
      if (prevNo === undefined) delete process.env.NO_COLOR;
      else process.env.NO_COLOR = prevNo;
      if (prevForce === undefined) delete process.env.FORCE_COLOR;
      else process.env.FORCE_COLOR = prevForce;
    }
  });
});
