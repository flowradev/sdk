import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FLOWRA_BANNER, FLOWRA_BANNER_TAG, printBanner } from '../dist/banner.js';
import { stripAnsi } from '../dist/style.js';

describe('banner', () => {
  it('renders the Flowra slant wordmark', () => {
    assert.match(FLOWRA_BANNER, /____/);
    assert.equal(FLOWRA_BANNER.split('\n').length, 5);
    assert.equal(FLOWRA_BANNER_TAG, '@flowra/cli');
  });

  it('writes nothing when the stream is not a TTY', () => {
    const prevForce = process.env.FORCE_COLOR;
    const prevNo = process.env.NO_COLOR;
    delete process.env.FORCE_COLOR;
    delete process.env.NO_COLOR;
    try {
      const chunks: string[] = [];
      const stream = {
        isTTY: false,
        write(chunk: string) {
          chunks.push(chunk);
          return true;
        },
      };
      printBanner(stream as unknown as NodeJS.WritableStream);
      assert.deepEqual(chunks, []);
    } finally {
      if (prevForce === undefined) delete process.env.FORCE_COLOR;
      else process.env.FORCE_COLOR = prevForce;
      if (prevNo === undefined) delete process.env.NO_COLOR;
      else process.env.NO_COLOR = prevNo;
    }
  });

  it('writes a colored banner when the stream is a TTY', () => {
    const prev = process.env.FORCE_COLOR;
    process.env.FORCE_COLOR = '1';
    try {
      const chunks: string[] = [];
      const stream = {
        isTTY: true,
        write(chunk: string) {
          chunks.push(chunk);
          return true;
        },
      };
      printBanner(stream as unknown as NodeJS.WritableStream);
      assert.equal(chunks.length, 1);
      const plain = stripAnsi(chunks[0]!);
      assert.match(plain, /@flowra\/cli/);
      assert.match(plain, /____/);
      assert.match(chunks[0]!, /\u001b\[/);
    } finally {
      if (prev === undefined) {
        delete process.env.FORCE_COLOR;
      } else {
        process.env.FORCE_COLOR = prev;
      }
    }
  });
});
