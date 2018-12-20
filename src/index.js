import {version} from '../package.json';
import {cleanPath, parse, nodejsIds, mapId, resolveModuleId} from './id-utils';
import makeSpace from './space';
import _global from './_global';
import serialResults from './serial-results';

// Try prefix plugin (like text!mId) or extension plugin like "ext:css".
// This is for user space only.
function tryPlugin(mId) {
  const parsed = parse(mId);
  const pluginId = parsed.prefix.slice(0, -1);
  // text,json,raw plugins are built-in
  if (pluginId) {
    if (pluginId !== 'text' && pluginId !== 'json' && pluginId !== 'raw') {
      return new Promise((resolve, reject) => {
        const req = (deps, callback, errback) => {
          const errback2 = e => {
            if (errback) {
              try {
                errback(e);
              } catch (err) {
                // ignore
              }
            }
            reject(e);
          };
          return requirejs(deps, callback, errback2);
        };
        try {
          requirejs([pluginId], plugin => {
            // Call requirejs plugin api load(name, require, load, options)
            // Options set to {} just to make existing requirejs plugins happy.
            plugin.load(parsed.bareId, req, loaded => {
              userSpace.define(mId, [], () => loaded);
              resolve(userSpace.req(mId));
            }, {});
          });
        } catch (err) {
          reject(err);
        }
      });
    }
  } else {
    return tryExtPlugin(mId, userSpace);
  }
}

// Try extension plugin like "ext:css".
// This is for both user and package space.
function tryExtPlugin(mId, space) {
  const parsed = parse(mId);
  if (!parsed.prefix && parsed.ext && parsed.ext !== '.js') {
    const extPluginName = 'ext:' + parsed.ext.slice(1);
    if (userSpace.has(extPluginName) || packageSpace.has(extPluginName)) {
      return new Promise((resolve, reject) => {
        const req = (deps, callback, errback) => {
          const errback2 = e => {
            if (errback) {
              try {
                errback(e);
              } catch (err) {
                // ignore
              }
            }
            reject(e);
          };
          return requirejs(deps, callback, errback2);
        };
        try {
          requirejs([extPluginName], plugin => {
            // Call requirejs plugin api load(name, require, load, options)
            // Options set to {} just to make existing requirejs plugins happy.
            plugin.load(parsed.cleanId, req, loaded => {
              space.define(mId, [], () => loaded);
              resolve(space.req(mId));
            }, {});
          });
        } catch (err) {
          reject(err);
        }
      });
    }
    // else by default use text!
    return new Promise(resolve => {
      userSpace.define(parsed.cleanId,['text!' + parsed.cleanId], m => m);
      resolve(userSpace.req(mId));
    });
  }
}
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
    if (p) {
      return p.catch(err => {
        if (err && err.__missing === mId) {
          const tried = tryExtPlugin(mId, userSpace);
          // tried is a promise or undefined
          if (tried) return tried;
        }
        throw err;
      });
    }

    let packageReq;
    try {
      packageReq = packageSpace.req(mId);
    } catch (err) {
      // Failure in sync mode.
      // Only do runtimeReq if mId fail immediately (not dep fail)
      // This means mId is not a known package space module, so
      // we could try to remotely load a user space module.
      if (err && err.__unkown === mId) {
        const tried = tryPlugin(mId);
        // tried is a promise or undefined
        if (tried) return tried;
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
  req: mId => {
    const p = packageReqFromBundle(mId);
    // p is a promise loading additional bundle
    if (p) {
      return p.catch(err => {
        if (err && err.__missing === mId) {
          const tried = tryExtPlugin(mId, packageSpace);
          // tried is a promise or undefined
          if (tried) return tried;
        }
        throw err;
      });
    }
  }
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
function toUrl(mId) {
  const parsed = parse(mId);
  let url = parsed.bareId;
  if (url[0] !== '/') url = _baseUrl + url;
  if (!parsed.ext) {
    // no known ext, add .js
    url += '.js';
  }
  return url;
}

/*
different from requirejs bundles

bundles: {
  'app-bundle': {
    // note incoming arrays were saved in hash internally {app: 1, 'app.html': 1, ...}
    user: ['app', 'app.html', 'util', 'common/index'],
    package: ['lodash', 'lodash/map', 'util']
  }
}

for bundles only contain user space modules, a simplified config can be used.
bundles: {
  // still saved in hash internally
  'app-bundle': ['app', 'app.html', 'util', 'common/index']
}
*/
let _bundles = {};

// translators for runtime loaded content
const _translators = [
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

  // prefix raw!
  (parsedId, response) => {
    if (parsedId.prefix !== 'raw!') return;
    userSpace.define(parsedId.cleanId, () => response);
    return Promise.resolve();
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
  return _fetchUrl(toUrl(mId));
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
    throw new Error(`module "${parsed.cleanId}" is missing from url "${toUrl(mId)}"`);
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
      const err = new Error(`module "${mId}" is missing from bundle "${bundleName}"`);
      err.__missing = mId;
      throw err;
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
      const err = new Error(`module "${mId}" is missing from bundle "${bundleName}"`);
      err.__missing = mId;
      throw err;
    });
  }

  const err = new Error(`no bundle for module "${mId}"`);
  err.__unkown = mId;
  throw err;
}

