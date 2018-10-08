import {version} from '../package.json';
import {cleanPath, parse, nodejsIds, mapId} from './id-utils';
import makeSpace from './space';
import _global from './_global';
import serialResults from './serial-results';

// dumber-module-loader has two fixed module spaces:
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
  mappedId,
  toUrl,
  // incoming id is already mapped
  // 1. try additional user module in bundles,
  // 2. then try package space
  // packaegSpace will handle additional package module in bundles
  // 3. then try runtime remote load, only if it's not a known
  //package module
  req: mId => {
    const p = userReqFromBundle(mId);
    // p is a promise loading additional bundle
    if (p) return p;

    let packageReq;
    try {
      packageReq = packageSpace.req(mId);
    } catch (err) {
      // Failure in sync mode.
      // Only do runtimeReq if mId fail immediately (not dep fail)
      // This means mId is not a known package space module, so
      // we could try to remotely load a user space module.
      if (err && err.__unkown === mId) {
        const parsed = parse(mId);
        const pluginId = parsed.prefix ?
          parsed.prefix.substring(0, parsed.prefix.length - 1) :
          '';
        // text and json plugins are built-in
        if (pluginId) {
          if (pluginId !== 'text' && pluginId !== 'json') {
            return new Promise((resolve, reject) => {
              requirejs([pluginId], plugin => {
                // Call requirejs plugin api load(name, require, load, options)
                // Options set to {} just to make existing requirejs plugins happy.
                plugin.load(parsed.bareId, requirejs, loaded => {
                  userSpace.define(mId, [], () => loaded);
                  resolve(userSpace.req(mId));
                }, {});
              });
            });
          }
        } else if (parsed.ext && parsed.ext !== '.js') {
          const extPluginName = 'ext:' + parsed.ext.substring(1);
          if (userSpace.has(extPluginName) || packageSpace.has(extPluginName)) {
            return new Promise((resolve, reject) => {
              requirejs([extPluginName], plugin => {
                // Call requirejs plugin api load(name, require, load, options)
                // Options set to {} just to make existing requirejs plugins happy.
                plugin.load(parsed.cleanId, requirejs, loaded => {
                  userSpace.define(mId, [], () => loaded);
                  resolve(userSpace.req(mId));
                }, {});
              });
            });
          }
        }
        return runtimeReq(mId);
      }

      throw err;
    }

    // packageReq could be successful require in sync mode, or a
    // promise in async mode.
    // The only way we can get into async mode is that mId is
    // loaded by a remote bundle, it means at least the first
    // level mId is a package module.
    // So in async mode, any failure is considered final, no more
    // fall back to runtimeReq for a remote user space module
    return packageReq;
  }
};

const userSpace = makeSpace(userSpaceTesseract);

const packageSpaceTesseract = {
  global: _global,
  mappedId,
  toUrl,
  // incoming id is already mapped
  req: packageReqFromBundle
};

const packageSpace = makeSpace(packageSpaceTesseract);

let currentSpace = userSpace;

function switchToUserSpace() {
  currentSpace = userSpace;
}

function switchToPackageSpace() {
  currentSpace = packageSpace;
}

// AMD configs
// same as requirejs baseUrl, paths,
// different from requirejs, our default baseUrl is empty string, not "./".
// but "" and "./" behave same for remote fetch,
let _baseUrl = '';
let _paths = {};

function mappedId(id) {
  return mapId(id, _paths);
}

// incoming id is already mapped
function urlsForId(mId) {
  const parsed = parse(mId);
  const urls = [];
  let url = parsed.bareId;
  if (url[0] !== '/') url = _baseUrl + url;
  if (!parsed.ext && !(url.length > 3 && url.substring(url.length - 3) === '.js')) {
    urls.push(url + '.js');
  }
  urls.push(url);
  return urls;
}

/*
different from requirejs bundles

bundles: {
  app-bundle: {
    // note incoming arrays were saved in hash internally {app: 1, 'app.html': 1, ...}
    user: ['app', 'app.html', 'util', 'common/index'],
    package: ['lodash', 'lodash/map', 'util']
  }
}

for bundles only contain user space modules, a simplified config can be used.
bundles: {
  // still saved in hash internally
  app-bundle: ['app', 'app.html', 'util', 'common/index']
}
*/
let _bundles = {};

