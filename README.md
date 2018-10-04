# dumber-module-loader

A modern module loader, designed to work with the [dumber](https://github.com/huochunpeng/dumber), only works in browser.

dumber-module-loader is a loose [AMD](https://github.com/amdjs/amdjs-api) implementation, is not 100% compatible with the AMD spec.

## Our violation of AMD spec:

* AMD spec doesn't allow defining relative module `define('../package.json', ...)`. We allow it, this is to support `'../package.json'` that could be required by `src/app.js`. We call module id `'../package.json'` above surface.
* plugin support is totally different, although we support traditional `text!` and `json!` plugins out of the box. We use translators to support flexible module preparing at runtime. [TBD] how translator works at dumber bundling time?

## Our touch on AMD:

* mimic Node.js module resolving behaviour so dumber bundler can do less work.
* two name spaces: 'user' (default) and 'package' (for npm packages and local packages).
  - module in user space can acquire user and package modules
  - module in package space can only acquire package modules
  - both user and package space can contain module with same id. This is designed to avoid user `src/util.js` over-shadowing Nodejs core module `util`.
* work around circular dependencies (for some npm packages like [yallist](https://github.com/isaacs/yallist)). Requirejs fails at yallist, we don't.
* support translator, to transpile, transform raw content
  - by default, dumber-module-loader ships with translators for js/json/html/svg/css/wasm (wasm TBD), plus support of traditional text! and json! plugins.
  - [TBD] dumber-babel-translator brings babel at runtime

## Difference from requirejs:
* no multi-contexts.
* only supports config on baseUrl, paths, bundles and translators.
* data-main attribute on script tag doesn't affect baseUrl, data-main is purely a module id.
* paths support is simplified.
  - doesn't support absolute path like `"foo": "/foo"`. Only do `"foo": "common/foo"` which `common/foo` is relative to baseUrl.
  - doesn't support `"foo": ["common/foo", "shared/foo"]` failover array.
  - relative module resolution is simplified as a breaking change.
  ```js
  define('common/foo', ['./bar'], function (bar) { /* ... */ });
  requirejs.config({paths: {'foo': 'common/foo'}});
  requirejs(['foo'], function (foo) {
    // requirejs resolves './bar' to 'bar',
    // we resolves './bar' to 'common/bar'
  });
  ```
* no automatic commonjs wrapping at runtime module fetching. At runtime, we only support AMD anonymous module format, unless you supply a translator to deal with raw content.
* bundles config format is different, it needs two arrays, 'user' and 'package' for the two module spaces.
  - for example, `{"a-bundle": {"user": ['a', 'b'], "package": ["lodash", "jquery"]}}`.
* require([...], callback, errback) doesn't support optional config, errback only gets one error object.
* we only support browser/worker/Nodejs environments, didn't test on Rhino or any other environments.
* note there is no support of config on package/map.
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


