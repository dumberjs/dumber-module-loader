import { version } from '../package.json';
import { cleanPath, parse } from './id-utils';

// same as requirejs baseUrl, paths, bundles
let _baseUrl = './';
const _paths = {};
const _bundles = {};

// all registered modules, but not used yet.
// once required (used), move to defined.
const _registry = {};

// temporary hold of of anonymous/named module
let _registering = null;

// all defined modules
const _defined = {};

function defined(id) {
  return id && _defined.hasOwnProperty(parse(id).bareId);
}

// AMD define
function define(name, deps, callback) {
  // anonymous module
  if (typeof name !== 'string') {
      callback = deps;
      deps = name;
      name = null;
  }

  if (!Array.isArray(deps)) {
      callback = deps;
      deps = null;
  }

  // different from requirejs, dumbamd doesn't auto inject commonjs deps

  // named module
  if (name) _registry[name] = {deps, callback};
  _registering = {name, deps, callback};
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
