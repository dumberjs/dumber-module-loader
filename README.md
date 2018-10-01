# dumber-module-loader

A modern module loader, designed to work with the [dumber](https://github.com/huochunpeng/dumber), only works in browser.

dumber-module-loader is a loose [AMD](https://github.com/amdjs/amdjs-api) implementation, doesn't 100% follow the AMD spec.

Our violation of AMD spec:

* [x] AMD spec doesn't allow defining relative module `define('../package.json', ...)`. We allow it, this is to support `'../package.json'` that could be required by `src/app.js`. We call module id `'../package.json'` above surface.
* [ ] break circular dependencies (for some npm packages like [yallist](https://github.com/isaacs/yallist)).
* [x] if no dependencies array is provided, we don't provide default values of "require, exports, module".
* [x] the plugin support is totally different, although we support traditional `text!` and `json!` plugins out of the box. We use translators to support flexible module preparing.

Our touch on AMD:

* [x] mimic Node.js module resolving behaviour so dumber bundler can do less work.
* [x] two name spaces: 'user' (default) and 'package' (for npm packages and local packages).
  - module in user space can acquire user and package modules
  - module in package space can only acquire package modules
  - both user and package space can contain module with same id. This is designed to avoid user `src/util.js` over-shadowing Nodejs core module `util`.
* [x] support translator, to transpile, transform raw content
  - [x] by default, dumber-module-loader ships with translators for js/json/html/svg/css/wasm (wasm TBD), plus support of traditional text! and json! plugins.
  - [ ] TBD dumber-babel-translator brings babel at runtime

Difference from requirejs:

* [x] only supports config on baseUrl, paths, bundles and translators.
* [x] data-main attribute on script tag doesn't affect baseUrl, data-main is purely a module id.
* [x] paths support is simplified.
  - doesn't support absolute path like `"foo": "/foo"`. Only do `"foo": "common/foo"` which `common/foo` is relative to baseUrl.
  - doesn't support `"foo": ["common/foo", "shared/foo"]` failover array.
* [x] no automatic commonjs wrapping at runtime module fetching. At runtime, we only support AMD anonymous module format, unless you supply a translator to deal with raw content.
* [x] bundles config format is different, it needs two arrays, 'user' and 'package' for the two module spaces.
  - for example, `{"a-bundle": {"user": ['a', 'b'], "package": ["lodash", "jquery"]}}`.
* [x] require([...], callback, errback) doesn't support optional config, errback only gets one error object.
* [x] we only support browser/worker/Nodejs environments, didn't test on Rhino or any other environments.
* [x] note there is no support of config on package/map/shim. They are all done by dumber bundler.
