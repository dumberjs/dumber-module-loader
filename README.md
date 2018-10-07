# dumber-module-loader

A modern module loader, designed to work with the [dumber](https://github.com/huochunpeng/dumber).

dumber-module-loader is a loose [AMD](https://github.com/amdjs/amdjs-api) implementation, does not strictly follow the [AMD](https://github.com/amdjs/amdjs-api) spec.

## Our violation of AMD spec:

* AMD spec doesn't allow defining relative module `define('../package.json', ...)`. We allow it, this is to support `'../package.json'` that could be required by `src/app.js`. We say module id `'../package.json'` is above surface.
* only support plugin's `load()` function, doesn't support `normalize()` function, doesn't support `load.fromText()` function (not in spec, but some requirejs plugins use it). Note we support traditional `text!` and `json!` plugins out of the box. But plugins are considered legacy, use translators (see below) as much as possible.

## Our touch on AMD:

* mimic Node.js module resolving behaviour so dumber bundler can do less work.
  - in Node.js, `require('foo/bar')` could load file `foo/bar`, `foo/bar.js`, 'foo/bar.json', 'foo/bar/index.js', or 'foo/bar/index.json'.
  - we skipped `foo/bar.node` and `foo/bar/index.node` because them are binary file only works in Node.js.
* two name spaces: `user` (default, for local source file) and `package` (for npm packages and local packages).
  - module in `user` space can acquire `user` or `package` modules.
  - module in `package` space can only acquire `package` modules.
  - both `user` and `package` space can contain module with the same id. This is designed to avoid local `src/util.js` over-shadowing Node.js core module `util`.
* full support of Node.js circular dependencies (for some npm packages like [yallist](https://github.com/isaacs/yallist)). Requirejs supports some circular scenarios, but still fails at yallist, we don't.
* support translator, to transpile, transform raw content
  - by default, dumber-module-loader ships with translators for js/json/html/svg/css/wasm (wasm TBD).
  - default transolators support traditional text! and json! plugins. Note we didn't use traditional plugin module (with `load()` function) to implement traditional text! and json! plugins.
  - [TBD] dumber-babel-translator brings babel at runtime

## Difference from requirejs:
* no multi-contexts.
* only supports config on `baseUrl`, `paths`, `bundles` and `translators`.
* `data-main` attribute on script tag doesn't affect `baseUrl`, `data-main` is purely a module id.
* `paths` support is simplified.
  - supports absolute path like `"foo": "/foo"`
  - supports normal `"foo": "common/foo"`, resolve `foo/bar/lo` to `common/foo/bar/lo`. Note we treat `common/foo/bar/lo` as the real module id, it could result to an existing known module, or through remote fetch.
  - doesn't support `"foo": ["common/foo", "shared/foo"]` the fail-over array.
  - relative module resolution is simplified, it's a breaking change. We changed the behaviour because we think our behaviour is less surprising.
  ```js
  define('common/foo', ['./bar'], function (bar) { /* ... */ });
  requirejs.config({paths: {'foo': 'common/foo'}});
  requirejs(['foo'], function (foo) {
    // requirejs resolves './bar' to 'bar',
    // we resolves './bar' to 'common/bar'.
  });
  ```
* no automatic commonjs wrapping at runtime module fetching. For any module loaded remotely at runtime, we only support AMD anonymous module format, unless you supply a translator to deal with the raw content.
* `bundles` config is different, it needs two arrays, `'user'` and `'package'` for the two module spaces.
  - for example, `{"a-bundle": {"user": ['a', 'b'], "package": ["lodash", "jquery"]}}`.
  - if no module in `package` space, it can be written in requirejs compatible format, `{"a-bundle": ['a', 'b']}`.
* `require([...], callback, errback)` doesn't support optional config, errback only gets one error object.
* we only support browser/Worker/Node.js environments, didn't test on Rhino or any other environments.
* note there is no support of config of `package` or `map`.
* there is no support of shim. Shim is all done by dumber bundler.

## API

There globals, `define`, `requirejs` (same as `require`).

### `define(id? :string, deps?: string[], callback: function | any)`

Ref: https://github.com/amdjs/amdjs-api/blob/master/AMD.md

When `id` is absent, it defines an anonymous module. Anonymous module is only for runtime dynamically module loading.

### `requirejs(deps: string[], callback?: function, errback?: function)`

Ref: https://github.com/amdjs/amdjs-api/blob/master/require.md

When `errback` is called, it only gets one error object (an instance of `Error`);

### `define.switchToUserSpace()`

Switch to user module space, `define()` call after this will define module in user space.
User module space is the default module space.

### `define.switchToPackageSpace()`

Switch to package module space, `define()` call after this will define module in package space.

### `define.reset()`

Reset all config, remove all registered and defined modules, switch to default user space.

### `requirejs.config(options)`

Options supports:

##### 1. optional `baseUrl`

The default baseUrl is empty string `""`, the behaviour is same as `requirejs` default baseUrl `"./"`.

When dumber-module-loader tries to load a missing module 'foo/bar' at runtime, it will call fetch API `fetch("foo/bar.js")`.

The real url is relative to app's current route.
If there is `<base href="/some/folder/">` in html head, the real url is relative to `"/some/folder/"`, note the ending `"/"` is significant.

If you set `baseUrl` to `some/folder`, the resulting fetch call `fetch("some/folder/foo/bar.js")` is still relative to current route or `<base>` tag.

To ignore app's current route and `<base>` tag, set `baseUrl` to an absolute value like `/some/folder`, the resulting fetch call `fetch("/some/folder/foo/bar.js")` hits absolute URL.

##### 2. optional `paths`

Similar to `requirejs` paths, but simplified, see [above](#difference-from-requirejs).

##### 3. optional `bundles`

Tells dumber-module-loader what remote bundle file contains certain missing module. Note user and package space modules are listed separately.

```js
bundles: {
  app-bundle: {
    user: ['app', 'app.html', 'util', 'common/index'],
    package: ['lodash', 'lodash/map', 'util']
  }
}
```

for bundles only contain user space modules, a simplified config can be used.
```js
bundles: {
  app-bundle: ['app', 'app.html', 'util', 'common/index']
}
```

##### 4. optional `translators`

TBD. Design may change.

### `requirejs.definedValues()`

Return all defined module values `{"id": val, "id2": val2}`, excluding registered but not evaluated. This is to match existing behaviour of `requirejs` and `webpack`. Note if there is duplicated module id in user and package space, the user space module value will show up.

### `requirejs.defined(id: string)`

Check whether a module id is defined, excluding registered but not evaluated. This is to match existing behaviour of `requirejs`.


