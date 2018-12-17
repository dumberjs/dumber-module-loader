import test from 'tape';
import {cleanPath, resolveModuleId, ext, parse, relativeModuleId, nodejsIds, mapId} from '../src/id-utils';

test('cleanPath', t => {
  t.equal(cleanPath('  a/b '), 'a/b', 'trim off spaces');
  t.equal(cleanPath('  a/b/ '), 'a/b', 'remove trailing /');
  t.equal(cleanPath('  a/b/ '), 'a/b', 'remove trailing /');
  t.equal(cleanPath(' /a/ '), '/a', 'reserve leading /');
  t.equal(cleanPath(' ./a/ '), './a', 'reserve leading ./');
  t.equal(cleanPath(' ../../a/ '), '../../a', 'reserve leading ../');
  t.end();
});

test('ext finds known extname of id', t => {
  t.equal(ext(' a.js/ '), '.js');
  t.equal(ext('text!a.JS'), '.js');
  t.equal(ext('a.html'), '.html');
  t.equal(ext('a.css'), '.css');
  t.equal(ext('a.json'), '.json');
  t.equal(ext('a.min'), '');
  t.equal(ext('b.js/a.wasm'), '.wasm');
  t.equal(ext('a'), '');
  t.end();
});

// parse

test('parse parses id', t => {
  t.throws(() => parse(''));
  t.deepEqual(parse('a/b'), {prefix: '', bareId: 'a/b', parts: ['a', 'b'], ext: '', cleanId: 'a/b'});
  t.deepEqual(parse('a.js'), {prefix: '', bareId: 'a.js', parts: ['a.js'], ext: '.js', cleanId: 'a.js'});
  t.deepEqual(parse('/a//./b.js'), {prefix: '', bareId: '/a/b.js', parts: ['', 'a', 'b.js'], ext: '.js', cleanId: '/a/b.js'});
  t.deepEqual(parse('a/../..//foo/a/b.min.js'), {prefix: '', bareId: '../foo/a/b.min.js', parts: ['..', 'foo', 'a', 'b.min.js'], ext: '.js', cleanId: '../foo/a/b.min.js'});
  t.deepEqual(parse('a/../a/b.min.js'), {prefix: '', bareId: 'a/b.min.js', parts: ['a', 'b.min.js'], ext: '.js', cleanId: 'a/b.min.js'});
  t.deepEqual(parse('a/b.json'), {prefix: '', bareId: 'a/b.json', parts: ['a', 'b.json'], ext: '.json', cleanId: 'a/b.json'});
  // strip json! prefix
  t.deepEqual(parse('json!a/b.json'), {prefix: '', bareId: 'a/b.json', parts: ['a', 'b.json'], ext: '.json', cleanId: 'a/b.json'});
  t.deepEqual(parse('a/b.svg'), {prefix: '', bareId: 'a/b.svg', parts: ['a', 'b.svg'], ext: '.svg', cleanId: 'a/b.svg'});
  t.deepEqual(parse('../a/b.svg'), {prefix: '', bareId: '../a/b.svg', parts: ['..', 'a', 'b.svg'], ext: '.svg', cleanId: '../a/b.svg'});
  t.end();
});

test('parse parses id with plugin prefix', t => {
  t.deepEqual(parse('text!a/b'), {prefix: 'text!', bareId: 'a/b', parts: ['a', 'b'], ext: '', cleanId: 'text!a/b'});
  t.deepEqual(parse('text!a/b.js'), {prefix: 'text!', bareId: 'a/b.js', parts: ['a', 'b.js'], ext: '.js', cleanId: 'text!a/b.js'});
  t.deepEqual(parse('text!a/b.min.js'), {prefix: 'text!', bareId: 'a/b.min.js', parts: ['a', 'b.min.js'], ext: '.js', cleanId: 'text!a/b.min.js'});
  t.deepEqual(parse('text!a/b.json'), {prefix: 'text!', bareId: 'a/b.json', parts: ['a', 'b.json'], ext: '.json', cleanId: 'text!a/b.json'});
  t.deepEqual(parse('text!a/b.svg'), {prefix: 'text!', bareId: 'a/b.svg', parts: ['a', 'b.svg'], ext: '.svg', cleanId: 'text!a/b.svg'});
  t.deepEqual(parse('text!../a/b.svg'), {prefix: 'text!', bareId: '../a/b.svg', parts: ['..', 'a', 'b.svg'], ext: '.svg', cleanId: 'text!../a/b.svg'});
  t.deepEqual(parse('text-plugin/bla!a/b.min.js'), {prefix: 'text-plugin/bla!', bareId: 'a/b.min.js', parts: ['a', 'b.min.js'], ext: '.js', cleanId: 'text-plugin/bla!a/b.min.js'});
  t.end();
});

