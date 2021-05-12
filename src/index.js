import {version} from '../package.json';
import {cleanPath, ext, parse, nodejsIds, mapId, resolveModuleId} from './id-utils';
import makeSpace from './space';
import _global from './_global';
import {markPromise, isMarkedPromise, serialResults} from './promise-utils';

// Try prefix plugin (like text!mId) or extension plugin like "ext:css".
function tryPlugin(mId, space) {
  const parsed = parse(mId);
  const pluginId = parsed.prefix.slice(0, -1);
  // text,json,raw plugins are built-in
  if (pluginId) {
    if (pluginId !== 'text' && pluginId !== 'raw') {
      return markPromise(new Promise((resolve, reject) => {
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
          const onload = loaded => {
            space.define(mId, [], () => loaded);
            resolve(space.req(mId));
          };
          onload.error = err => reject(err);

          requirejs([pluginId], plugin => {
            // Call requirejs plugin api load(name, require, load, options)
            // Options set to {} just to make existing requirejs plugins happy.
            plugin.load(parsed.bareId, req, onload, {});
          });
        } catch (err) {
          reject(err);
        }
      }));
    }
  } else if (parsed.ext && parsed.ext !== '.js') {
    // Try extension plugin like "ext:css".
    const extPluginName = 'ext:' + parsed.ext.slice(1);
    if (userSpace.has(extPluginName) || packageSpace.has(extPluginName)) {
      return markPromise(new Promise((resolve, reject) => {
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
          const onload = loaded => {
            space.define(mId, [], () => loaded);
            resolve(space.req(mId));
          };
          onload.error = err => reject(err);

          requirejs([extPluginName], plugin => {
            // Call requirejs plugin api load(name, require, load, options)
            // Options set to {} just to make existing requirejs plugins happy.
            plugin.load(parsed.cleanId, req, onload, {});
          });
        } catch (err) {
          reject(err);
        }
      }));
    }
    // else by default use text! for any unknown extname
    if (space === userSpace || space.has('text!' + parsed.cleanId)) {
      return markPromise(new Promise(resolve => {
        space.alias(parsed.cleanId, 'text!' + parsed.cleanId);
        resolve(space.req(mId));
      }));
    }
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
    if (p) return p;

    try {
      // packageReq could be successful require in sync mode, or a
      // promise in async mode.
      // The only way we can get into async mode is that mId is
      // loaded by a remote bundle, it means at least the first
      // level mId is a package module.
      // So in async mode, any failure is considered final, no more
      // fall back to runtimeReq for a remote user space module
      return packageSpace.req(mId);
    } catch (err) {
      // Failure in sync mode.
      // Only do runtimeReq if mId fail immediately (not dep fail)
      // This means mId is not a known package space module, so
      // we could try to remotely load a user space module.

      if (err && err.__unkown === mId) {
        // This tryPlugin will actually do runtimeReq at the end,
        // because it cannot be found in any additional bundle.
        const tried = tryPlugin(mId, userSpace);
        // tried is a promise or undefined
        if (tried) return tried;
        return runtimeReq(mId);
      }

      throw err;
    }
  }
};

const userSpace = makeSpace(userSpaceTesseract);

