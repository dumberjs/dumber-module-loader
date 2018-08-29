import babel from 'rollup-plugin-babel';
// import {terser} from 'rollup-plugin-terser';
import json from 'rollup-plugin-json';

export default {
  input: 'src/index.js',
  output: {
    format: 'iife',
    name: 'define',
    file: 'dist/index.js',
    banner: `
if (typeof define === 'function') {
  throw new Error('An AMD loader is present, dumbamd is not smart enough to deal with it.');
}
`,
    footer: `
var requirejs = define.requirejs;
var require = requirejs;
`
  },
  plugins: [
    json(),
    babel(),
    // terser()
  ]
};
