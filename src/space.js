import {ext, parse, resolveModuleId, relativeModuleId, nodejsIds} from './id-utils';
import serialResults from './serial-results';

const commentRegExp = /\/\*[\s\S]*?\*\/|([^:"'=]|^)\/\/.*$/mg;
const cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g;
//Could match something like ')//comment', do not lose the prefix to comment.
function commentReplace(match, singlePrefix) {
  return singlePrefix || '';
}

const cjs_require = 'require';
const cjs_exports = 'exports';
const cjs_module = 'module';

// avoid using class
// in order to have true private variables,
// plus enabling great compression through terser.
export default function(tesseract) {
  // tesseract controls spaces
  // shape: {req(id), mappedId(id), toUrl, global}

  // all registered modules, but not used yet.
  // once required (used), move to defined.
  // shape: {id: {id, deps, cb}}
  let _registry = {};

  // temporary hold anonymous module
  // shape: {deps, cb}
  let _anonymous = null;

  // all defined modules
  // note cb is retained for possible demote
  // shape: {id: {id, deps, cb, val}}
  let _defined = {};

  // modules promoting from _registry to _defined.
  // shape: {id: {id, exports, filename}}
  let _promoting = {};

  function ids() {
    const ids = [...Object.keys(_registry), ...Object.keys(_defined)];
    return ids.sort();
  }

  // incoming id is a mapped id
  function has(id) {
    return registered(id) || defined(id);
  }

  // incoming id is a mapped id
  function registered(id) {
    const ids = nodejsIds(id);
    for (let i = 0, len = ids.length; i < len; i++) {
      if (_registry.hasOwnProperty(ids[i])) {
        return _registry[ids[i]];
      }
    }
  }

  // incoming id is a mapped id
  function defined(id) {
    const ids = nodejsIds(id);
    for (let i = 0, len = ids.length; i < len; i++) {
      if (_defined.hasOwnProperty(ids[i])) {
        return _defined[ids[i]];
      }
    }
  }

  // AMD define
  function define(id, deps, cb) {
    // anonymous module
    if (typeof id !== 'string') {
      cb = deps;
      deps = id;
      id = null;
    }

    if (!Array.isArray(deps)) {
      cb = deps;
      deps = null;
    }

    // fill-up CommonJS dependencies.
    if (!deps) {
      deps = [];

      //Remove comments from the cb string,
      //look for require calls, and pull them into the dependencies,
      //but only if there are function args.
      if (typeof cb === 'function' && cb.length) {
        cb
          .toString()
          .replace(commentRegExp, commentReplace)
          .replace(cjsRequireRegExp, function (match, dep) {
            deps.push(dep);
          });

        //May be a CommonJS thing even without require calls, but still
        //could use exports, and module. Avoid doing exports and module
        //work though if it just needs require.
        //REQUIRES the function to expect the CommonJS variables in the
        //order listed below.
        deps = (cb.length === 1 ? [cjs_require] : [cjs_require, cjs_exports, cjs_module]).concat(deps);
      }
    }

    // named module
    if (id) {
      const parsed = parse(id);
      _registry[parsed.cleanId] = {id: parsed.cleanId, deps, cb};
    }
    else _anonymous = {deps, cb};
  }

  // incoming id is a mapped id
  function nameAnonymous(id) {
    if (_anonymous) {
      const {deps, cb} = _anonymous;
      _anonymous = null;
      _registry[id] = {id, deps, cb};
    }
  }

  function isCircular(mId) {
    let targetId;

    const _isCircular = _id => {
      const candidate = _registry[_id];
      if (!candidate) return;
      const {id, deps} = candidate;
      if (targetId) {
        if (targetId === id) return true;
      } else {
        targetId = id;
      }

      for (let i = 0, len = deps.length; i < len; i++) {
        const d = deps[i];
        if (d === cjs_require || d === cjs_exports || d === cjs_module) continue;
        const absoluteId = resolveModuleId(id, d);
        const _mId = tesseract.mappedId(absoluteId);

        if (_isCircular(_mId)) return true;
      }
    };

    return _isCircular(mId);
  }

  // require an AMD module val
  // return val synchronously as much as possible,
  // or return a promise.
  // use 'req' instead of 'require' to avoid potential parsing problem.
  // param moduleId must be a clean mapped id
  function req(moduleId) {
    if (moduleId === cjs_require || moduleId === cjs_exports || moduleId === cjs_module) {
      throw new Error(`cannot require reserved keyword "${moduleId}"`);
    }

    const def = defined(moduleId);
    if (def) {
      return def.val;
    }

    const reg = registered(moduleId);
    // ask tesseract, note moduleId is mapped
    if (!reg) return tesseract.req(moduleId);

    const {id, deps, cb} = reg;

    if (_promoting.hasOwnProperty(id)) {
      // in circular dependency, early return cjsModule.exports.
      return _promoting[id].exports;
    }

    const extname = ext(id);
    const cjsModule = {
      exports: {},
      id,
      // used by __filename/__dirname wrapper in dumber
      filename: '/' + id + (extname ? '' : '.js')
    };
    let useCjsModule = false;
    _promoting[id] = cjsModule;

    const requireFunc = dep => {
      const absoluteId = resolveModuleId(id, dep);
      const mId = tesseract.mappedId(absoluteId);
      const depDefined = defined(mId);

      if (depDefined) {
        return depDefined.val;
      }

      if (_promoting.hasOwnProperty(mId)) {
        // in circular dependency, early return cjsModule.exports.
        return _promoting[mId].exports;
      }

      if (registered(mId)) {
        // try inline load
        const result = req(mId);

        if (result && typeof result.then === 'function') {
          throw new Error(`module "${mId}" cannot be resolved synchronously.`);
        }

        return result;
      }

      throw new Error(`module "${mId}" is not prepared.`);
    };
    requireFunc.toUrl = tesseract.toUrl;

    const depValues = serialResults(deps, d => {
      if (d === cjs_require) {
        // commonjs require
        return requireFunc;
      } else if (d === cjs_module) {
        // commonjs module
        useCjsModule = true;
        return cjsModule;
      } else if (d === cjs_exports) {
        useCjsModule = true;
        // commonjs exports
        return cjsModule.exports;
      } else {
        const absoluteId = resolveModuleId(id, d);
        const mId = tesseract.mappedId(absoluteId);
        const def = defined(mId);

        if (def) {
          return def.val;
        }

        // pro-actively detecting circular dependency within one space of loaded bundles
        // 1. don't need to check across spaces, there is no circular dependency between
        // user and package spaces, as user -> package is one way.
        // 2. Nodejs circular dependency only happens within one npm package, as long as
        // user didn't split circular depended modules to multiple bundles, we are fine.
        if (isCircular(mId)) {
          // follow commonjs require() semantic, to be resolved at code running time
          return;
        }

        return req(mId);
      }
    });

    const finalize = results => {
      let val;

      if (typeof cb === 'function') {
        val = cb.apply(tesseract.global, results);
      } else {
        val = cb;
      }

      if (val === undefined && useCjsModule) {
        val = cjsModule.exports;
      }

      // move the module from registry to defined
      // when moduleId is foo/bar,
      // id could be foo/bar or foo/bar/index
      delete _registry[id];
      delete _promoting[id];
      _defined[id] = {id, deps, cb, val};

      return val;
    };

    // asynchronous return
    if (depValues && typeof depValues.then === 'function') {
      return depValues.then(
        finalize,
        err => {
          delete _promoting[id];
          throw err;
        }
      );
    }

    // synchronous return
    return finalize(depValues);
  }

  function _demoteDepended(did) {
    let depended = [];
    Object.keys(_defined).forEach(_id => {
      const {id, deps} = _defined[_id];
      if (deps.some(d => {
        const absoluteId = resolveModuleId(id, d);
        const mId = tesseract.mappedId(absoluteId);
        return mId === did;
      })) {
        depended.push(_id);
      }
    });

    depended.forEach(d => {
      _demoteDepended(d);
      const {deps, cb} = _defined[d];
      delete _defined[d];
      _registry[d] = {id: d, deps, cb};
    });
  }

  function undef(id) {
    const def = defined(id);
    if (def) {
      _demoteDepended(def.id);
      delete _defined[def.id];
      return;
    }

    const reg = registered(id);
    if (reg) {
      delete _registry[reg.id];
    }
  }

  function purge() {
    _registry = {};
    _anonymous = null;
    _defined = {};
  }

  return {
    ids,
    has,
    registered,
    defined,
    define,
    nameAnonymous,
    req,
    undef,
    purge
  };
}
