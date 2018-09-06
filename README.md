# @dumber/loader

A minimum AMD module loader, designed to work with the [dumber bundler](https://github.com/huochunpeng/dumber-bundler).

* Partial AMD implementation, just enough for bundled app to work in browser, bu still can load dynamic module from remote url at runtime.
* Mimic Node.js module resolving behavior so dumber bundler can do less work.
