import { version } from '../package.json';
import { cleanPath, parse } from './id-utils';

// same as requirejs baseUrl, paths, bundles
let _baseUrl = './';
const _paths = {};

/*
bundles: {
  app-bundle: {
    user: ['app', 'app.html', 'util', 'common/index'],
    package: ['lodash', 'lodash/map', 'util']
  }
}
*/
const _bundles = {};

function defined(id) {

}

// AMD define
function define(id, deps, callback) {

}

// AMD require
function requirejs() {

}

// minimum support of requirejs config
// baseUrl
// paths, relative to baseUrl
// bundles, for code splitting
function config(opts) {
  if (!opts) return;
  if (opts.baseUrl) _baseUrl = opts.baseUrl;

  if (opts.paths) {
    Object.keys(opts.paths).forEach(path => {
      let alias = opts.paths[path];
      _paths[cleanPath(path)] = cleanPath(alias);
    });
  }

  if (opts.bundles) {
    Object.keys(opts.bundles).forEach(bundleName => {
      _bundles[bundleName] = opts.bundles[bundleName];
    });
  }
}

define.requirejs = requirejs;
requirejs.config = config;

// for compatibility with requirejs
define.amd = {jQuery: true};
requirejs.defined = defined;
requirejs.isBrowser = !!(typeof window !== 'undefined' && typeof navigator !== 'undefined' && window.document);
requirejs.version = version;

export default define;


// dumber-amd-loader has two fixed module spaces:
// 1. user space (default), for user source code
// 2. package space, for all npm pacakges and local packages
//
// Module in user space can depend on any module in user or package space.
// Module in package space can only depend on module in package space.
//
// This is a cheap way to avoid module name collision.
// For instance, if user app has `src/util.js`, user souce code will use
// the local `util` module. But any npm package code will use npm package `util`.