test('parse parses id with scope', t => {
  t.deepEqual(parse('@s/a/b'), {prefix: '', bareId: '@s/a/b', parts: ['@s/a', 'b'], ext: '', cleanId: '@s/a/b'});
  t.deepEqual(parse('@s//a///b.js'), {prefix: '', bareId: '@s/a/b.js', parts: ['@s/a', 'b.js'], ext: '.js', cleanId: '@s/a/b.js'});
  t.deepEqual(parse('@s/a/b.min.js'), {prefix: '', bareId: '@s/a/b.min.js', parts: ['@s/a', 'b.min.js'], ext: '.js', cleanId: '@s/a/b.min.js'});
  t.deepEqual(parse('text!@s/a/b.json'), {prefix: 'text!', bareId: '@s/a/b.json', parts: ['@s/a', 'b.json'], ext: '.json', cleanId: 'text!@s/a/b.json'});
  t.end();
});

// resolveModuleId

test('resolveModuleId returns non-relative id', t => {
  t.equal(resolveModuleId('base', 'foo'), 'foo');
  t.equal(resolveModuleId('base//lo.js', 'foo'), 'foo');
  t.equal(resolveModuleId('base', 'foo//bar.js'), 'foo/bar.js');
  t.equal(resolveModuleId('base/lo', 'foo/bar'), 'foo/bar');
  t.end();
});

test('resolveModuleId returns resolved relative id', t => {
  t.equal(resolveModuleId('base', './foo'), 'foo');
  t.equal(resolveModuleId('base/lo', './foo'), 'base/foo');
  t.equal(resolveModuleId('base', './foo/bar'), 'foo/bar');
  t.equal(resolveModuleId('base/lo', '././foo/bar'), 'base/foo/bar');
  t.end();
});

test('resolveModuleId returns resolved relative id ..', t => {
  t.equal(resolveModuleId('base', '../foo'), '../foo');
  t.equal(resolveModuleId('base/lo', '../foo'), 'foo');
  t.equal(resolveModuleId('base', '../foo/bar'), '../foo/bar');
  t.equal(resolveModuleId('base/lo', '.././foo/bar'), 'foo/bar');
  t.end();
});

test('resolveModuleId returns resolved relative id for scoped package', t => {
  t.equal(resolveModuleId('@scope/base', './foo'), 'foo');
  t.equal(resolveModuleId('@scope//base/lo', './foo'), '@scope/base/foo');
  t.equal(resolveModuleId('@scope/base', './/foo//bar'), 'foo/bar');
  t.equal(resolveModuleId('@scope/base/lo', '././foo/bar'), '@scope/base/foo/bar');
  t.end();
});

test('resolveModuleId returns resolved relative id .. for scoped package', t => {
  t.equal(resolveModuleId('@scope/base', '../foo'), '../foo');
  t.equal(resolveModuleId('@scope/base/lo', '../foo'), 'foo');
  t.equal(resolveModuleId('@scope/base', '../foo/bar'), '../foo/bar');
  t.equal(resolveModuleId('@scope/base/lo', '.././foo/bar'), 'foo/bar');
  t.end();
});

test('resolveModuleId returns non-relative id with prefix', t => {
  t.equal(resolveModuleId('base', 'text!foo'), 'text!foo');
  t.equal(resolveModuleId('base/lo', 'text!foo'), 'text!foo');
  t.equal(resolveModuleId('text!base', 'text!foo/bar'), 'text!foo/bar');
  t.equal(resolveModuleId('text!base/lo', 'text!foo/bar'), 'text!foo/bar');
  t.end();
});

test('resolveModuleId returns resolved relative id with prefix', t => {
  t.equal(resolveModuleId('base', 'text!./foo'), 'text!foo');
  t.equal(resolveModuleId('base/lo', 'text!./foo'), 'text!base/foo');
  t.equal(resolveModuleId('text!base', 'text!./foo/bar'), 'text!foo/bar');
  t.equal(resolveModuleId('text!base/lo', 'text!././foo/bar'), 'text!base/foo/bar');
  t.end();
});

