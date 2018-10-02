import babel from 'rollup-plugin-babel';
import {terser} from 'rollup-plugin-terser';
import json from 'rollup-plugin-json';

const banner = `
if (typeof define === 'function') {
  throw new Error('An AMD loader is present, dumber-module-loader is not smart enough to deal with it.');
}
if (typeof fetch === 'undefined') {
  throw new Error('fetch API is not available, please prepend a polyfill e.g. whatwg-fetch. https://huochunpeng.github.com/dumber#fetch-polyfill');
}
if (typeof Promise === 'undefined') {
  throw new Error('Promise API is not available, please prepend a polyfill e.g. promise-polyfill. https://huochunpeng.github.com/dumber#promise-polyfill');
}
`;

const footer = `
var require = requirejs;
`;

export default [
  {
    input: 'src/index.js',
    output: {
      format: 'iife',
      name: 'dumberModuleLoader',
      file: 'dist/index.js',
      banner,
      footer
    },
    plugins: [
      json(),
      babel(),
      terser()
    ]
  },
  {
    input: 'src/id-utils.js',
    output: {
      format: 'cjs',
      file: 'dist/id-utils.js'
    },
    plugins: [
      json(),
      babel(),
      terser()
    ]
  }
];