// translators for runtime loaded content
const _translators = [
  // html/svg/css file without prefix
  (parsedId, response) => {
    if (parsedId.prefix || (
        parsedId.ext !== '.html' &&
        parsedId.ext !== '.svg' &&
        parsedId.ext !== '.css')) return;

    return response.text()
    .then(text => {
      userSpace.define(parsedId.cleanId, text);
      userSpace.define('text!' + parsedId.cleanId, text);
    });
  },

  // json file
  (parsedId, response) => {
    if (parsedId.prefix || parsedId.ext !== '.json') return;

    return response.json()
    .then(json => {
      userSpace.define(parsedId.cleanId, [], json);
      userSpace.define('json!' + parsedId.cleanId, [], json);
    });
  },

  // .wasm file
  (parsedId, response) => {
    if (parsedId.prefix || parsedId.ext !== '.wasm') return;

    // TODO support wasm at runtime
    // TODO how to know what kind of importObject the wasm file needs
    // TODO do we need to delay instantiate (wrap in define callback)?
    // return WebAssembly.instantiateStreaming(response, importObject)
    // .then(obj => {
    //    userSpace.define(parsedId.cleanId, [...], () => obj.instance.exports);
    // });
  },

  // prefix json!
  (parsedId, response) => {
    if (parsedId.prefix !== 'json!') return;

    return response.json()
    .then(json => {
      userSpace.define(parsedId.cleanId, [], json);
      if (parsedId.ext === '.json') {
        userSpace.define(parsedId.bareId, [], json);
      }
    });
  },

  // prefix text!
  (parsedId, response) => {
    if (parsedId.prefix !== 'text!') return;

    return response.text()
    .then(text => {
      userSpace.define(parsedId.cleanId, text);
    });
  },

  // normal AMD module
  (parsedId, response) => {
    if (parsedId.prefix || (parsedId.ext && parsedId.ext !== '.js')) {
      return;
    }

    return response.text()
    .then(text => {
      // runtime req only supports module in user space
      switchToUserSpace();
      (new Function(text))();
      // could be anonymous
      userSpace.nameAnonymous(parsedId.cleanId);
    });
  }
];

const _fetchUrl = url => {
  if (typeof _global.fetch === 'undefined') {
    return Promise.reject(new Error(`fetch API is not available, cannot fetch "${url}"`));
  }
  return _global.fetch(url, {credentials: 'include'})
  .then(response => {
    if (response.ok) return response;
    throw new Error(`${response.status} ${response.statusText}`);
  });
};

// incoming id is already mapped
// return a promise
const _fetch = mId => {
  const urls = urlsForId(mId);
  const len = urls.length;

  if (len === 1) return _fetchUrl(urls[0]);

  // only 2 urls available, foo.min.js, foo.min

  return _fetchUrl(urls[0]).catch(err0 =>
    _fetchUrl(urls[1]).catch(err1 => {
      throw new Error(err0.message + '\n' + err1.message);
    })
  );
};

// incoming id is already mapped
// return a promise
function runtimeReq(mId) {
  const parsed = parse(mId);
  return _fetch(parsed.cleanId)
  .then(response => {
    // ensure default user space
    define.switchToUserSpace();

    for (let i = 0, len = _translators.length; i < len; i++) {
      const result = _translators[i](parsed, response);
      if (result && typeof result.then === 'function') return result;
    }
    throw new Error(`no runtime translator to handle ${parsed.cleanId}`);
  })
  .then(() => {
    if (userSpace.has(parsed.cleanId)) return userSpace.req(parsed.cleanId);
    throw new Error(`module "${parsed.cleanId}" is missing from url "${JSON.stringify(urlsForId(mId))}"`);
  });
}

// incoming id is already mapped
// return a promise to load additional bundle
// or return undefined.
function userReqFromBundle(mId) {
  const possibleIds = nodejsIds(mId);
  const bundleName = Object.keys(_bundles).find(bn =>
    possibleIds.some(d => _bundles[bn].user.hasOwnProperty(d))
  );

  if (bundleName) {
    return loadBundle(bundleName)
    .then(() => {
      if (userSpace.has(mId)) return userSpace.req(mId);
      throw new Error(`module "${mId}" is missing from bundle "${bundleName}"`);
    });
  }
}

// incoming id is already mapped
// return a promise to load additional bundle
// or throw an error to help userSpaceTesseract to identify sync return.
function packageReqFromBundle(mId) {
  const possibleIds = nodejsIds(mId);
  const bundleName = Object.keys(_bundles).find(bn =>
    possibleIds.some(d => _bundles[bn].package.hasOwnProperty(d))
  );

  if (bundleName) {
    return loadBundle(bundleName)
    .then(() => {
      if (packageSpace.has(mId)) return packageSpace.req(mId);
      throw new Error(`module "${mId}" is missing from bundle "${bundleName}"`);
    });
  }

  const err = new Error(`no bundle for module "${mId}"`);
  err.__unkown = mId;
  throw err;
}

// return a promise
function loadBundle(bundleName) {
  return _fetch(mappedId(bundleName))
  .then(response => response.text())
  .then(text => {
    // ensure default user space
    // the bundle itself may switch to package space in middle of the file
    switchToUserSpace();
    (new Function(text))();
  });
}

function defined(id) {
  const mId = mappedId(id);
  return userSpace.defined(mId) || packageSpace.defined(mId);
}