test('resolveModuleId returns resolved relative id .. with prefix', t => {
  t.equal(resolveModuleId('base', 'text!../foo'), 'text!../foo');
  t.equal(resolveModuleId('base/lo', 'text!../foo'), 'text!foo');
  t.equal(resolveModuleId('text!base', 'text!../foo/bar'), 'text!../foo/bar');
  t.equal(resolveModuleId('text!base/lo', 'text!.././foo/bar'), 'text!foo/bar');
  t.end();
});

test('resolveModuleId returns resolved relative id for scoped package with prefix', t => {
  t.equal(resolveModuleId('@scope/base', 'text!./foo'), 'text!foo');
  t.equal(resolveModuleId('@scope/base/lo', 'text!./foo'), 'text!@scope/base/foo');
  t.equal(resolveModuleId('text!@scope/base', 'text!./foo/bar'), 'text!foo/bar');
  t.equal(resolveModuleId('text!@scope/base/lo', 'text!././foo/bar'), 'text!@scope/base/foo/bar');
  t.end();
});

test('resolveModuleId returns resolved relative id .. for scoped package with prefix', t => {
  t.equal(resolveModuleId('@scope/base', 'text!../foo'), 'text!../foo');
  t.equal(resolveModuleId('@scope/base/lo', 'text!../foo'), 'text!foo');
  t.equal(resolveModuleId('text!@scope/base', 'text!../foo/bar'), 'text!../foo/bar');
  t.equal(resolveModuleId('text!@scope/base/lo', 'text!.././foo/bar'), 'text!foo/bar');
  t.end();
});

test('resolveModuleId returns clean id', t => {
  t.equal(resolveModuleId('base', 'foo.js'), 'foo.js');
  t.equal(resolveModuleId('base', 'foo.json'), 'foo.json');
  t.equal(resolveModuleId('base/bar', './foo.js'), 'base/foo.js');
  t.equal(resolveModuleId('base/bar', '../foo.html'), 'foo.html');
  t.equal(resolveModuleId('@scope/base', 'foo.js'), 'foo.js');
  t.equal(resolveModuleId('@scope/base', 'foo.json'), 'foo.json');
  t.equal(resolveModuleId('@scope/base', 'text!./foo.js'), 'text!foo.js');
  t.equal(resolveModuleId('@scope/base', 'text!../foo.html'), 'text!../foo.html');
  t.equal(resolveModuleId('@scope/base/bar', 'text!./foo.js'), 'text!@scope/base/foo.js');
  t.equal(resolveModuleId('@scope/base/bar', 'text!../foo.html'), 'text!foo.html');
  t.end();
});

test('resolveModuleId can work on base with ..', t => {
  t.equal(resolveModuleId('../foo', './bar'), '../bar');
  t.equal(resolveModuleId('../../foo', '../goo/bar'), '../goo/bar');
  t.end();
});

// relativeModuleId

test('relativeModuleId returns relative module id', t => {
  t.equal(relativeModuleId('base', './foo'), './foo');
  t.equal(relativeModuleId('base//lo.js', '../foo'), '../foo');
  t.equal(relativeModuleId('base', './foo//bar.js'), './foo/bar.js');
  t.end();
});

test('relativeModuleId resolves relative module id', t => {
  t.equal(relativeModuleId('base', 'foo'), './foo');
  t.equal(relativeModuleId('base//lo.js', 'foo'), '../foo');
  t.equal(relativeModuleId('base', 'foo//bar.js'), './foo/bar.js');
  t.equal(relativeModuleId('base/lo', 'foo/bar'), '../foo/bar');
  t.equal(relativeModuleId('base/lo', 'base/bar'), './bar');
  t.equal(relativeModuleId('base/lo', 'base/foo/bar'), './foo/bar');
  t.equal(relativeModuleId('base/fa/lo', 'base/foo/bar'), '../foo/bar');
  t.end();
});

test('relativeModuleId resolves relative id ..', t => {
  t.equal(relativeModuleId('base', '../foo'), '../foo');
  t.equal(relativeModuleId('base/lo', 'foo'), '../foo');
  t.equal(relativeModuleId('base', '../foo/bar'), '../foo/bar');
  t.equal(relativeModuleId('base/lo', 'foo/bar'), '../foo/bar');
  t.end();
});

