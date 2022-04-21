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
  t.deepEqual(parse('a.mjs'), {prefix: '', bareId: 'a.mjs', parts: ['a.mjs'], ext: '.mjs', cleanId: 'a.mjs'});
  t.deepEqual(parse('a.cjs'), {prefix: '', bareId: 'a.cjs', parts: ['a.cjs'], ext: '.cjs', cleanId: 'a.cjs'});
  t.deepEqual(parse('/a//./b.js'), {prefix: '', bareId: '/a/b.js', parts: ['/a', 'b.js'], ext: '.js', cleanId: '/a/b.js'});
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

test('parse parses remote id', t => {
  t.deepEqual(parse('https://cdnjs.com/a/b'), {prefix: '', bareId: 'https://cdnjs.com/a/b', parts: ['https://cdnjs.com', 'a', 'b'], ext: '', cleanId: 'https://cdnjs.com/a/b'});
  t.deepEqual(parse('//cdnjs.com/a/b'), {prefix: '', bareId: '//cdnjs.com/a/b', parts: ['//cdnjs.com', 'a', 'b'], ext: '', cleanId: '//cdnjs.com/a/b'});
  t.deepEqual(parse('/a/b'), {prefix: '', bareId: '/a/b', parts: ['/a', 'b'], ext: '', cleanId: '/a/b'});

  t.deepEqual(parse('https://cdnjs.com/a/b/./../c'), {prefix: '', bareId: 'https://cdnjs.com/a/c', parts: ['https://cdnjs.com', 'a', 'c'], ext: '', cleanId: 'https://cdnjs.com/a/c'});
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
  t.equal(resolveModuleId('../test/app.spec', '../src/app'), '../src/app');
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
  t.equal(relativeModuleId('../test/app.spec', '../src/app'), '../src/app');
  t.end();
});

// nodejsIds

test('nodejsIds returns possible nodejs ids', t => {
  t.deepEqual(nodejsIds('foo'), ['foo', 'foo.js', 'foo.json', 'foo.mjs', 'foo.cjs', 'foo/index', 'foo/index.js', 'foo/index.json', 'foo/index.mjs', 'foo/index.cjs']);
  t.deepEqual(nodejsIds('foo.js'), ['foo.js', 'foo', 'foo.js.js', 'foo.js.json', 'foo.js.mjs', 'foo.js.cjs', 'foo.js/index', 'foo.js/index.js', 'foo.js/index.json', 'foo.js/index.mjs', 'foo.js/index.cjs']);
  t.deepEqual(nodejsIds('foo.ts'), ['foo.ts', 'foo', 'foo.ts.js', 'foo.ts.json', 'foo.ts.mjs', 'foo.ts.cjs', 'foo.ts/index', 'foo.ts/index.js', 'foo.ts/index.json', 'foo.ts/index.mjs', 'foo.ts/index.cjs']);
  t.deepEqual(nodejsIds('foo.less'), ['foo.less', 'foo.css', 'foo.less.js', 'foo.less.json', 'foo.less.mjs', 'foo.less.cjs', 'foo.less/index', 'foo.less/index.js', 'foo.less/index.json', 'foo.less/index.mjs', 'foo.less/index.cjs']);
  t.deepEqual(nodejsIds('foo.json'), ['foo.json', 'foo.json.js', 'foo.json.json', 'foo.json.mjs', 'foo.json.cjs', 'foo.json/index', 'foo.json/index.js', 'foo.json/index.json', 'foo.json/index.mjs', 'foo.json/index.cjs']);
  t.deepEqual(nodejsIds('foo.min'), ['foo.min', 'foo.min.js', 'foo.min.json', 'foo.min.mjs', 'foo.min.cjs', 'foo.min/index', 'foo.min/index.js', 'foo.min/index.json', 'foo.min/index.mjs', 'foo.min/index.cjs']);
  t.deepEqual(nodejsIds('foo.min.js'), ['foo.min.js', 'foo.min', 'foo.min.js.js', 'foo.min.js.json', 'foo.min.js.mjs', 'foo.min.js.cjs', 'foo.min.js/index', 'foo.min.js/index.js', 'foo.min.js/index.json', 'foo.min.js/index.mjs', 'foo.min.js/index.cjs']);
  t.deepEqual(nodejsIds('foo.html'), ['foo.html', 'foo.html.js', 'foo.html.json', 'foo.html.mjs', 'foo.html.cjs',  'foo.html/index', 'foo.html/index.js', 'foo.html/index.json', 'foo.html/index.mjs', 'foo.html/index.cjs']);
  t.deepEqual(nodejsIds('foo.haml'), ['foo.haml', 'foo.html', 'foo.haml.js', 'foo.haml.json', 'foo.haml.mjs', 'foo.haml.cjs',  'foo.haml/index', 'foo.haml/index.js', 'foo.haml/index.json', 'foo.haml/index.mjs', 'foo.haml/index.cjs']);

  t.deepEqual(nodejsIds('text!foo/bar'), ['text!foo/bar', 'text!foo/bar.js', 'text!foo/bar.json', 'text!foo/bar.mjs', 'text!foo/bar.cjs', 'text!foo/bar/index', 'text!foo/bar/index.js', 'text!foo/bar/index.json', 'text!foo/bar/index.mjs', 'text!foo/bar/index.cjs']);
  t.deepEqual(nodejsIds('text!foo/bar.js'), ['text!foo/bar.js', 'text!foo/bar', 'text!foo/bar.js.js', 'text!foo/bar.js.json', 'text!foo/bar.js.mjs', 'text!foo/bar.js.cjs', 'text!foo/bar.js/index', 'text!foo/bar.js/index.js', 'text!foo/bar.js/index.json', 'text!foo/bar.js/index.mjs', 'text!foo/bar.js/index.cjs']);
  t.deepEqual(nodejsIds('text!foo/bar.json'), ['text!foo/bar.json', 'text!foo/bar.json.js', 'text!foo/bar.json.json', 'text!foo/bar.json.mjs', 'text!foo/bar.json.cjs', 'text!foo/bar.json/index', 'text!foo/bar.json/index.js', 'text!foo/bar.json/index.json', 'text!foo/bar.json/index.mjs', 'text!foo/bar.json/index.cjs']);
  t.deepEqual(nodejsIds('text!foo/bar.min'), ['text!foo/bar.min', 'text!foo/bar.min.js', 'text!foo/bar.min.json', 'text!foo/bar.min.mjs', 'text!foo/bar.min.cjs', 'text!foo/bar.min/index', 'text!foo/bar.min/index.js', 'text!foo/bar.min/index.json', 'text!foo/bar.min/index.mjs', 'text!foo/bar.min/index.cjs']);
  t.deepEqual(nodejsIds('text!foo/bar.min.js'), ['text!foo/bar.min.js', 'text!foo/bar.min', 'text!foo/bar.min.js.js', 'text!foo/bar.min.js.json', 'text!foo/bar.min.js.mjs', 'text!foo/bar.min.js.cjs', 'text!foo/bar.min.js/index', 'text!foo/bar.min.js/index.js', 'text!foo/bar.min.js/index.json', 'text!foo/bar.min.js/index.mjs', 'text!foo/bar.min.js/index.cjs']);
  t.deepEqual(nodejsIds('text!foo/bar.html'), ['text!foo/bar.html', 'text!foo/bar.html.js', 'text!foo/bar.html.json', 'text!foo/bar.html.mjs', 'text!foo/bar.html.cjs', 'text!foo/bar.html/index', 'text!foo/bar.html/index.js', 'text!foo/bar.html/index.json', 'text!foo/bar.html/index.mjs', 'text!foo/bar.html/index.cjs']);
  t.end();
});

