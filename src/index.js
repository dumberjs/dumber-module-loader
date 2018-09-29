/* global global, self, */
import {version} from '../package.json';
import {cleanPath, parse, nodejsIds} from './id-utils';
import {Space, nodejsIds} from './space';

// copied from https://github.com/aurelia/pal/blob/master/src/index.js
const _global = (function() {
  // Workers don’t have `window`, only `self`
  if (typeof self !== 'undefined') {
    return self;
  }

  if (typeof global !== 'undefined') {
    return global;
  }

  // Not all environments allow eval and Function
  // Use only as a last resort:
  return new Function('return this')();
})();


// dumber-amd-loader has two fixed module spaces:
// 1. user space (default), for user source code
// 2. package space, for all npm package and local packages
//
// Module in user space can depend on any module in user or package space.
// Module in package space can only depend on module in package space.
//
// This is a cheap way to avoid module name collision.
// For instance, if user app has `src/util.js`, user source code will use
// the local `util` module. But any npm package code will use npm package `util`.

const userSpaceTesseract = {
  global: _global,
  req: function (id) {
    // try additional user module in bundles
    return additionalUserReq(id)
    // then try package space
    // packaegSpace will handle additional package module in bundles
    .catch(() => packageSpace.req(id))
    // then try dynamic load
    .catch(() => runtimeReq(id));
  }
};

const userSpace = new Space(userSpaceTesseract);

const packageSpaceTesseract = {
  global: _global,
  req: additionalPackageReq // try additional package module in bundles
};

const packageSpace = new Space(packageSpaceTesseract);

// AMD configs
// same as requirejs baseUrl, paths,
let _baseUrl = './';
const _paths = {};

/*
different from requirejs bundles

bundles: {
  app-bundle: {
    // note incoming arrays were saved in Set internally
    user: ['app', 'app.html', 'util', 'common/index'],
    package: ['lodash', 'lodash/map', 'util']
  }
}
*/
const _bundles = {};

const translators = [
  // TODO default js file translator, translate text to (new Function(text))()
];

function runtimeReq(id) {
  const parsed = parse(id);
  // TODO use fetch api to fetch parsed.bareId
  // TODO support customise translators
}

function additionalUserReq(id) {
  return packageSpace.req(id)
  .catch(() => {
    const possibleIds = nodejsIds(id);
    const bundleName = Object.keys(_bundles).find(bn =>
      possibleIds.some(d => _bundles[bn].user.has(d))
    );

    if (bundleName) {
      // TODO bring in the bundle
    }
  });
}

function additionalPackageReq(id) {
  return packageSpace.req(id)
  .catch(() => {
    const possibleIds = nodejsIds(id);
    const bundleName = Object.keys(_bundles).find(bn =>
      possibleIds.some(d => _bundles[bn].package.has(d))
    );

    if (bundleName) {
      // TODO bring in the bundle
    }
  });
}

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