const packageSpaceTesseract = {
  global: _global,
  mappedId,
  toUrl,
  // incoming id is already mapped
  // 1. try additional package module in bundles,
  // 2. try plugin in currently loaded package space
  req: mId => {
    try {
      return packageReqFromBundle(mId);
    } catch (err) {
      // Failure in sync mode.
      if (err && err.__unkown === mId) {
        const tried = tryPlugin(mId, packageSpace);
        // tried is a promise or undefined
        if (tried) return tried;
      }

      throw err;
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
let _idPaths = {};
let _urlPaths = {};

function mappedId(id) {
  return mapId(id, _idPaths);
}

// incoming id is already mapped
function toUrl(mId) {
  const parsed = parse(mId);
  let url = mapId(parsed.bareId, _urlPaths);

  if (url[0] !== '/' && !url.match(/^https?:\/\//)) {
    url = parse(_baseUrl + url).cleanId;
  }

  if (!ext(url)) {
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
      (new Function(text)).call(_global);
      // could be anonymous
      userSpace.nameAnonymous(parsedId.cleanId);
    });
  }
];

const _fetchUrl = url => {
  if (typeof _global.fetch === 'undefined') {
    return Promise.reject(new Error(`fetch API is not available, cannot fetch "${url}"`));
  }
  const options = url.match(/^(?:https?:)?\/\//) ? {mode: 'cors'} : {credentials: 'include'};
  return _global.fetch(url, options)
  .then(response => {
    if (response.ok) return response;
    throw new Error(`URL: ${url}\nResponse: ${response.status} ${response.statusText}`);
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
  return markPromise(_fetch(parsed.cleanId)
  .then(response => {
    // ensure default user space
    define.switchToUserSpace();

    for (let i = 0, len = _translators.length; i < len; i++) {
      const result = markPromise(_translators[i](parsed, response));
      if (isMarkedPromise(result)) return result;
    }
    throw new Error(`no runtime translator to handle ${parsed.cleanId}`);
  })
  .then(() => {
    if (userSpace.has(parsed.cleanId)) return userSpace.req(parsed.cleanId);
    throw new Error(`module "${parsed.cleanId}" is missing from url "${toUrl(mId)}"`);
  })
  .catch(err => {
    console.error(`could not load module "${parsed.cleanId}" from remote`); // eslint-disable-line no-console
    throw err;
  }));
}

// incoming id is already mapped
// return a promise to load additional bundle
// or return undefined.
function userReqFromBundle(mId) {
  const possibleIds = nodejsIds(mId);
  const bundleName = Object.keys(_bundles).find(bn => {
    const {nameSpace, user} = _bundles[bn];
    return possibleIds.some(d => {
      if (nameSpace) {
        const parsed = parse(d);
        if (parsed.bareId.slice(0, nameSpace.length + 1) === nameSpace + '/') {
          d = parsed.prefix + parsed.bareId.slice(nameSpace.length + 1);
        }
      }

      if (user.hasOwnProperty(d)) return true;
      const p = parse(d);
      // For module with unknown plugin prefix, try bareId.
      // This relies on dumber bundler's default behaviour, it write in bundle config
      // both 'foo.html' and 'text!foo.html'.
      if (p.prefix) return user.hasOwnProperty(p.bareId);
    });
  });

  if (bundleName) {
    return markPromise(loadBundle(bundleName)
    .then(() => {
      if (userSpace.has(mId)) return userSpace.req(mId);
      // mId is not directly defined in the bundle, it could be
      // behind a customised plugin or ext plugin.
      const tried = tryPlugin(mId, userSpace);
      if (tried) return tried;
      throw new Error(`module "${mId}" is missing from bundle "${bundleName}"`);
    }));
  }
}

// incoming id is already mapped
// return a promise to load additional bundle
// or throw an error to help userSpaceTesseract to identify sync return.
function packageReqFromBundle(mId) {
  const possibleIds = nodejsIds(mId);
  const bundleName = Object.keys(_bundles).find(bn =>
    possibleIds.some(d => {
      const pack = _bundles[bn].package;
      if (pack.hasOwnProperty(d)) return true;
      const p = parse(d);
      // For module with unknown plugin prefix, try bareId.
      // This relies on dumber bundler's default behaviour, it write in bundle config
      // both 'foo.html' and 'text!foo.html'.
      if (p.prefix) return pack.hasOwnProperty(p.bareId);
    })
  );

  if (bundleName) {
    return markPromise(loadBundle(bundleName)
    .then(() => {
      if (packageSpace.has(mId)) return packageSpace.req(mId);
      const tried = tryPlugin(mId, packageSpace);
      if (tried) return tried;
      throw new Error(`module "${mId}" is missing from bundle "${bundleName}"`);
    }));
  }

  const err = new Error(`no bundle for module "${mId}"`);
  err.__unkown = mId;
  throw err;
}

let _bundleLoad = {};
// return a promise
function loadBundle(bundleName) {
  if (!_bundleLoad[bundleName]) {
    const url = toUrl(bundleName);
    const {nameSpace} = _bundles[bundleName] || {};
    let job;

    // I really hate this.
    // Use script tag, not fetch, only to support sourcemaps.
    // And I don't know how to mock it up, so __skip_script_load_test
    if (!define.__skip_script_load_test &&
        isBrowser &&
        // no name space or browser has support of document.currentScript
        (!nameSpace || 'currentScript' in _global.document)) {
      job = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        if (nameSpace) {
          script.setAttribute('data-namespace', nameSpace);
        }
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
    }

    if (!job) {
      // in nodejs or web worker
      // or need name space in browser doesn't support document.currentScipt
      job = _fetchUrl(url)
      .then(response => response.text())
      .then(text => {
        // ensure default user space
        // the bundle itself may switch to package space in middle of the file
        switchToUserSpace();
        if (!nameSpace) {
          (new Function(text)).call(_global);
        } else {
          const wrapped = function(id, deps, cb) {
            nameSpacedDefine(nameSpace, id, deps, cb);
          };
          wrapped.amd = define.amd;
          wrapped.switchToUserSpace = switchToUserSpace;
          wrapped.switchToPackageSpace = switchToPackageSpace;
          const f = new Function('define', text);
          f.call(_global, wrapped);
        }
      });
    }

    _bundleLoad[bundleName] = job;
  }

  return _bundleLoad[bundleName];
}

function defined(id) {
  const mId = mappedId(id);
  return userSpace.defined(mId) || packageSpace.defined(mId);
}

function specified(id) {
  const mId = mappedId(id);
  return userSpace.has(mId) || packageSpace.has(mId);
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
  if (isBrowser && _global.document.currentScript) {
    const nameSpace = _global.document.currentScript.getAttribute('data-namespace');
    if (nameSpace) {
      return nameSpacedDefine(nameSpace, id, deps, callback);
    }
  }

  currentSpace.define(id, deps, callback);
}

// define.alias func to do an alias without define(fromId, [toId], m => m)
// this is very important for commonjs semantic (circular deps resolution).
define.alias = function(fromId, toId) {
  currentSpace.alias(fromId, toId);
};

// Special named spaced define
// Designed to load runtime extensions
function nameSpacedDefine(nameSpace, id, deps, callback) {
  // only add name space for modules in user space
  // also skip any ext: plugin (a dumber-module-loader feature)
  if (currentSpace === userSpace && id.slice(0, 4) !== 'ext:') {
    const parsed = parse(id);
    userSpace.define(parsed.prefix + nameSpace + '/' + parsed.bareId, deps, callback);
  } else {
    currentSpace.define(id, deps, callback);
  }
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

  const finalize = results => {
    if (callback) return callback.apply(_global, results);
    else return results;
  };

  const errHandler = err => {
    if (errback) return errback(err);
    else console.error(err); // eslint-disable-line no-console
  };

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

  let depValues;

  try {
    depValues = serialResults(deps, d => {
      if (d === 'require') return requireFunc;
      if (d instanceof RegExp) {
        const expanded = [...userSpace.ids(), ...packageSpace.ids()]
          .filter(id => nodejsIds(id).some(_id => _id.match(d)));
        return serialResults(expanded, e => userSpace.req(e));
      }
      return userSpace.req(mappedId(d));
    });
  } catch (err) {
    if (errback) {
      return errback(err);
    } else {
      return Promise.reject(err);
    }
  }

  if (isMarkedPromise(depValues)) {
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
    .then(
      obj => {
        load(obj.instance.exports);
      },
      load.error
    );
  });
}

function loadJson(name, req, load) {
  req(['text!' + name], text => {
    let obj;
    try {
      obj = JSON.parse(text);
    } catch (err) {
      load.error(err);
      return;
    }
    load(obj);
  });
}

function reset() {
  _baseUrl = '';
  _paths = {};
  _idPaths = {};
  _urlPaths = {};
  _bundles = {};
  _bundleLoad = {};

  userSpace.purge();
  packageSpace.purge();
  // load all built-in plugins in
  switchToPackageSpace();

  define('json', {load: loadJson});
  define('ext:json', {load: loadJson});

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
          nameSpace: spaces.nameSpace || null,
          user: arrayToHash(spaces.user || []),
          package: arrayToHash(spaces.package || [])
        };
      }
    });
  }

  // Update idPaths and urlPaths.
  const idPaths = {};
  const urlPaths = {};
  Object.keys(_paths).forEach(k => {
    // Skip path for bundle, they are not for id mapping.
    // This fixes an id mapping bug when a named space bundle uses
    // same name for name space and bundle name.
    if (_bundles.hasOwnProperty(k) || _paths[k].match(/^(?:https?:)?\//)) {
      // For bundle path, https://, or /root/path
      urlPaths[k] = _paths[k];
    } else {
      idPaths[k] = _paths[k];
    }
  });

  _idPaths = idPaths;
  _urlPaths = urlPaths;
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
define.nameAnonymous = (id) => {
  const parsed = parse(id);
  currentSpace.nameAnonymous(parsed.cleanId);
};
define.reset = reset;
// define.import = _import;
requirejs.config = config;
requirejs.definedValues = definedValues;

// for compatibility with requirejs
define.amd = {jQuery: true};
requirejs.defined = defined;
requirejs.specified = specified;
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
