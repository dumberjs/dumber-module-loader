
import {version} from '../package.json';
import {cleanPath, parse, nodejsIds} from './id-utils';
import {Space} from './space';
import _global from './_global';

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

function urlsForId(id) {
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
  const urls = [];
  let url = _baseUrl + idPath;
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

    // TODO
    // return response.blob();
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
      // TODO support customise translators
      // right now, only support normal AMD module
      (new Function(text))();
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

function runtimeReq(id) {
  const parsed = parse(id);
  return _fetch(id)
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
    // could be anonymous
    userSpace.nameAnonymousModule(parsed.cleanId);
    if (userSpace.has(parsed.cleanId)) {
      return userSpace.req(parsed.cleanId);
    } else {
      throw new Error(`module "${id}" is missing from url "${JSON.stringify(urlsForId(id))}"`);
    }
  });
}

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
  return _fetch(bundleName)
  .then(response => response.text())
  .then(text => {
    // ensure default user space
    // the bundle itself may switch to package space in middle of the file
    switchToUserSpace();
    (new Function(text))();
  });
}

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

  return Promise.all(deps.map(d => userSpace.req(d)))
  .then(
    results => {
      if (callback) callback.apply(_global, results);
    },
    err => {
      if (errback) return errback(err);
    }
  );
}

// AMD requirejs.undef
// TODO design for HMR (hot-module-reload)
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
//   return userSpace.req(id);
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

// TODO set baseUrl to 'scripts' for <script data-main="scripts/main.js" src="scripts/require.js"></script>

define.switchToUserSpace = switchToUserSpace;
define.switchToPackageSpace = switchToPackageSpace;
define.reset = reset;
// define.import = _import;
requirejs.config = config;

// for compatibility with requirejs
define.amd = {jQuery: true};
requirejs.defined = defined;
requirejs.isBrowser = !!(typeof window !== 'undefined' && typeof navigator !== 'undefined' && window.document);
requirejs.version = version;
requirejs.undef = undef;

_global.define = define;
_global.requirejs = requirejs;

export default define;



