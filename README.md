# dumber-module-loader

A modern module loader, designed to work with the [dumber](https://github.com/huochunpeng/dumber), only works in browser.

dumber-module-loader is a loose [AMD](https://github.com/amdjs/amdjs-api) implementation, doesn't 100% follow the AMD spec.

Our violation of AMD spec:

* [x] AMD spec doesn't allow defining relative module `define('../package.json', ...)`. We allow it, this is to support `'../pakcage.json'` that could be required by `src/app.js`. We call module id `'../package.json'` above surface.
* [ ] break circular dependencies (for some npm packages like [yallist](https://github.com/isaacs/yallist)).

Our touch on AMD:

* [x] mimic Node.js module resolving behavior so dumber bundler can do less work.
* [x] two name spaces: 'user' (default) and 'package' (for npm packages and local packages).
  - module in user space can acquire user and package modules
  - module in package space can only acquire package modules
  - both user and package space can contain module with same id. This is designed to avoid user `src/util.js` over-shadowing Nodejs core module `util`.
* [x] support translator hook, to transpile, transform raw content
  - [x] by default, dumber-module-loader ships with translators for js/json/html/svg/css/wasm (wasm TBD), plus support of traditional requirejs text! and json! plugins.
  - [ ] TBD dumber-babel-translator brings babel at runtime


Difference from requirejs:

* [x] data-main doesn't affect baseUrl.
* [x] no automatic commonjs wrapping at runtime module fetching. At runtime, we only support AMD anonymous module format.
* [x] bundles config format is different, it needs two arrays, 'user' and 'package' for the two module spaces.
* [x] require([...], callback, errback) doesn't support optional config, errback only gets one error object.

