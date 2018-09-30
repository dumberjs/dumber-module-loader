# dumber-module-loader

A modern module loader, designed to work with the [dumber](https://github.com/huochunpeng/dumber), only works in browser

dumber-module-loader is a loose [AMD](https://github.com/amdjs/amdjs-api) implementation, doesn't 100% follow the AMD spec.

Our touch on AMD:

* [x] mimic Node.js module resolving behavior so dumber bundler can do less work.
* [x] two namespace: 'user' (default) and 'package' (for npm packages and local packages).
  - module in user space can acquire user and package modules
  - module in package space can only acquire package modules
* [x] support translator hook, to transpile, transform raw code
  - [x] by default, dumber-module-loader ships translators for js/json/html/svg/css/wasm, plus traditional text! and json! plugins.
  - [ ] TBD dumber-babel-translator brings babel at runtime
* [x] AMD spec doesn't allow defining relative module `define('../package.json', ...)`. We allow above the surface defining, this is to support `'../pakcage.json'` from `src/app.js`.

Difference from requirejs:

* [x] data-main doesn't affect baseUrl.
* [x] no automatic commonjs wrapping at runtime module fetching. At runtime, we only support AMD anonymous module format.
* [x] bundles config format is different, it needs two arrays, 'user' and 'package' for the two module spaces.
* [x] require([...], callback, errback) doesn't support optional config, errback only gets one error object.
* [ ] break circular dependencies (npm package yallist).
