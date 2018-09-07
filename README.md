# @dumber/loader

A minimum AMD module loader, designed to work with the [dumber bundler](https://github.com/huochunpeng/dumber-bundler).

* Partial AMD implementation, just enough for bundled app to work in browser, bu still can load dynamic module from remote url at runtime.
* Mimic Node.js module resolving behavior so dumber bundler can do less work.

* [ ] two namespace: '' (default) and 'vendor' (for npm packages).
 - module in default space can require default and vendor modules
 - module in vendor space can only require vendor modules
* [ ] support resolve hook, to transpile, transform raw code
 - by default, dumber-loader ships with no hook
 - dumber-loader-on-steroid bring babel stage-1, write transforms from dumber-bundler