test('relativeModuleId resolves relative id for scoped package', t => {
  t.equal(relativeModuleId('@scope/base', 'foo'), './foo');
  t.equal(relativeModuleId('@scope//base/lo', '@scope/base/foo'), './foo');
  t.equal(relativeModuleId('@scope/base', 'foo//bar'), './foo/bar');
  t.equal(relativeModuleId('@scope/base/lo', '@scope/base//./foo/bar'), './foo/bar');
  t.end();
});

test('relativeModuleId resolves relative id .. for scoped package', t => {
  t.equal(relativeModuleId('@scope/base', '../foo'), '../foo');
  t.equal(relativeModuleId('@scope/base/lo', 'foo'), '../foo');
  t.equal(relativeModuleId('@scope/base', '../foo/bar'), '../foo/bar');
  t.equal(relativeModuleId('@scope/base/lo', 'foo/bar'), '../foo/bar');
  t.end();
});

test('relativeModuleId returns non-relative id with prefix', t => {
  t.equal(relativeModuleId('base', 'text!foo'), 'text!./foo');
  t.equal(relativeModuleId('base/lo', 'text!foo'), 'text!../foo');
  t.equal(relativeModuleId('text!base', 'text!foo/bar'), 'text!./foo/bar');
  t.equal(relativeModuleId('text!base/lo', 'text!foo/bar'), 'text!../foo/bar');
  t.end();
});

test('relativeModuleId resolves relative id with prefix', t => {
  t.equal(relativeModuleId('base', 'text!foo'), 'text!./foo');
  t.equal(relativeModuleId('base/lo', 'text!base/foo'), 'text!./foo');
  t.equal(relativeModuleId('text!base', 'text!foo/bar'), 'text!./foo/bar');
  t.equal(relativeModuleId('text!base/lo', 'text!base/foo/bar'), 'text!./foo/bar');
  t.end();
});

test('relativeModuleId resolves relative id .. with prefix', t => {
  t.equal(relativeModuleId('base', 'text!../foo'), 'text!../foo');
  t.equal(relativeModuleId('base/lo', 'text!foo'), 'text!../foo');
  t.equal(relativeModuleId('text!base', 'text!../foo/bar'), 'text!../foo/bar');
  t.equal(relativeModuleId('text!base/lo', 'text!foo/bar'), 'text!../foo/bar');
  t.end();
});

test('relativeModuleId resolves relative id for scoped package with prefix', t => {
  t.equal(relativeModuleId('@scope/base', 'text!foo'), 'text!./foo');
  t.equal(relativeModuleId('@scope/base/lo', 'text!@scope/base/foo'), 'text!./foo');
  t.equal(relativeModuleId('text!@scope/base', 'text!foo/bar'), 'text!./foo/bar');
  t.equal(relativeModuleId('text!@scope/base/lo', 'text!@scope/base/foo/bar'), 'text!./foo/bar');
  t.end();
});

test('relativeModuleId resolves relative id .. for scoped package with prefix', t => {
  t.equal(relativeModuleId('@scope/base', 'text!../foo'), 'text!../foo');
  t.equal(relativeModuleId('@scope/base/lo', 'text!foo'), 'text!../foo');
  t.equal(relativeModuleId('text!@scope/base', 'text!../foo/bar'), 'text!../foo/bar');
  t.equal(relativeModuleId('text!@scope/base/lo', 'text!foo/bar'), 'text!../foo/bar');
  t.end();
});

test('relativeModuleId returns clean id', t => {
  t.equal(relativeModuleId('base', 'foo.js'), './foo.js');
  t.equal(relativeModuleId('base', 'foo.json'), './foo.json');
  t.equal(relativeModuleId('base/bar', 'base/foo.js'), './foo.js');
  t.equal(relativeModuleId('base/bar', 'foo.html'), '../foo.html');
  t.equal(relativeModuleId('@scope/base', 'foo.js'), './foo.js');
  t.equal(relativeModuleId('@scope/base', 'foo.json'), './foo.json');
  t.equal(relativeModuleId('@scope/base', 'text!foo.js'), 'text!./foo.js');
  t.equal(relativeModuleId('@scope/base', 'text!../foo.html'), 'text!../foo.html');
  t.equal(relativeModuleId('@scope/base/bar', 'text!@scope/base/foo.js'), 'text!./foo.js');
  t.equal(relativeModuleId('@scope/base/bar', 'text!foo.html'), 'text!../foo.html');
  t.end();
});

