# dumber-module-loader

A modern module loader, designed to work with the [dumber](https://github.com/huochunpeng/dumber), only works in browser.

dumber-module-loader is a loose [AMD](https://github.com/amdjs/amdjs-api) implementation, is not 100% compatible with the AMD spec.

Our violation of AMD spec:

* AMD spec doesn't allow defining relative module `define('../package.json', ...)`. We allow it, this is to support `'../package.json'` that could be required by `src/app.js`. We call module id `'../package.json'` above surface.
* simplified implementation on dealing with circular dependencies. The deps order is important in case of circular dependencies. Note AMD circular deps only work if one of the runtime dep acquiring is delayed (like `require('dep')` call inside a function to be called later).
* plugin support is totally different, although we support traditional `text!` and `json!` plugins out of the box. We use translators to support flexible module preparing at runtime. [TBD] how translator works at dumber bundling time?

Our touch on AMD:

* mimic Node.js module resolving behaviour so dumber bundler can do less work.
* two name spaces: 'user' (default) and 'package' (for npm packages and local packages).
  - module in user space can acquire user and package modules
  - module in package space can only acquire package modules
  - both user and package space can contain module with same id. This is designed to avoid user `src/util.js` over-shadowing Nodejs core module `util`.
* [TBD] work around non-delayed circular dependencies (for some npm packages like [yallist](https://github.com/isaacs/yallist)). Not sure what to do right now.
* support translator, to transpile, transform raw content
  - by default, dumber-module-loader ships with translators for js/json/html/svg/css/wasm (wasm TBD), plus support of traditional text! and json! plugins.
  - [TBD] dumber-babel-translator brings babel at runtime

Difference from requirejs:
* size 9K vs requirejs 84K. Our 9K supports text! and json!.
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
