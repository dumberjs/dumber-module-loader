## [0.15.10](https://github.com/dumberjs/dumber-module-loader/compare/v0.15.9...v0.15.10) (2019-01-06)


### Features

* support name spaced bundle ([37f8c3b](https://github.com/dumberjs/dumber-module-loader/commit/37f8c3b))



## [0.15.9](https://github.com/dumberjs/dumber-module-loader/compare/v0.15.8...v0.15.9) (2018-12-23)


### Bug Fixes

* fix path to shortcut '../src' to '' ([c9abdfb](https://github.com/dumberjs/dumber-module-loader/commit/c9abdfb))



## [0.15.8](https://github.com/dumberjs/dumber-module-loader/compare/v0.15.7...v0.15.8) (2018-12-20)


### Features

* expose define.currentSpace() which returns "user" or "package" ([2455469](https://github.com/dumberjs/dumber-module-loader/commit/2455469))



## [0.15.7](https://github.com/dumberjs/dumber-module-loader/compare/v0.15.6...v0.15.7) (2018-12-17)


### Bug Fixes

* normalise json! prefix ([c33d3ca](https://github.com/dumberjs/dumber-module-loader/commit/c33d3ca))



## [0.15.6](https://github.com/dumberjs/dumber-module-loader/compare/v0.15.5...v0.15.6) (2018-12-17)


### Bug Fixes

* fix missed code path to ext plugin when non-js module is loaded by additional bundle ([19fb7bf](https://github.com/dumberjs/dumber-module-loader/commit/19fb7bf))



## [0.15.5](https://github.com/dumberjs/dumber-module-loader/compare/v0.15.4...v0.15.5) (2018-12-15)


### Bug Fixes

* fix possible duplicated bundle loading ([831bc71](https://github.com/dumberjs/dumber-module-loader/commit/831bc71))



## [0.15.4](https://github.com/dumberjs/dumber-module-loader/compare/v0.15.3...v0.15.4) (2018-12-15)


### Features

* expose resolveModuleId ([bacf6a2](https://github.com/dumberjs/dumber-module-loader/commit/bacf6a2))



## [0.15.3](https://github.com/dumberjs/dumber-module-loader/compare/v0.15.2...v0.15.3) (2018-12-14)


### Bug Fixes

* ensure returning of promise in both async/sync requirejs call ([4dbb9bb](https://github.com/dumberjs/dumber-module-loader/commit/4dbb9bb))



## [0.15.2](https://github.com/dumberjs/dumber-module-loader/compare/v0.15.1...v0.15.2) (2018-12-13)


### Bug Fixes

* fix a endless circular check when inner deps have circular structure ([8317b86](https://github.com/dumberjs/dumber-module-loader/commit/8317b86))



## [0.15.1](https://github.com/dumberjs/dumber-module-loader/compare/v0.15.0...v0.15.1) (2018-12-11)


### Bug Fixes

* fix false exception when user space module in cjs wrapper requires npm package which returns undefined ([8651040](https://github.com/dumberjs/dumber-module-loader/commit/8651040))



# [0.15.0](https://github.com/dumberjs/dumber-module-loader/compare/v0.14.1...v0.15.0) (2018-12-11)


### Features

* regexp glob require support ([47c854e](https://github.com/dumberjs/dumber-module-loader/commit/47c854e))



## [0.14.1](https://github.com/dumberjs/dumber-module-loader/compare/v0.14.0...v0.14.1) (2018-12-05)



# [0.14.0](https://github.com/dumberjs/dumber-module-loader/compare/v0.13.0...v0.14.0) (2018-12-04)


### Bug Fixes

* **test:** fix amdjs-tests result check ([3143e0b](https://github.com/dumberjs/dumber-module-loader/commit/3143e0b))


### Features

* simplify default ext plugin implementation, use text plugin to load by default ([21f836b](https://github.com/dumberjs/dumber-module-loader/commit/21f836b))



# [0.13.0](https://github.com/dumberjs/dumber-module-loader/compare/v0.12.0...v0.13.0) (2018-12-03)



# [0.12.0](https://github.com/huochunpeng/dumber-module-loader/compare/v0.11.0...v0.12.0) (2018-12-03)


### Features

* basic support of wasm ([07286c6](https://github.com/huochunpeng/dumber-module-loader/commit/07286c6))



# [0.11.0](https://github.com/huochunpeng/dumber-module-loader/compare/v0.10.2...v0.11.0) (2018-12-03)


### Features

* use script tag in browser to load bundle, this is only because of sourcemaps ([157cd3f](https://github.com/huochunpeng/dumber-module-loader/commit/157cd3f))



## [0.10.2](https://github.com/huochunpeng/dumber-module-loader/compare/v0.10.1...v0.10.2) (2018-11-30)


### Bug Fixes

* fix missed sync module loading when using commonjs require() ([59e319f](https://github.com/huochunpeng/dumber-module-loader/commit/59e319f))



## [0.10.1](https://github.com/huochunpeng/dumber-module-loader/compare/v0.10.0...v0.10.1) (2018-11-30)



<a name="0.10.0"></a>
# [0.10.0](https://github.com/huochunpeng/dumber-module-loader/compare/v0.9.1...v0.10.0) (2018-10-08)


### Features

* implement default json/html/svg/css/wasm handler in ext plugins ([330313c](https://github.com/huochunpeng/dumber-module-loader/commit/330313c))
* support ext plugin like 'ext:css' ([a23b677](https://github.com/huochunpeng/dumber-module-loader/commit/a23b677))



<a name="0.9.1"></a>
## [0.9.1](https://github.com/huochunpeng/dumber-module-loader/compare/v0.9.0...v0.9.1) (2018-10-07)


### Bug Fixes

* fix runtime loading with absolute path ([5e55849](https://github.com/huochunpeng/dumber-module-loader/commit/5e55849))



<a name="0.9.0"></a>
# [0.9.0](https://github.com/huochunpeng/dumber-module-loader/compare/v0.8.0...v0.9.0) (2018-10-05)


### Bug Fixes

* fix missing plugin prefix match ([0d247b2](https://github.com/huochunpeng/dumber-module-loader/commit/0d247b2))


### Features

* basic support of requirejs plugin, only support mandatory load() ([18ab776](https://github.com/huochunpeng/dumber-module-loader/commit/18ab776))



<a name="0.8.0"></a>
# [0.8.0](https://github.com/huochunpeng/dumber-module-loader/compare/v0.7.0...v0.8.0) (2018-10-05)


### Features

* be compatible with requirejs, skip 2nd define on existing module ([abd81d2](https://github.com/huochunpeng/dumber-module-loader/commit/abd81d2))



<a name="0.7.0"></a>
# [0.7.0](https://github.com/huochunpeng/dumber-module-loader/compare/v0.6.0...v0.7.0) (2018-10-05)


### Features

* sync return on missing package module ([d656ed5](https://github.com/huochunpeng/dumber-module-loader/commit/d656ed5))



<a name="0.6.0"></a>
# [0.6.0](https://github.com/huochunpeng/dumber-module-loader/compare/v0.5.0...v0.6.0) (2018-10-05)


### Features

* improve compatibility with nodejs on json file resolution ([62f678a](https://github.com/huochunpeng/dumber-module-loader/commit/62f678a))
* requirejs.definedValues() reports all defined module values, excluding registered but not evaluated ([ee9c943](https://github.com/huochunpeng/dumber-module-loader/commit/ee9c943))



<a name="0.5.0"></a>
# [0.5.0](https://github.com/huochunpeng/dumber-module-loader/compare/v0.4.2...v0.5.0) (2018-10-03)


### Features

* support bundle config in requirejs format ([272e461](https://github.com/huochunpeng/dumber-module-loader/commit/272e461))



<a name="0.4.2"></a>
## [0.4.2](https://github.com/huochunpeng/dumber-module-loader/compare/v0.4.1...v0.4.2) (2018-10-03)



<a name="0.4.1"></a>
## [0.4.1](https://github.com/huochunpeng/dumber-module-loader/compare/v0.4.0...v0.4.1) (2018-10-03)



<a name="0.4.0"></a>
# [0.4.0](https://github.com/huochunpeng/dumber-module-loader/compare/v0.3.1...v0.4.0) (2018-10-03)


### Features

* pro-actively breaks circular commonjs dependency ([a2aca6b](https://github.com/huochunpeng/dumber-module-loader/commit/a2aca6b))



<a name="0.3.1"></a>
## [0.3.1](https://github.com/huochunpeng/dumber-module-loader/compare/v0.3.0...v0.3.1) (2018-10-03)



<a name="0.3.0"></a>
# [0.3.0](https://github.com/huochunpeng/dumber-module-loader/compare/v0.2.0...v0.3.0) (2018-10-03)


### Features

* resolve module synchronously as mush as possible, early return for commonjs circular dependencies ([6b36739](https://github.com/huochunpeng/dumber-module-loader/commit/6b36739))



<a name="0.2.0"></a>
# 0.2.0 (2018-10-02)


### Bug Fixes

* **test:** fix browser test ([ed157a9](https://github.com/huochunpeng/dumber-module-loader/commit/ed157a9))
* ensure sequential promoting deps, the order is important in case of circular dependency ([945bd04](https://github.com/huochunpeng/dumber-module-loader/commit/945bd04))
* fix build exports ([d8f1cbb](https://github.com/huochunpeng/dumber-module-loader/commit/d8f1cbb))
* fix timing issue on anonymous module ([886f84b](https://github.com/huochunpeng/dumber-module-loader/commit/886f84b))
* follow amd spec on require, fail immediately ([141688b](https://github.com/huochunpeng/dumber-module-loader/commit/141688b))
* improve AMD compatibility, require can be required ([f7f380f](https://github.com/huochunpeng/dumber-module-loader/commit/f7f380f))
* improve paths lookup, match longest first ([6813417](https://github.com/huochunpeng/dumber-module-loader/commit/6813417))
* relex commonjs require ([fc4258f](https://github.com/huochunpeng/dumber-module-loader/commit/fc4258f))


### Features

* amd define and requirejs ([060cf25](https://github.com/huochunpeng/dumber-module-loader/commit/060cf25))
* bring in amdjs-tests, only the compatible parts ([b5777c8](https://github.com/huochunpeng/dumber-module-loader/commit/b5777c8))
* id-utils ([b87afe7](https://github.com/huochunpeng/dumber-module-loader/commit/b87afe7))
* module name space ([98e2873](https://github.com/huochunpeng/dumber-module-loader/commit/98e2873))
* support absolute id above surface (start with ..) ([b97b72f](https://github.com/huochunpeng/dumber-module-loader/commit/b97b72f))
* supports delayed circular deps ([9b1c502](https://github.com/huochunpeng/dumber-module-loader/commit/9b1c502))




