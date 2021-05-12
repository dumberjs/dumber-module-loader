# dumber-module-loader ![CI](https://github.com/dumberjs/dumber-module-loader/workflows/CI/badge.svg)

A modern AMD module loader, used by [dumber](https://github.com/dumberjs/dumber) bundler internally.

dumber-module-loader is a loose [AMD](https://github.com/amdjs/amdjs-api) implementation, does not strictly follow the [AMD](https://github.com/amdjs/amdjs-api) spec.

For users of dumber bundler, you only need to know that the internal module loader is an AMD loader, similar to requirejs. The good old AMD gives dumber bundler intuitive code splitting, and flexible runtime composition.

## Our violation on AMD spec:

* AMD spec doesn't allow defining module id starting with '..', `define('../package.json', ...)`. We allow it. This is to support dependency `'../package.json'` that could be required by `src/app.js`. We say module id `'../package.json'` is above surface.
* Only supports plugin's `load()` function, doesn't support `normalize()` function, doesn't support `load.fromText()` function (not in spec, but some requirejs plugins use it). Note there is built-in support of traditional `text!` and `json!` plugins out of the box.
* Special RegExp support for mass require, mainly for test runner.
```js
requirejs([/\.spec$/], function() {
});
```

## Our touch on AMD:

* Mimic Node.js module resolving behaviour so dumber bundler can do less work.
  - `require('foo/bar')` could load module `foo/bar`, `foo/bar.js`, `foo/bar.json`, `foo/bar/index.js`, or `foo/bar/index.json`.
  - if there is a `package.json` file in folder `foo/bar/`, it can load file `foo/bar/resolved/main.js`, dumber will build an alias `foo/bar/index` to `foo/bar/resolved/main.js`.
* Two module spaces: `user` (default, for local source file) and `package` (for npm packages and local packages).
  - module in `user` space can acquire `user` or `package` modules.
  - module in `package` space can only acquire `package` modules.
  - both `user` and `package` space can contain module with the same id. This is designed to avoid local `src/util.js` over-shadowing Node.js core module `util`.
* Full support of Node.js circular dependencies (for packages like [yallist](https://github.com/isaacs/yallist), note yallist 3.0.3 has removed circular dependency).
* Besides normal plugin, we support ext plugin which targets ext name.
  - by default, dumber-module-loader ships with ext plugins for json/html/svg/css/wasm (do not yet support wasm importObjects).
  - all ext plugins should resolve the underneath content using one of our three predefined plugins: `text!`, `json!`, and `raw!`.
  - `text!some.fie` will resolve to the text content of the file, at runtime it uses fetch API `reponse.text()` to get the content.
  - `json!some.fie` will resolve to the parsed json, at runtime it uses fetch API `reponse.json()` to parse the content.
  - `raw!some.fie` will resolve to fetch API `reponse`, note the result is a promise, not final value.
  - for instance, our default html support is implemented as

  ```js
  define('ext:html', {load: function(name, req, load) {
    req(['text!' + name], text => load(text));
  }});
  ```
  - note, our default css support is just returning the text content, same as our html support. By default, it doesn't inject style sheet to html head. However dumber bundler by default overrides the default `'ext:css'` plugin to support style sheet injection.

## Difference from requirejs:
* No multi-contexts.
* Only supports config on `baseUrl`, `paths`, and `bundles`.
* `data-main` attribute on script tag doesn't affect `baseUrl`, `data-main` is purely a module id.
* `paths` support is simplified.
  - supports absolute path like `"foo": "/foo"`
  - supports normal `"foo": "common/foo"`, resolve `foo/bar/lo` to `common/foo/bar/lo`. Note we treat `common/foo/bar/lo` as the real module id, it could result to an existing known module, otherwise go through remote fetch.
  - doesn't support `"foo": ["common/foo", "shared/foo"]` the fail-over array.
  - relative module resolution is simplified. This is a breaking change. We changed the behaviour because we think our behaviour is less surprising.

```js
define('common/foo', ['./bar'], function (bar) { /* ... */ });
requirejs.config({paths: {'foo': 'common/foo'}});
requirejs(['foo'], function (foo) {
  // requirejs resolves './bar' to 'bar',
  // we resolves './bar' to 'common/bar'.
});
```
* No automatic commonjs wrapping for runtime fetched module. For any module loaded remotely at runtime, we only support AMD anonymous module format, unless you supply a plugin to deal with the raw content.
* `bundles` config is different, it needs two arrays, `'user'` and `'package'` for the two module spaces.
  - for example, `{"a-bundle": {"user": ['a', 'b'], "package": ["lodash", "jquery"]}}`.
  - if no module in `package` space, it can be written in requirejs compatible format, `{"a-bundle": ['a', 'b']}`.
* `require([...], callback, errback)` doesn't support optional config, errback only gets one error object.
* We only support browser/Worker/Node.js environments, didn't test on Rhino or any other environments.
* Note there is no support of `package` or `map` config.
* There is no support of shim. Shim is all done by dumber bundler.

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

### `define.currentSpace()`

Returns `"user"` if current space is user space, or `"package"` if current space is packaeg space. Current space only affects `define()` call, it doesn't affect `requirejs()` call.

### `define.nameAnonymous(id)`

Provide a module id for the last anonymous module defined like `define([deps], function() {})`. The new module id is defined on current space (either user space or package space).
When there is no anonymous module defined, this method will do nothing.

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

`nameSpace` is optional, it's designed to [load foreign bundle file at runtime](https://github.com/dumberjs/examples/tree/master/runtime-composition-aurelia).

When `nameSpace` is in use, all modules in user module space will be prefixed with `optional-name-space/`. For instance, `app` module is name spaced as `optional-name-space/app`. Note all modules in package module space are not affected, for instance, `lodash` will still be `lodash`.

```js
bundles: {
  'app-bundle': {
    nameSpace: 'optional-name-space',
    user: ['app', 'app.html', 'util', 'common/index'],
    package: ['lodash', 'lodash/map', 'util']
  }
}
```

for bundles only contain user space modules, a simplified config can be used.
```js
bundles: {
  'app-bundle': ['app', 'app.html', 'util', 'common/index']
}
```

### `requirejs.definedValues()`

Return all defined module values `{"id": val, "id2": val2}`, excluding registered but not evaluated. This is to match existing behaviour of `requirejs` and `webpack`. Note if there is duplicated module id in user and package space, the user space module value will show up.

### `requirejs.defined(id: string)`

Check whether a module id is defined, excluding registered but not evaluated. This is to match existing behaviour of `requirejs`.

### `requirejs.specified(id: string)`

Check whether a module id is defined or registered but not evaluated. This is to match existing behaviour of `requirejs`.