let _urlWaiting = {};
let _urlLoaded = {};
// return a promise
function loadBundle(bundleName) {
  const mappedBundleName = mappedId(bundleName);
  const url = toUrl(mappedBundleName);
  if (_urlLoaded[url]) return Promise.resolve();
  if (_urlWaiting[url]) {
    return new Promise((resolve, reject) => {
      _urlWaiting[url].push({resolve, reject});
    });
  }

  // init waiting list to block duplicated loading request
  _urlWaiting[url] = [];

  let job;

  // I really hate this.
  // Use script tag, not fetch, only to support sourcemaps.
  // And I don't know what to mock it up, so __skip_script_load_test
  if (isBrowser && !define.__skip_script_load_test) {
    job = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.setAttribute('data-requiremodule', mappedBundleName);
      script.type = 'text/javascript';
      script.charset = 'utf-8';
      script.async = true;
      script.addEventListener('load', resolve);
      script.addEventListener('error', reject);
      script.src = url;

      // If the script is cached, IE10 executes the script body and the
      // onload handler synchronously here.  That's a spec violation,
      // so be sure to do this asynchronously.
      if (document.documentMode === 10) {
        setTimeout(() => {
          document.head.appendChild(script);
        });
      } else {
        document.head.appendChild(script);
      }
    });
  } else {
    // in nodejs or web worker
    job = _fetch(mappedBundleName)
    .then(response => response.text())
    .then(text => {
      // ensure default user space
      // the bundle itself may switch to package space in middle of the file
      (new Function(text))();
    });
  }

  return job.then(
    () => {
      _urlLoaded[url] = true;
      if (_urlWaiting[url]) {
        _urlWaiting[url].forEach(pending => pending.resolve());
        delete _urlWaiting[url];
      }
    },
    err => {
      if (_urlWaiting[url]) {
        _urlWaiting[url].forEach(pending => pending.reject(err));
        delete _urlWaiting[url];
      }
      throw err;
    }
  );

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
  }

  requireFunc.toUrl = toUrl;

  const depValues = serialResults(deps, d => {
    if (d === 'require') return requireFunc;
    if (d instanceof RegExp) {
      const expanded = [...userSpace.ids(), ...packageSpace.ids()].filter(id => id.match(d));
      return serialResults(expanded, e => userSpace.req(e));
    }
    return userSpace.req(mappedId(d));
  });

  const finalize = results => {
    if (callback) return callback.apply(_global, results);
    else return results;
  };

  const errHandler = err => {
    if (errback) return errback(err);
    else console.error(err); // eslint-disable-line no-console
  };

  if (depValues && typeof depValues.then === 'function') {
    // asynchronous callback
    return depValues.then(finalize, errHandler);
  }

  // synchronous callback
  return new Promise(resolve => {
    resolve(finalize(depValues));
  });
}

// AMD requirejs.undef
// TODO design for HMR (hot-module-reload)
// incoming id is a mapped id
function undef(id) {
  userSpace.undef(id);
  // TODO do we need undef for packageSpace
  // packageSpace.undef(id);
}

// function loadText(name, req, load) {
//   req(['text!' + name], load);
// }

// const textExtPlugin = {load: loadText};

// Only support wasm without importObject.
// How to know what kind of importObject the wasm file needs?
function loadWasm(name, req, load) {
  req(['raw!' + name], response => {
    response.arrayBuffer().then(buffer =>
      WebAssembly.instantiate(buffer, /*importObject*/)
    )
    .then(obj => {
      load(obj.instance.exports);
    });
  });
}

function reset() {
  _baseUrl = '';
  _paths = {};
  _bundles = {};
  _urlLoaded = {};

  userSpace.purge();
  packageSpace.purge();
  switchToUserSpace();

  define('ext:json', {
    load(name, req, load) {
      req(['text!' + name], text => load(JSON.parse(text)));
    }
  });

  // now it's default to load them with text plugin

  // define('ext:html', textExtPlugin);
  // define('ext:htm', textExtPlugin);
  // define('ext:md', textExtPlugin);
  // define('ext:svg', textExtPlugin);
  // define('ext:yml', textExtPlugin);
  // define('ext:yaml', textExtPlugin);

  // by default, directly loading css file doesn't inject style
  // define('ext:css', textExtPlugin);
  // to inject style with `import 'some.css';`
  // requirejs.undef('ext:css')
  // define('ext:css', {load: implement_inject_style})

  define('ext:wasm', {load: loadWasm});
}

// https://github.com/tc39/proposal-dynamic-import
// function _import(id) {
//   return userSpace.req(mappedId(id));
// }

// minimum support of requirejs config
// baseUrl
// paths, relative to baseUrl
// bundles, for code splitting
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
}

function arrayToHash(arr) {
  const hash = {};
  arr.forEach(i => hash[i] = 1);
  return hash;
}

const isBrowser = !!(typeof _global.navigator !== 'undefined' && typeof _global.document !== 'undefined');

define.switchToUserSpace = switchToUserSpace;
define.switchToPackageSpace = switchToPackageSpace;
define.currentSpace = () => currentSpace === userSpace ? 'user' : 'package';
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
requirejs.toUrl = id => toUrl(mappedId(id));
requirejs.resolveModuleId = resolveModuleId;

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

reset();
_global.define = define;
_global.requirejs = requirejs;

export default define;
