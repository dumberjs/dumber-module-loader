import {ext, parse, resolveModuleId, relativeModuleId, nodejsIds} from './id-utils';

export class Space {
  // all registered modules, but not used yet.
  // once required (used), move to defined.
  // shape: {id, deps, callback}
  _registry = {};

  // temporary hold anonymous module
  _anonymous = null;

  // all defined modules
  // note callback is retained for possible demote
  // shape: {id, deps, callback, value}
  _defined = {};

  constructor(tesseract) {
    // tesseract controls spaces
    // shape: {req(id), global}
    this.tesseract = tesseract;
  }

  ids() {
    const ids = [...Object.keys(this._registry), ...Object.keys(this._defined)];
    return ids.sort();
  }

  has(id) {
    return this.registered(id) || this.defined(id);
  }

  registered(id) {
    const ids = nodejsIds(id);
    for (let i = 0, len = ids.length; i < len; i++) {
      if (this._registry.hasOwnProperty(ids[i])) {
        return this._registry[ids[i]];
      }
    }
  }

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
        deps = [];
    }

    // different from requirejs, we doesn't auto inject commonjs deps

    // named module
    if (id) {
      const parsed = parse(id);
      this._registry[parsed.cleanId] = {id: parsed.cleanId, deps, callback};
    }
    else this._anonymous = {deps, callback};
  }

  nameAnonymousModule(id) {
    if (this._anonymous) {
      const {deps, callback} = this._anonymous;
      this._anonymous = null;
      this._registry[id] = {id, deps, callback};
    }
  }

  // require an AMD module, return a promise
  // use 'req' instead of 'require' to avoid potential parsing problem.
  // param moduleId must be a clean id
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
      const extname = ext(id);
      const cjsModule = {
        exports: {},
        id,
        // used by __filename/__dirname wrapper in dumber
        filename: '/' + id + (extname ? '' : '.js')
      };
      let useCjsModule = false;

      const localDeps = {};
      return Promise.all(
        deps.map(d => {
          if (d === 'require') {
            // commonjs require
            return dep => localDeps[dep];
          } else if (d === 'module') {
            // commonjs module
            useCjsModule = true;
            return cjsModule;
          } else if (d === 'exports') {
            useCjsModule = true;
            // commonjs exports
            return cjsModule.exports;
          } else {
            return this.req(resolveModuleId(id, d))
              .then(got => {
                localDeps[d] = got;
                return got;
              });
          }
        })
      ).then(results => {
        let value;

        if (typeof callback === 'function') {
          value = callback.apply(this.tesseract.global, results);
        } else {
          value = callback;
        }

        if (useCjsModule) {
          value = cjsModule.exports;
        }

        // move the module from registry to defined
        // when moduleId is foo/bar,
        // id could be foo/bar or foo/bar/index
        delete this._registry[id];
        this._defined[id] = {id, deps, callback, value};

        return value;
      });
    }

    // ask tesseract
    return this.tesseract.req(moduleId);
  }

  _demoteDepended(id) {
    let depended = [];
    Object.keys(this._defined).forEach(_id => {
      const {deps} = this._defined[_id];
      if (deps.indexOf(id) !== -1) {
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
}
