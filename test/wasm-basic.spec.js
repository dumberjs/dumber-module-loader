/* global define, requirejs */
import test from 'tape';
import '../src/index';
import {mockFetchApi, restoreFetchApi} from './mock-fetch';
import fs from 'fs';

test('load wasm module', t => {
  define.reset();

  if (!requirejs.isBrowser) {
    mockFetchApi({
      'test/fib.wasm': new Uint8Array(fs.readFileSync('test/fib.wasm'))
    });
  }

  requirejs(['test/fib.wasm'],
    result => {
      t.equal(result.fib(2), 2);
      t.equal(result.fib(3), 3);
      t.equal(result.fib(4), 5);
      if (!requirejs.isBrowser) restoreFetchApi();
      t.end();
    },
    err => {
      t.fail(err.message);
      if (!requirejs.isBrowser) restoreFetchApi();
      t.end();
    }
  );
});