test('relativeModuleId can work on base with ..', t => {
  t.equal(relativeModuleId('../foo', '../bar'), './bar');
  t.equal(relativeModuleId('../../foo', '../goo/bar'), '../goo/bar');
  t.end();
});

// nodejsIds

test('nodejsIds returns possible nodejs ids', t => {
  t.deepEqual(nodejsIds('foo'), ['foo', 'foo.js', 'foo.json', 'foo/index', 'foo/index.js', 'foo/index.json']);
  t.deepEqual(nodejsIds('foo.js'), ['foo.js', 'foo', 'foo.js/index', 'foo.js/index.js', 'foo.js/index.json']);
  t.deepEqual(nodejsIds('foo.json'), ['foo.json', 'foo.json/index', 'foo.json/index.js', 'foo.json/index.json']);
  t.deepEqual(nodejsIds('foo.min'), ['foo.min', 'foo.min.js', 'foo.min.json', 'foo.min/index', 'foo.min/index.js', 'foo.min/index.json']);
  t.deepEqual(nodejsIds('foo.min.js'), ['foo.min.js', 'foo.min', 'foo.min.js/index', 'foo.min.js/index.js', 'foo.min.js/index.json']);
  t.deepEqual(nodejsIds('foo.html'), ['foo.html', 'foo.html/index', 'foo.html/index.js', 'foo.html/index.json']);

  t.deepEqual(nodejsIds('text!foo/bar'), ['text!foo/bar', 'text!foo/bar.js', 'text!foo/bar.json', 'text!foo/bar/index', 'text!foo/bar/index.js', 'text!foo/bar/index.json']);
  t.deepEqual(nodejsIds('text!foo/bar.js'), ['text!foo/bar.js', 'text!foo/bar', 'text!foo/bar.js/index', 'text!foo/bar.js/index.js', 'text!foo/bar.js/index.json']);
  t.deepEqual(nodejsIds('text!foo/bar.json'), ['text!foo/bar.json', 'text!foo/bar.json/index', 'text!foo/bar.json/index.js', 'text!foo/bar.json/index.json']);
  t.deepEqual(nodejsIds('text!foo/bar.min'), ['text!foo/bar.min', 'text!foo/bar.min.js', 'text!foo/bar.min.json', 'text!foo/bar.min/index', 'text!foo/bar.min/index.js', 'text!foo/bar.min/index.json']);
  t.deepEqual(nodejsIds('text!foo/bar.min.js'), ['text!foo/bar.min.js', 'text!foo/bar.min', 'text!foo/bar.min.js/index', 'text!foo/bar.min.js/index.js', 'text!foo/bar.min.js/index.json']);
  t.deepEqual(nodejsIds('text!foo/bar.html'), ['text!foo/bar.html', 'text!foo/bar.html/index', 'text!foo/bar.html/index.js', 'text!foo/bar.html/index.json']);
  t.end();
});

// mapId

test('mapId returns mapped id', t => {
  const paths = {
    'b-bundle': 'bundles/b.js',
    'foo': 'common/foo',
    'foo/b': '/other/b',
  };

  t.equal(mapId('lorem', paths), 'lorem');
  t.equal(mapId('text!lorem', paths), 'text!lorem');
  t.equal(mapId('lorem/foo', paths), 'lorem/foo');
  t.equal(mapId('text!lorem/foo', paths), 'text!lorem/foo');
  t.equal(mapId('lorem/foo/bar', paths), 'lorem/foo/bar');
  t.equal(mapId('lorem/foo/b', paths), 'lorem/foo/b');
  t.equal(mapId('foo', paths), 'common/foo');
  t.equal(mapId('foo/bar', paths), 'common/foo/bar');
  t.equal(mapId('text!foo/bar.html', paths), 'text!common/foo/bar.html');
  t.equal(mapId('foo2', paths), 'foo2');
  t.equal(mapId('foo/b', paths), '/other/b');
  t.equal(mapId('foo/b/ar', paths), '/other/b/ar');
  t.equal(mapId('text!foo/b/ar.html', paths), 'text!/other/b/ar.html');
  t.equal(mapId('foo/b2', paths), 'common/foo/b2');
  t.equal(mapId('b-bundle', paths), 'bundles/b.js');
  t.end();
});
