
import {version} from '../package.json';
import {cleanPath, parse, nodejsIds} from './id-utils';
import {Space} from './space';
import _global from './_global';

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
  mappedId,
  toUrl,
  // incoming id is already mapped
  req: additionalPackageReq // try additional package module in bundles
};

const packageSpace = new Space(packageSpaceTesseract);

let currentSpace = userSpace;

function switchToUserSpace() {
  currentSpace = userSpace;
}

function switchToPackageSpace() {
  currentSpace = packageSpace;
}

// AMD configs
// same as requirejs baseUrl, paths,
let _baseUrl = './';
let _paths = {};

function mappedId(id) {
  const parsed = parse(id);
  let idPath = parsed.bareId;
  const pathKeys = Object.keys(_paths);
  for (let i = 0, len = pathKeys.length; i < len; i++) {
    const k = pathKeys[i];
    if (idPath.length >= k.length && idPath.substring(0, k.length) === k) {
      idPath = _paths[k] + idPath.substring(k.length);
      break;
    }
  }
  return parsed.prefix + idPath;
}

// incoming id is already mapped
function urlsForId(id) {
  const parsed = parse(id);
  const urls = [];
  let url = _baseUrl + parsed.bareId;
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
    // note incoming arrays were saved in Set internally
    user: ['app', 'app.html', 'util', 'common/index'],
    package: ['lodash', 'lodash/map', 'util']
  }
}
*/
let _bundles = {};

// translators for runtime loaded content
const _translators = [
  // TODO default js file translator, translate text to (new Function(text))()

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
      userSpace.nameAnonymousModule(parsedId.cleanId);
    });
  }
];

const fetchUrl = url => {
  return fetch(url, {credentials: 'include'})
  .then(response => {
    if (response.ok) {
      return response;
    } else {
      throw new Error(`${response.status} ${response.statusText}`);
    };
  });
};

// incoming id is already mapped
const _fetch = id => {
  const urls = urlsForId(id);
  const len = urls.length;

  if (len === 1) return fetchUrl(urls[0]);

  // only 2 urls available, foo.min.js, foo.min

  return fetchUrl(urls[0]).catch(err0 => {
    return fetchUrl(urls[1]).catch(err1 => {
      throw new Error(err0.message + '\n' + err1.message);
    });
  });
};

// incoming id is already mapped
function runtimeReq(id) {
  const parsed = parse(id);
  return _fetch(parsed.cleanId)
  .then(response => {
    // ensure default user space
    define.switchToUserSpace();

    for (let i = 0, len = _translators.length; i < len; i++) {
      const result = _translators[i](parsed, response);
      if (result && result.then) {
        return result;
      }
    }
    throw new Error(`no runtime translator to handle ${parsed.cleanId}`);
  })
  .then(() => {
    if (userSpace.has(parsed.cleanId)) {
      return userSpace.req(parsed.cleanId);
    } else {
      throw new Error(`module "${parsed.cleanId}" is missing from url "${JSON.stringify(urlsForId(id))}"`);
    }
  });
}

// incoming id is already mapped
function additionalUserReq(id) {
  const possibleIds = nodejsIds(id);
  const bundleName = Object.keys(_bundles).find(bn =>
    possibleIds.some(d => _bundles[bn].user.has(d))
  );

  if (bundleName) {
    return loadBundle(bundleName)
    .then(() => {
      if (userSpace.has(id)) {
        return userSpace.req(id);
      } else {
        throw new Error(`module "${id}" is missing from bundle "${bundleName}"`);
      }
    });
  }

  return Promise.reject(new Error(`no bundle for module "${id}"`));
}

// incoming id is already mapped
function additionalPackageReq(id) {
  const possibleIds = nodejsIds(id);
  const bundleName = Object.keys(_bundles).find(bn =>
    possibleIds.some(d => _bundles[bn].package.has(d))
  );

  if (bundleName) {
    return loadBundle(bundleName)
    .then(() => {
      if (packageSpace.has(id)) {
        return packageSpace.req(id);
      } else {
        throw new Error(`module "${id}" is missing from bundle "${bundleName}"`);
      }
    });
  }

  return Promise.reject(new Error(`no bundle for module "${id}"`));
}

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

// incoming id is already mapped
function defined(id) {
  return !!(userSpace.defined(id) || packageSpace.defined(id));
}

// AMD define
function define(id, deps, callback) {
  currentSpace.define(id, deps, callback);
}

// AMD require
// different from requirejs:
// 1. we don't support optional config
// 2. errback only gets one error object
function requirejs(deps, callback, errback) {
  if (!Array.isArray(deps)) throw new Error('missing dependencies array');
  if (callback && typeof callback !== 'function') throw new Error('callback is not a function');
  if (errback && typeof errback !== 'function') throw new Error('errback is not a function');

  const localDeps = {};
  // return AMD require function or commonjs require function
  function requireFunc() {
    if (typeof arguments[0] === 'string') {
      const dep = arguments[0];
      if (localDeps.hasOwnProperty(dep)) {
        return localDeps[dep];
      } else {
        throw new Error(`commonjs dependency "${dep}" is not prepared.`);
      }
    } else {
      return requirejs.apply(null, arguments);
    }
  };

  requireFunc.toUrl = toUrl;

  return Promise.all(deps.map(d => {
    if (d === 'require') {
      return Promise.resolve(requireFunc);
    } else {
      return userSpace.req(mappedId(d))
      .then(r => {
        localDeps[d] = r;
        return r;
      });
    }
  }))
  .then(
    results => {
      if (callback) callback.apply(_global, results);
    },
    err => {
      if (errback) return errback(err);
      else console.error(err);
    }
  );
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
  _baseUrl = './';
  _paths = {};
  _bundles = {};

  userSpace.purge();
  packageSpace.purge();
}

// https://github.com/tc39/proposal-dynamic-import
// function _import(id) {
//   return userSpace.req(mappedId(id));
// }

// minimum support of requirejs config
// baseUrl
// paths, relative to baseUrl
// bundles, for code splitting
// translators, for module loading
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
      _bundles[bundleName] = {
        user: new Set(spaces.user || []),
        package: new Set(spaces.package || [])
      };
    });
  }

  if (opts.translators) {
    _translators.unshift(...opts.translators);
  }
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