// return all defined module values, excluding registered but not evaluated.
// this is to match existing behaviour of requirejs and webpack.
// note if there is duplicated module id in user and package space, the user
// space module value will show up.
function definedValues() {
  return {...packageSpace.definedValues(), ...userSpace.definedValues()};
}

// AMD define
function define(id, deps, callback) {
  currentSpace.define(id, deps, callback);
}

// AMD require
// run callback synchronously as much as possible.
// or use a promise to run callback asynchronous.
//
// returns undefined.
//
// different from requirejs:
// 1. we don't support optional config.
// 2. errback only gets one error object.
function requirejs(deps, callback, errback) {
  if (!Array.isArray(deps)) throw new Error('missing deps array');
  if (callback && typeof callback !== 'function') throw new Error('callback is not a function');
  if (errback && typeof errback !== 'function') throw new Error('errback is not a function');

  // return AMD require function or commonjs require function
  function requireFunc() {
    if (typeof arguments[0] === 'string') {
      const dep = arguments[0];
      const got = defined(dep);
      if (got) return got.val;
      throw new Error(`commonjs dependency "${dep}" is not prepared.`);
    }

    return requirejs.apply(null, arguments);
  };

  requireFunc.toUrl = toUrl;

  const depValues = serialResults(deps, d => {
    if (d === 'require') return requireFunc;
    return userSpace.req(mappedId(d));
  });

  const finalize = results => {
    if (callback) return callback.apply(_global, results);
  };

  const errHandler = err => {
    if (errback) return errback(err);
    else console.error(err);
  };


  if (depValues && typeof depValues.then === 'function') {
    // asynchronous callback
    depValues.then(finalize, errHandler);
  } else {
    // synchronous callback
    try {
      finalize(depValues);
    } catch (err) {
      errHandler(err);
    }
  }
}

// AMD requirejs.undef
// TODO design for HMR (hot-module-reload)
// incoming id is a mapped id
function undef(id) {
  userSpace.undef(id);
  // TODO do we need undef for packageSpace
  // packageSpace.undef(id);
}

function reset() {
  _baseUrl = '';
  _paths = {};
  _bundles = {};

  userSpace.purge();
  packageSpace.purge();
  switchToUserSpace();
}

// https://github.com/tc39/proposal-dynamic-import
// function _import(id) {
//   return userSpace.req(mappedId(id));
// }

// minimum support of requirejs config
// baseUrl
// paths, relative to baseUrl
// bundles, for code splitting
// translators, for module loading at runtime
function config(opts) {
  if (!opts) return;
  if (opts.baseUrl) _baseUrl = parse(opts.baseUrl).bareId + '/';

  if (opts.paths) {
    Object.keys(opts.paths).forEach(path => {
      let alias = opts.paths[path];
      _paths[cleanPath(path)] = cleanPath(alias);
    });
  }

  if (opts.bundles) {
    Object.keys(opts.bundles).forEach(bundleName => {
      const spaces = opts.bundles[bundleName];
      if (Array.isArray(spaces)) {
        _bundles[bundleName] = {
          user: arrayToHash(spaces),
          package: arrayToHash([])
        };
      } else {
        _bundles[bundleName] = {
          user: arrayToHash(spaces.user || []),
          package: arrayToHash(spaces.package || [])
        };
      }
    });
  }

  if (opts.translators) {
    _translators.unshift(...opts.translators);
  }
}

function arrayToHash(arr) {
  const hash = {};
  arr.forEach(i => hash[i] = 1);
  return hash;
}

const isBrowser = !!(typeof _global.navigator !== 'undefined' && typeof _global.document !== 'undefined');

function toUrl(id) {
  const urls = urlsForId(id);
  return urls.pop();
};

define.switchToUserSpace = switchToUserSpace;
define.switchToPackageSpace = switchToPackageSpace;
define.reset = reset;
// define.import = _import;
requirejs.config = config;
requirejs.definedValues = definedValues;

// for compatibility with requirejs
define.amd = {jQuery: true};
requirejs.defined = defined;
requirejs.isBrowser = isBrowser;
requirejs.version = version;
requirejs.undef = undef;
requirejs.toUrl = toUrl;

// support data-main <script data-main="app" src="some-bundle"></script>
// different from requirejs, the data-main string is treated simply as the main module id.
// we don't set baseUrl based on data-main's dirname.
if (isBrowser) {
  const scripts = _global.document.getElementsByTagName('script');
  const len = scripts.length;

  for (let i = len - 1; i >= 0; i--) {
    const script = scripts[i];
    const main = script.getAttribute('data-main');

    if (main) {
      // start main module
      setTimeout(() => requirejs([mappedId(main)]));
      break;
    }
  }
}

_global.define = define;
_global.requirejs = requirejs;

export default define;
