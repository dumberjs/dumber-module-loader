# [1.2.0](https://github.com/dumberjs/dumber-module-loader/compare/v1.1.11...v1.2.0) (2021-05-12)


### Features

* expose define.nameAnonymous to capture anonymous module ([9f6396d](https://github.com/dumberjs/dumber-module-loader/commit/9f6396d4c933d69e2c869da31821dc3fc634b43a))



## [1.1.11](https://github.com/dumberjs/dumber-module-loader/compare/v1.1.10...v1.1.11) (2021-01-05)


### Bug Fixes

* not confused about module returning promise object ([1c97c88](https://github.com/dumberjs/dumber-module-loader/commit/1c97c88ac451d0c0a1d9905fcd4da86aaea1913d)), closes [#2](https://github.com/dumberjs/dumber-module-loader/issues/2)



## [1.1.10](https://github.com/dumberjs/dumber-module-loader/compare/v1.1.9...v1.1.10) (2020-05-04)


### Bug Fixes

* should reconstruct remote module path ([77974d4](https://github.com/dumberjs/dumber-module-loader/commit/77974d4d0fc0dc574bd99e8ae1dc3d6d1f0f2830)), closes [dumberjs/dumber#19](https://github.com/dumberjs/dumber/issues/19)



## [1.1.9](https://github.com/dumberjs/dumber-module-loader/compare/v1.1.8...v1.1.9) (2020-04-09)



## [1.1.8](https://github.com/dumberjs/dumber-module-loader/compare/v1.1.7...v1.1.8) (2020-04-08)


### Bug Fixes

* module with paths mapped https:// should use original module id ([c77b996](https://github.com/dumberjs/dumber-module-loader/commit/c77b9967fc8c862a1b82bb50d38cdc49166ee5c6))



## [1.1.7](https://github.com/dumberjs/dumber-module-loader/compare/v1.1.6...v1.1.7) (2020-04-08)


### Bug Fixes

* use cors mode for foreign remote ([ee70847](https://github.com/dumberjs/dumber-module-loader/commit/ee70847e8da9ff01f677fa89069eec51d0ad0978))



## [1.1.6](https://github.com/dumberjs/dumber-module-loader/compare/v1.1.5...v1.1.6) (2020-04-08)


### Bug Fixes

* fix runtime loading on module with paths mapped https:// ([18b8c8d](https://github.com/dumberjs/dumber-module-loader/commit/18b8c8d39a88dbf6e8b49e4a6ae6c990d2453f1c))



## [1.1.5](https://github.com/dumberjs/dumber-module-loader/compare/v1.1.4...v1.1.5) (2020-03-19)


### Bug Fixes

* allow css import from package space ([c8ba2a3](https://github.com/dumberjs/dumber-module-loader/commit/c8ba2a31601594adb875588c16a1e287b445fba4))



## [1.1.4](https://github.com/dumberjs/dumber-module-loader/compare/v1.1.3...v1.1.4) (2020-03-13)


### Bug Fixes

* a.html should route to a.html.js too ([2a5b7ef](https://github.com/dumberjs/dumber-module-loader/commit/2a5b7ef580bd60ea49e92bfb127beef1f6d3e1db))



## [1.1.3](https://github.com/dumberjs/dumber-module-loader/compare/v1.1.2...v1.1.3) (2020-03-09)


### Bug Fixes

* the regexp glob should tolerant .js .cjs and .mjs ([3cc6349](https://github.com/dumberjs/dumber-module-loader/commit/3cc634971ebf821705440da7deb55535ac95ee20))



## [1.1.2](https://github.com/dumberjs/dumber-module-loader/compare/v1.1.1...v1.1.2) (2020-03-06)


### Bug Fixes

* fix circular deps check for module id with .js ext ([6cf0b30](https://github.com/dumberjs/dumber-module-loader/commit/6cf0b30f63650f8ea91483b95a6748e5450fc6a6))



## [1.1.1](https://github.com/dumberjs/dumber-module-loader/compare/v1.1.0...v1.1.1) (2020-01-15)


### Bug Fixes

* properly re-throw error ([0cc8f00](https://github.com/dumberjs/dumber-module-loader/commit/0cc8f00078b21b6187e58e8b29a68397fe00014d))



# [1.1.0](https://github.com/dumberjs/dumber-module-loader/compare/v1.0.1...v1.1.0) (2019-12-06)


### Features

* add support of .mjs and .cjs file extensions ([ce85c2e](https://github.com/dumberjs/dumber-module-loader/commit/ce85c2e130167eb222d64828d87be937918a876e)), closes [dumberjs/dumber#14](https://github.com/dumberjs/dumber/issues/14)



## [1.0.1](https://github.com/dumberjs/dumber-module-loader/compare/v1.0.0...v1.0.1) (2019-10-17)


### Bug Fixes

* handle relative module to index module from above surface ([ff80778](https://github.com/dumberjs/dumber-module-loader/commit/ff80778))



# [1.0.0](https://github.com/dumberjs/dumber-module-loader/compare/v0.18.0...v1.0.0) (2019-08-29)


### Features

* be more friendly to alternative html template syntax ([00ab2ff](https://github.com/dumberjs/dumber-module-loader/commit/00ab2ff))



# [0.18.0](https://github.com/dumberjs/dumber-module-loader/compare/v0.17.2...v0.18.0) (2019-07-30)


### Features

* accept load foo.css module fro foo.less/.sass/.scss/.styl  ([5d0aaff](https://github.com/dumberjs/dumber-module-loader/commit/5d0aaff))



## [0.17.2](https://github.com/dumberjs/dumber-module-loader/compare/v0.17.1...v0.17.2) (2019-06-26)


### Bug Fixes

* fix circular checker when alias is in the path ([2ed0006](https://github.com/dumberjs/dumber-module-loader/commit/2ed0006))



## [0.17.1](https://github.com/dumberjs/dumber-module-loader/compare/v0.17.0...v0.17.1) (2019-06-26)


### Bug Fixes

* fix missing deAlias for possible nodejsIds ([a31f8ad](https://github.com/dumberjs/dumber-module-loader/commit/a31f8ad))



# [0.17.0](https://github.com/dumberjs/dumber-module-loader/compare/v0.16.4...v0.17.0) (2019-06-26)


### Features

* add define.alias(fromId, toId) to better handle commonjs semantic ([6304268](https://github.com/dumberjs/dumber-module-loader/commit/6304268))



## [0.16.4](https://github.com/dumberjs/dumber-module-loader/compare/v0.16.3...v0.16.4) (2019-06-25)


### Bug Fixes

* avoid module 'foo.json' overshadow module 'foo' ([4937c11](https://github.com/dumberjs/dumber-module-loader/commit/4937c11))
* fix circular deps loading when an outside module loads a circular group (which is always the case in reality) ([5691056](https://github.com/dumberjs/dumber-module-loader/commit/5691056))



## [0.16.3](https://github.com/dumberjs/dumber-module-loader/compare/v0.16.2...v0.16.3) (2019-06-25)



## [0.16.2](https://github.com/dumberjs/dumber-module-loader/compare/v0.16.1...v0.16.2) (2019-06-25)



## [0.16.1](https://github.com/dumberjs/dumber-module-loader/compare/v0.16.0...v0.16.1) (2019-06-19)



# [0.16.0](https://github.com/dumberjs/dumber-module-loader/compare/v0.15.17...v0.16.0) (2019-02-09)


### Bug Fixes

* use requirejs compatible module.uri ([505df0c](https://github.com/dumberjs/dumber-module-loader/commit/505df0c))



## [0.15.17](https://github.com/dumberjs/dumber-module-loader/compare/v0.15.16...v0.15.17) (2019-01-15)



## [0.15.16](https://github.com/dumberjs/dumber-module-loader/compare/v0.15.15...v0.15.16) (2019-01-14)


### Features

* support json! prefix on module with extname not '.json' ([0083fd8](https://github.com/dumberjs/dumber-module-loader/commit/0083fd8))



## [0.15.15](https://github.com/dumberjs/dumber-module-loader/compare/v0.15.14...v0.15.15) (2019-01-13)


### Features

* add support of few more file extnames ([cd1c1e9](https://github.com/dumberjs/dumber-module-loader/commit/cd1c1e9))
* support onload.error callback in requirejs plugin ([8196883](https://github.com/dumberjs/dumber-module-loader/commit/8196883))



## [0.15.14](https://github.com/dumberjs/dumber-module-loader/compare/v0.15.13...v0.15.14) (2019-01-13)


### Features

* support unknown plugin prefix at runtime ([85a9463](https://github.com/dumberjs/dumber-module-loader/commit/85a9463))



## [0.15.13](https://github.com/dumberjs/dumber-module-loader/compare/v0.15.12...v0.15.13) (2019-01-13)


### Bug Fixes

* normalize plugin module path ([38d0de9](https://github.com/dumberjs/dumber-module-loader/commit/38d0de9))



## [0.15.12](https://github.com/dumberjs/dumber-module-loader/compare/v0.15.11...v0.15.12) (2019-01-09)


### Features

* support require.specified() ([507bd4f](https://github.com/dumberjs/dumber-module-loader/commit/507bd4f))



## [0.15.11](https://github.com/dumberjs/dumber-module-loader/compare/v0.15.10...v0.15.11) (2019-01-06)


### Bug Fixes

* fix an id mapping bug when a name spaced bundle uses extract same name for bundle name and name space ([1b63aed](https://github.com/dumberjs/dumber-module-loader/commit/1b63aed))



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