// mapId

test('mapId returns mapped id', t => {
  const paths = {
    'b-bundle': 'bundles/b.js',
    'foo': 'common/foo',
    'foo/b': '/other/b',
    'el': '@some/name-space/el',
    '../src': '',
    'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.20.0/min/vs'
  };

  t.equal(mapId('lorem', paths), 'lorem');
  t.equal(mapId('./lorem', paths), 'lorem');
  t.equal(mapId('text!lorem', paths), 'text!lorem');
  t.equal(mapId('lorem/foo', paths), 'lorem/foo');
  t.equal(mapId('text!lorem/foo', paths), 'text!lorem/foo');
  t.equal(mapId('lorem/foo/bar', paths), 'lorem/foo/bar');
  t.equal(mapId('lorem/foo/b', paths), 'lorem/foo/b');
  t.equal(mapId('foo', paths), 'common/foo');
  t.equal(mapId('./foo', paths), 'common/foo');
  t.equal(mapId('foo/bar', paths), 'common/foo/bar');
  t.equal(mapId('text!foo/bar.html', paths), 'text!common/foo/bar.html');
  t.equal(mapId('foo2', paths), 'foo2');
  t.equal(mapId('foo/b', paths), '/other/b');
  t.equal(mapId('foo/b/ar', paths), '/other/b/ar');
  t.equal(mapId('text!foo/b/ar.html', paths), 'text!/other/b/ar.html');
  t.equal(mapId('foo/b2', paths), 'common/foo/b2');
  t.equal(mapId('b-bundle', paths), 'bundles/b.js');
  t.equal(mapId('../src/app', paths), 'app');
  t.equal(mapId('../src', paths), 'index');
  t.equal(mapId('text!../src/foo/bar.html', paths), 'text!foo/bar.html');
  t.equal(mapId('el!../src/foo/bar.html', paths), '@some/name-space/el!foo/bar.html');
  t.equal(mapId('vs/editor/editor.main.js', paths), 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.20.0/min/vs/editor/editor.main.js');
  t.end();
});
