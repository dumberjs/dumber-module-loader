import babel from 'rollup-plugin-babel';
import {terser} from 'rollup-plugin-terser';
import json from 'rollup-plugin-json';

const banner = `
if (typeof define !== 'undefined') throw new Error('Global var "define" is occupied!');
`;

const footer = `
if (typeof require === 'undefined') require = requirejs;
`;

const indexOutput = {
  format: 'iife',
  name: 'dumberModuleLoader',
  file: 'dist/index.js',
  banner,
  footer
};

export default [
  {
    input: 'src/index.js',
    output: [
      indexOutput,
      {...indexOutput, sourcemap: 'inline', file: 'dist/index.debug.js'}
    ],
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
