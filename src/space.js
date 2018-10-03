import {ext, parse, resolveModuleId, relativeModuleId, nodejsIds} from './id-utils';
import promiseSerial from './promise-serial';

const commentRegExp = /\/\*[\s\S]*?\*\/|([^:"'=]|^)\/\/.*$/mg;
const cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g;
//Could match something like ')//comment', do not lose the prefix to comment.
function commentReplace(match, singlePrefix) {
    return singlePrefix || '';
}

export class Space {
  constructor(tesseract) {
    // tesseract controls spaces
    // shape: {req(id), mappedId(id), toUrl, global}
    this.tesseract = tesseract;

    // all registered modules, but not used yet.
    // once required (used), move to defined.
    // shape: {id: {id, deps, callback}}
    this._registry = {};

    // temporary hold anonymous module
    // shape: {deps, callback}
    this._anonymous = null;

    // all defined modules
    // note callback is retained for possible demote
    // shape: {id: {id, deps, callback, value}}
    this._defined = {};

    // modules promoting from _registry to _defined.
    // shape: {id: {id, exports, filename}}
    this._promoting = {};
  }

  ids() {
    const ids = [...Object.keys(this._registry), ...Object.keys(this._defined)];
    return ids.sort();
  }

  // incoming id is a mapped id
  has(id) {
    return this.registered(id) || this.defined(id);
  }

  // incoming id is a mapped id
  registered(id) {
    const ids = nodejsIds(id);
    for (let i = 0, len = ids.length; i < len; i++) {
      if (this._registry.hasOwnProperty(ids[i])) {
        return this._registry[ids[i]];
      }
    }
  }

  // incoming id is a mapped id
  defined(id) {
    const ids = nodejsIds(id);
    for (let i = 0, len = ids.length; i < len; i++) {
      if (this._defined.hasOwnProperty(ids[i])) {
        return this._defined[ids[i]];
      }
    }
  }

  // AMD define
  define(id, deps, callback) {
    // anonymous module
    if (typeof id !== 'string') {
      callback = deps;
      deps = id;
      id = null;
    }

    if (!Array.isArray(deps)) {
      callback = deps;
      deps = null;
    }

    //If no name, and callback is a function, then figure out if it a
    //CommonJS thing with dependencies.
    if (!deps) {
      deps = [];

      //Remove comments from the callback string,
      //look for require calls, and pull them into the dependencies,
      //but only if there are function args.
      if (typeof callback === 'function' && callback.length) {
        callback
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
        deps = (callback.length === 1 ? ['require'] : ['require', 'exports', 'module']).concat(deps);
      }
    }

    // named module
    if (id) {
      const parsed = parse(id);
      this._registry[parsed.cleanId] = {id: parsed.cleanId, deps, callback};
    }
    else this._anonymous = {deps, callback};
  }

  // incoming id is a mapped id
  nameAnonymousModule(id) {
    if (this._anonymous) {
      const {deps, callback} = this._anonymous;
      this._anonymous = null;
      this._registry[id] = {id, deps, callback};
    }
  }

  // require an AMD module, return a promise
  // use 'req' instead of 'require' to avoid potential parsing problem.
  // param moduleId must be a clean mapped id
  req(moduleId) {
    if (moduleId === 'require' || moduleId === 'module' || moduleId === 'exports') {
      throw new Error(`cannot require commonjs global "${moduleId}"`);
    }

    const defined = this.defined(moduleId);

    if (defined) {
      return Promise.resolve(defined.value);
    }

    const registered = this.registered(moduleId);

    if (registered) {
      const {id, deps, callback} = registered;

      if (this._promoting.hasOwnProperty(id)) {
        // in circular dependency, early return cjsModule.exports.
        return Promise.resolve(this._promoting[id].exports);
      }

      const extname = ext(id);
      const cjsModule = {
        exports: {},
        id,
        // used by __filename/__dirname wrapper in dumber
        filename: '/' + id + (extname ? '' : '.js')
      };
      let useCjsModule = false;
      this._promoting[id] = cjsModule;

      const requireFunc = dep => {
        const absoluteId = resolveModuleId(id, dep);
        const mId = this.tesseract.mappedId(absoluteId);
        const depDefined = this.defined(mId);

        if (depDefined) {
          return depDefined.value;
        }

        if (this._promoting.hasOwnProperty(id)) {
          // in circular dependency, early return cjsModule.exports.
          return Promise.resolve(this._promoting[id].exports);
        }

        throw new Error(`commonjs dependency "${dep}" is not prepared.`);
      };
      requireFunc.toUrl = this.tesseract.toUrl;

      return promiseSerial(deps, d => {
        if (d === 'require') {
          // commonjs require
          return requireFunc;
        } else if (d === 'module') {
          // commonjs module
          useCjsModule = true;
          return cjsModule;
        } else if (d === 'exports') {
          useCjsModule = true;
          // commonjs exports
          return cjsModule.exports;
        } else {
          const absoluteId = resolveModuleId(id, d);
          const mId = this.tesseract.mappedId(absoluteId);
          return this.req(mId);
        }
      })
      .then(
        results => {
          let value;

          if (typeof callback === 'function') {
            value = callback.apply(this.tesseract.global, results);
          } else {
            value = callback;
          }

          if (value === undefined && useCjsModule) {
            value = cjsModule.exports;
          }

          // move the module from registry to defined
          // when moduleId is foo/bar,
          // id could be foo/bar or foo/bar/index
          delete this._registry[id];
          delete this._promoting[id];
          this._defined[id] = {id, deps, callback, value};

          return value;
        },
        err => {
          delete this._promoting[id];
          throw err;
        }
      );
    }

    // ask tesseract, note moduleId is mapped
    return this.tesseract.req(moduleId);
  }

  _demoteDepended(did) {
    let depended = [];
    Object.keys(this._defined).forEach(_id => {
      const {id, deps} = this._defined[_id];
      if (deps.some(d => {
        const absoluteId = resolveModuleId(id, d);
        const mId = this.tesseract.mappedId(absoluteId);
        return mId === did;
      })) {
        depended.push(_id);
      }
    });

    depended.forEach(d => {
      this._demoteDepended(d);
      const {deps, callback} = this._defined[d];
      delete this._defined[d];
      this._registry[d] = {id: d, deps, callback};
    });
  }

  undef(id) {
    const defined = this.defined(id);
    if (defined) {
      this._demoteDepended(defined.id);
      delete this._defined[defined.id];
      return;
    }

    const registered = this.registered(id);
    if (registered) {
      delete this._registry[registered.id];
    }
  }

  purge() {
    this._registry = {};
    this._anonymous = null;
    this._defined = {};
  }
}
