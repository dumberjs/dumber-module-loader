import test from 'tape';
import makeSpace from '../src/space';
import {parse} from '../src/id-utils';

const tesseract = {
  global: {},
  mappedId: id => id,
  toUrl: id => 'path/to/' + id,
  req(moduleId) {
    return Promise.reject(new Error('cannot find module ' + moduleId));
  }
};

test('space define named module (nameAnonymous is no-op)', t => {
  const space = makeSpace(tesseract);

  t.notOk(space.has('foo'));
  t.notOk(space.registered('foo'));
  t.notOk(space.defined('foo'));

  const cb = () => 1;
  space.define('foo', cb);

  t.ok(space.has('foo'), 'has module foo');
  t.deepEqual(
    space.registered('foo'),
    {
      id: 'foo',
      deps: [],
      cb
    },
    'foo is registered'
  );
  t.notOk(space.defined('foo'), 'foo is not yet defined');

  // no-op
  space.nameAnonymous('bar');
  t.notOk(space.has('bar'), 'bar is not named');
  t.ok(space.has('foo'), 'still has module foo');

  t.end();
});

test('space define named module (nameAnonymous is no-op) with implicit deps', t => {
  const space = makeSpace(tesseract);

  t.notOk(space.has('foo'));
  t.notOk(space.registered('foo'));
  t.notOk(space.defined('foo'));

  const cb = (req) => 1; // eslint-disable-line no-unused-vars
  space.define('foo', cb);

  t.ok(space.has('foo'), 'has module foo');
  t.deepEqual(
    space.registered('foo'),
    {
      id: 'foo',
      deps: ['require'],
      cb
    },
    'foo is registered'
  );
  t.notOk(space.defined('foo'), 'foo is not yet defined');

  // no-op
  space.nameAnonymous('bar');
  t.notOk(space.has('bar'), 'bar is not named');
  t.ok(space.has('foo'), 'still has module foo');

  t.end();
});

test('space define named module (nameAnonymous is no-op) with implicit deps, case 2', t => {
  const space = makeSpace(tesseract);

  t.notOk(space.has('foo'));
  t.notOk(space.registered('foo'));
  t.notOk(space.defined('foo'));

  // following line bypass browersify pickup on require('a');
  const cb = new Function('require', 'exports', 'module', 'return require("a");');
  space.define('foo', cb);

  t.ok(space.has('foo'), 'has module foo');
  t.deepEqual(
    space.registered('foo'),
    {
      id: 'foo',
      deps: ['require', 'exports', 'module', 'a'],
      cb
    },
    'foo is registered'
  );
  t.notOk(space.defined('foo'), 'foo is not yet defined');

  // no-op
  space.nameAnonymous('bar');
  t.notOk(space.has('bar'), 'bar is not named');
  t.ok(space.has('foo'), 'still has module foo');

  t.end();
});

test('space define named module with deps (nameAnonymous is no-op)', t => {
  const space = makeSpace(tesseract);

  t.notOk(space.has('@scope/foo/bar'));
  t.notOk(space.registered('@scope/foo/bar'));
  t.notOk(space.defined('@scope/foo/bar'));

  const cb = () => 1;
  space.define('@scope/foo/bar', ['a', './b', '../c/d'], cb);

  t.ok(space.has('@scope/foo/bar'), 'has module @scope/foo/bar');
  t.deepEqual(
    space.registered('@scope/foo/bar'),
    {
      id: '@scope/foo/bar',
      deps: ['a', './b', '../c/d'],
      cb
    },
    '@scope/foo/bar is registered'
  );
  t.notOk(space.defined('@scope/foo/bar'), '@scope/foo/bar is not yet defined');

  // no-op
  space.nameAnonymous('foo');
  t.notOk(space.has('foo'), 'foo is not named');
  t.ok(space.has('@scope/foo/bar'), 'still has module @scope/foo/bar');

  t.end();
});

test('space define anonymous module', t => {
  const space = makeSpace(tesseract);

  t.notOk(space.has('foo'));
  t.notOk(space.registered('foo'));
  t.notOk(space.defined('foo'));

  const cb = () => 1;
  space.define(cb);

  t.notOk(space.has('foo'));

  space.nameAnonymous('foo');

  t.ok(space.has('foo'), 'has module foo');
  t.deepEqual(
    space.registered('foo'),
    {
      id: 'foo',
      deps: [],
      cb
    },
    'foo is registered'
  );
  t.notOk(space.defined('foo'), 'foo is not yet defined');

  t.end();
});

test('space define anonymous module width implicit deps', t => {
  const space = makeSpace(tesseract);

  t.notOk(space.has('foo'));
  t.notOk(space.registered('foo'));
  t.notOk(space.defined('foo'));

  const cb = (req) => 1; // eslint-disable-line no-unused-vars
  space.define(cb);

  t.notOk(space.has('foo'));

  space.nameAnonymous('foo');

  t.ok(space.has('foo'), 'has module foo');
  t.deepEqual(
    space.registered('foo'),
    {
      id: 'foo',
      deps: ['require'],
      cb
    },
    'foo is registered'
  );
  t.notOk(space.defined('foo'), 'foo is not yet defined');

  t.end();
});

test('space define anonymous module width implicit deps case2', t => {
  const space = makeSpace(tesseract);

  t.notOk(space.has('foo'));
  t.notOk(space.registered('foo'));
  t.notOk(space.defined('foo'));

  // following line bypass browersify pickup on require('a');
  const cb = new Function('require', 'exports', 'module', 'return require("a");');
  space.define(cb);

  t.notOk(space.has('foo'));

  space.nameAnonymous('foo');

  t.ok(space.has('foo'), 'has module foo');
  t.deepEqual(
    space.registered('foo'),
    {
      id: 'foo',
      deps: ['require', 'exports', 'module', 'a'],
      cb
    },
    'foo is registered'
  );
  t.notOk(space.defined('foo'), 'foo is not yet defined');

  t.end();
});

test('space define anonymous module with deps', t => {
  const space = makeSpace(tesseract);

  t.notOk(space.has('@scope/foo/bar'));
  t.notOk(space.registered('@scope/foo/bar'));
  t.notOk(space.defined('@scope/foo/bar'));

  const cb = () => 1;
  space.define(['a', './b', '../c/d'], cb);

  t.notOk(space.has('@scope/foo/bar'));

  space.nameAnonymous('@scope/foo/bar');

  t.ok(space.has('@scope/foo/bar'), 'has module @scope/foo/bar');
  t.deepEqual(
    space.registered('@scope/foo/bar'),
    {
      id: '@scope/foo/bar',
      deps: ['a', './b', '../c/d'],
      cb
    },
    '@scope/foo/bar is registered'
  );
  t.notOk(space.defined('@scope/foo/bar'), '@scope/foo/bar is not yet defined');

  t.end();
});

test('space understand Nodejs module name convention on .js extension', t => {
  const space = makeSpace(tesseract);
  const cb = () => 1;
  space.define('foo', cb);

  t.ok(space.registered('foo'));
  t.ok(space.registered('foo.js'), 'normalise .js extension');
  t.ok(space.registered('foo.ts'), 'normalise .ts extension');
  t.notOk(space.registered('text!foo'), 'does not normalise plugin prefix');
  t.end();
});

test('space understand Nodejs module name convention on .js extension case2', t => {
  const space = makeSpace(tesseract);
  const cb = () => 1;
  space.define('foo.js', cb);

  t.ok(space.registered('foo.js'));
  t.ok(space.registered('foo'), 'normalise .js extension');
  t.notOk(space.registered('foo.ts'), 'does not normalise unknown extension');
  t.notOk(space.registered('text!foo.js'), 'does not normalise plugin prefix');
  t.end();
});

test('space understand Nodejs module name convention on implicit /index', t => {
  const space = makeSpace(tesseract);
  const cb = () => 1;
  space.define('foo/index', cb);

  t.ok(space.registered('foo/index'));
  t.ok(space.registered('foo/index.js'), 'normalise .js extension');
  t.ok(space.registered('foo/index.ts'), 'normalise .ts extension');
  t.notOk(space.registered('text!foo/index'), 'does not normalise plugin prefix');
  t.notOk(space.registered('text!foo/index.js'), 'does not normalise plugin prefix');

  t.ok(space.registered('foo'), 'tries implicit /index');
  t.notOk(space.registered('foo.js'));
  t.end();
});

test('space understand Nodejs module name convention on implicit /index.js', t => {
  const space = makeSpace(tesseract);
  const cb = () => 1;
  space.define('foo/index.js', cb);

  t.ok(space.registered('foo/index.js'));
  t.ok(space.registered('foo/index'), 'normalise .js extension');
  t.notOk(space.registered('foo/index.ts'), 'does not normalise unknown extension');
  t.notOk(space.registered('text!foo/index.js'), 'does not normalise plugin prefix');
  t.notOk(space.registered('text!foo/index'), 'does not normalise plugin prefix');

  t.ok(space.registered('foo'), 'tries implicit /index.js');
  t.notOk(space.registered('foo.js'));
  t.end();
});

test('space.req returns the value and move the module from registered to defined', t => {
  const space = makeSpace(tesseract);
  space.define('foo/index.js', 5);

  t.deepEqual(space.registered('foo'), {id: 'foo/index.js', deps: [], cb: 5});
  t.deepEqual(space.registered('foo/index'), {id: 'foo/index.js', deps: [], cb: 5});
  t.deepEqual(space.registered('foo/index.js'), {id: 'foo/index.js', deps: [], cb: 5});
  t.notOk(space.defined('foo'));
  t.notOk(space.defined('foo/index'));
  t.notOk(space.defined('foo/index.js'));

  const value = space.req('foo');
  t.equal(value, 5);
  t.notOk(space.registered('foo'));
  t.notOk(space.registered('foo/index'));
  t.notOk(space.registered('foo/index.js'));

  t.deepEqual(space.defined('foo'), {id: 'foo/index.js', deps: [], cb: 5, val: 5});
  t.deepEqual(space.defined('foo/index'), {id: 'foo/index.js', deps: [], cb: 5, val: 5});
  t.deepEqual(space.defined('foo/index.js'), {id: 'foo/index.js', deps: [], cb: 5, val: 5});
  t.end();
});

test('space.req returns the evaluated value and move the module from registered to defined', t => {
  const space = makeSpace(tesseract);
  const cb = () => 5;
  space.define('foo/index', cb);

  t.deepEqual(space.registered('foo'), {id: 'foo/index', deps: [], cb});
  t.deepEqual(space.registered('foo/index'), {id: 'foo/index', deps: [], cb});
  t.deepEqual(space.registered('foo/index.js'), {id: 'foo/index', deps: [], cb});
  t.notOk(space.defined('foo'));
  t.notOk(space.defined('foo/index'));
  t.notOk(space.defined('foo/index.js'));

  const value = space.req('foo//index.js');
  t.equal(value, 5);
  t.notOk(space.registered('foo'));
  t.notOk(space.registered('foo/index'));
  t.notOk(space.registered('foo/index.js'));

  t.deepEqual(space.defined('foo'), {id: 'foo/index', deps: [], cb, val: 5});
  t.deepEqual(space.defined('foo/index'), {id: 'foo/index', deps: [], cb, val: 5});
  t.deepEqual(space.defined('foo/index.js'), {id: 'foo/index', deps: [], cb, val: 5});
  t.end();
});

test('space.req resolve dependencies', t => {
  const space = makeSpace(tesseract);
  t.deepEqual(space.ids(), []);
  space.define('foo/sum', ['a', './b'], (a, b) => a + b);
  space.define('a/index', ['./a'], a => a);
  space.define('a/a', () => 2);
  space.define('foo/b', 3);

  t.ok(space.registered('foo/sum'));
  t.ok(space.registered('a'));
  t.ok(space.registered('foo/b'));
  t.notOk(space.defined('foo/sum'));
  t.notOk(space.defined('a'));
  t.notOk(space.defined('foo/b'));
  t.deepEqual(space.ids(), ['a/a', 'a/index', 'foo/b', 'foo/sum']);

  const value = space.req('foo/sum');
  t.equal(value, 5);
  t.notOk(space.registered('foo/sum'));
  t.notOk(space.registered('a'));
  t.notOk(space.registered('foo/b'));

  t.ok(space.defined('foo/sum'));
  t.ok(space.defined('a'));
  t.ok(space.defined('foo/b'));
  t.deepEqual(space.ids(), ['a/a', 'a/index', 'foo/b', 'foo/sum']);
  t.end();
});

test('space.req resolve dependencies with mappedId', t => {
  const space = makeSpace({
    ...tesseract,
    mappedId: id => {
      const parsed = parse(id);
      if (parsed.parts[0] === 'a') return parsed.prefix + 'common/' + parsed.cleanId;
      return id;
    }
  });
  t.deepEqual(space.ids(), []);
  space.define('foo/sum', ['a', './b'], (a, b) => a + b);
  space.define('common/a/index', ['./a'], a => a);
  space.define('common/a/a', () => 2);
  space.define('foo/b', 3);

  t.ok(space.registered('foo/sum'));
  t.notOk(space.registered('a'));
  t.ok(space.registered('common/a'));
  t.notOk(space.registered('a/a'));
  t.ok(space.registered('common/a/a'));
  t.ok(space.registered('foo/b'));
  t.notOk(space.defined('foo/sum'));
  t.notOk(space.defined('a'));
  t.notOk(space.defined('common/a'));
  t.notOk(space.defined('a/a'));
  t.notOk(space.defined('common/a/a'));
  t.notOk(space.defined('foo/b'));
  t.deepEqual(space.ids(), ['common/a/a', 'common/a/index', 'foo/b', 'foo/sum']);

  const value = space.req('foo/sum');
  t.equal(value, 5);
  t.notOk(space.registered('foo/sum'));
  t.notOk(space.registered('a'));
  t.notOk(space.registered('common/a'));
  t.notOk(space.registered('a/a'));
  t.notOk(space.registered('common/a/a'));
  t.notOk(space.registered('foo/b'));

  t.ok(space.defined('foo/sum'));
  t.notOk(space.defined('a'));
  t.ok(space.defined('common/a'));
  t.notOk(space.defined('a/a'));
  t.ok(space.defined('common/a/a'));
  t.ok(space.defined('foo/b'));
  t.deepEqual(space.ids(), ['common/a/a', 'common/a/index', 'foo/b', 'foo/sum']);
  t.end();
});

test('space.req accesses tesseract global and req, sychronously', t => {
  const _global = {};
  const req = function (id) {
    if (id === 'a') return 2;
    return Promise.reject(new Error('cannot find module ' + id));
  };

  const space = makeSpace({global: _global, req, mappedId: id => id});
  space.define('foo', ['a'], function (a) {
    this.foo = a + 3;
    return this.foo;
  });

  t.deepEqual(space.ids(), ['foo']);

  const value = space.req('foo');
  t.equal(value, 5);
  t.notOk(space.has('a'));
  t.ok(space.defined('foo'));
  t.equal(_global.foo, 5, 'mutate global');
  t.deepEqual(space.ids(), ['foo']);
  t.end();
});

test('space.req accesses tesseract global and req, asynchronously', t => {
  const _global = {};
  const req = function (id) {
    if (id === 'a') return Promise.resolve(2);
    return Promise.reject(new Error('cannot find module ' + id));
  };

  const space = makeSpace({global: _global, req, mappedId: id => id});
  space.define('foo', ['a'], function (a) {
    this.foo = a + 3;
    return this.foo;
  });

  t.deepEqual(space.ids(), ['foo']);

  space.req('foo').then(
    value => {
      t.equal(value, 5);
      t.notOk(space.has('a'));
      t.ok(space.defined('foo'));
      t.equal(_global.foo, 5, 'mutate global');
      t.deepEqual(space.ids(), ['foo']);
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('space.req fails tesseract req asynchronously', t => {
  const space = makeSpace(tesseract);
  space.define('foo', ['a'], a => a + 3);

  space.req('foo').then(
    () => {
      t.fail('should not get foo!');
    },
    err => {
      t.equal(err.message, 'cannot find module a');
    }
  ).then(t.end);
});

test('space.req fails tesseract.req with commonjs wrapper asynchronously', t => {
  const space = makeSpace(tesseract);
  space.define('foo', ['require', 'module', 'a'], function (require, module, a) {
    module.exports = a + 3;
  });

  space.req('foo').then(
    () => {
      t.fail('should not get foo!');
    },
    err => {
      t.equal(err.message, 'cannot find module a');
    }
  ).then(t.end);
});

test('space.req supports commonjs wrapper', t => {
  const space = makeSpace(tesseract);
  space.define('foo/bar', ['require', 'exports', 'module', 'a'], new Function('require', 'exports', 'module', `
    var __filename = module.uri || '', __dirname = __filename.slice(0, __filename.lastIndexOf('/') + 1);
    const a = require('a');
    exports.foo = a + 3;
    exports.filename = __filename;
    exports.dirname = __dirname;
  `));
  space.define('a', ['module'], function (module) {
    module.exports = 2;
  });

  t.notOk(space.has('require'));
  t.notOk(space.has('exports'));
  t.notOk(space.has('module'));
  t.ok(space.registered('foo/bar'));
  t.ok(space.registered('a'));
  t.notOk(space.defined('foo/bar'));
  t.notOk(space.defined('a'));

  t.deepEqual(space.ids(), ['a', 'foo/bar']);

  const value = space.req('foo/bar');
  t.deepEqual(value, {foo: 5, filename: 'foo/bar.js', dirname: 'foo/'});
  t.notOk(space.has('require'));
  t.notOk(space.has('exports'));
  t.notOk(space.has('module'));
  t.notOk(space.registered('foo/bar'));
  t.notOk(space.registered('a'));
  t.ok(space.defined('foo/bar'));
  t.ok(space.defined('a'));
  t.deepEqual(space.ids(), ['a', 'foo/bar']);
  t.end();
});

test('space.req loads missing commonjs dep sychronously, as long as it is defined', t => {
  const space = makeSpace(tesseract);
  space.define('foo', ['require', 'exports', 'module'], new Function('require', 'exports', 'module', `
    const a = require('a');
    exports.foo = a + 3;
  `));
  space.define('a', ['module'], function (module) {
    module.exports = 2;
  });

  t.deepEqual(space.ids(), ['a', 'foo']);
  t.equal(space.req('foo').foo, 5);
  t.end();
});

test('space.req fails missing commonjs dep sychronously', t => {
  const space = makeSpace(tesseract);
  space.define('foo', ['require', 'exports', 'module'], new Function('require', 'exports', 'module', `
    const a = require('a');
    exports.foo = a + 3;
  `));

  t.deepEqual(space.ids(), ['foo']);
  t.throws(() => space.req('foo'));
  t.end();
});

test('space.undef removes module, re-eval all modules deps on it', t => {
  const space = makeSpace({
    ...tesseract,
    mappedId: id => {
      const parsed = parse(id);
      if (parsed.parts[0] === 'foo') return parsed.prefix + 'common/' + parsed.cleanId;
      return id;
    }
  });
  space.define('bar', ['foo'], f => f + 3);
  space.define('common/foo', ['a'], a => a + 3);
  space.define('a', 2);

  t.ok(space.has('bar'));
  t.notOk(space.has('foo'));
  t.ok(space.has('common/foo'));
  t.ok(space.has('a'));

  t.deepEqual(space.ids(), ['a', 'bar', 'common/foo']);

  const value = space.req('bar');
  t.equal(value, 8);
  t.notOk(space.registered('bar'));
  t.notOk(space.registered('foo'));
  t.notOk(space.registered('common/foo'));
  t.notOk(space.registered('a'));
  t.ok(space.defined('bar'));
  t.notOk(space.defined('foo'));
  t.ok(space.defined('common/foo'));
  t.ok(space.defined('a'));

  space.undef('a.js');
  t.ok(space.registered('bar'));
  t.notOk(space.registered('foo'));
  t.ok(space.registered('common/foo'));
  t.notOk(space.defined('bar'));
  t.notOk(space.defined('foo'));
  t.notOk(space.defined('common/foo'));
  t.notOk(space.has('a'));

  t.deepEqual(space.ids(), ['bar', 'common/foo']);

  space.define('a',  5);

  t.deepEqual(space.ids(), ['a', 'bar', 'common/foo']);
  t.ok(space.has('bar'));
  t.notOk(space.has('foo'));
  t.ok(space.has('common/foo'));
  t.ok(space.has('a'));

  const value2 = space.req('bar');
  t.equal(value2, 11);
  t.end();
});

test('space.purge cleanup everything', t => {
  const space = makeSpace(tesseract);
  space.define('bar', ['foo'], f => f + 3);
  space.define('foo', ['a'], a => a + 3);
  space.define('a', 2);
  space.alias('b', 'a');

  t.ok(space.has('bar'));
  t.ok(space.has('foo'));
  t.ok(space.has('a'));
  t.ok(space.has('b'));

  t.deepEqual(space.ids(), ['a', 'b', 'bar', 'foo']);

  space.purge();
  t.notOk(space.has('bar'));
  t.notOk(space.has('foo'));
  t.notOk(space.has('a'));
  t.notOk(space.has('b'));
  t.equal(space.ids().length, 0);
  t.end();
});

test('space commonjs require supports toUrl', t => {
  const space = makeSpace(tesseract);
  space.define('foo', ['require'], req => req.toUrl('lorem'));
  t.equal(space.req('foo'), 'path/to/lorem');
  t.end();
});

test('space supports circular dependencies as long as it is delayed', t => {
  const space = makeSpace(tesseract);
  space.define('foo', ['require', 'exports', 'bar'], (req, exp) => {
    exp.message = () => req('bar').message();
  });
  space.define('bar', ['require', 'foo'], req => {
    var bar = function (arg) {
      return arg + "-" + req("foo").message();
    };

    bar.message = function () {
        return "bar";
    };

    return bar;
  });

  t.equal(space.req('foo').message(), 'bar');
  t.end();
});

test('space supports circular dependencies as long as it is delayed, case2', t => {
  const space = makeSpace(tesseract);
  space.define('foo', ['require', 'exports', 'bar'], (req, exp) => {
    exp.message = () => req('bar').message();
  });
  space.define('bar', ['require', 'foo'], req => {
    var bar = function (arg) {
      return arg + "-" + req("foo").message();
    };

    bar.message = function () {
      return "bar";
    };

    return bar;
  });

  t.equal(space.req('bar')('hello'), 'hello-bar');
  t.end();
});

test('space supports above surface module id', t => {
  const space = makeSpace(tesseract);
  space.define('app', ['../package.json'], meta => meta.version);
  space.define('../package.json', {version: '1.0.0'});

  t.equal(space.req('app'), '1.0.0');
  t.end();
});

test('space supports above surface module id, case2', t => {
  const space = makeSpace(tesseract);
  space.define('foo/bar', ['../../package.json'], meta => meta.version);
  space.define('../package.json', {version: '1.0.0'});

  t.equal(space.req('foo/bar'), '1.0.0');
  t.end();
});

test('space deals with yallist like circular dependencies', t => {
  const space = makeSpace(tesseract);

  space.define('yallist/yallist', ['require', 'exports', 'module', './iterator'], new Function('require', 'exports', 'module', `
    module.exports = Yallist;
    function Yallist () {};
    require('./iterator.js');
  `));

  space.define('yallist/iterator', ['require', 'exports', 'module', './yallist'], function(req) {
    var Yallist = req('./yallist.js');
    Yallist.iterator = 'got';
  });

  const Yallist = space.req('yallist/yallist');
  t.equal((typeof Yallist), 'function');
  t.equal(Yallist.iterator, 'got');
  t.end();
});

test('space deals with des.js like circular dependencies', t => {
  const space = makeSpace(tesseract);

  space.define('des.js/des', ['require', 'exports', 'module', './lib/cipher', './lib/des'], new Function('require', 'exports', 'module', `
    exports.Cipher = require('./lib/cipher');
    exports.DES = require('./lib/des');
  `));

  space.define('des.js/lib/cipher', ['require', 'exports', 'module'], new Function('require', 'exports', 'module', `
    module.exports = function(msg) { return 'Cipher:' + msg; };
  `));

  space.define('des.js/lib/des', ['require', 'exports', 'module', '../des'], new Function('require', 'exports', 'module', `
    var Cipher = require('../des').Cipher;
    module.exports = function(msg) { return 'DES:' + Cipher(msg); };
  `));

  space.alias('des', 'des.js/des');

  // Note the entry is des.js, the first dep 'des.js/des' is in a circular dep loop, but should still be loaded.
  // circular dep is only skipped when 'des.js/des' tries to load 'des.js/lib/des'.
  const des = space.req('des.js');
  t.equal((typeof des.DES), 'function');
  t.equal((typeof des.Cipher), 'function');
  t.equal(des.DES('lorem'), 'DES:Cipher:lorem');
  t.end();
});

test('space deals with alias + cirular deps', t => {
  const space = makeSpace(tesseract);

  space.alias('foo', 'foo/index');

  space.define('foo/index', ['require', 'exports', 'module', '../bar'], new Function('require', 'exports', 'module', `
    var bar = require('../bar');
    exports.foo = function(msg) { return 'foo:' + bar(msg); };
    exports.inner = function(msg) { return 'inner:' + msg; };
  `));

  space.define('bar', ['require', 'exports', 'module', './foo'], new Function('require', 'exports', 'module', `
    var foo = require('./foo');
    module.exports = function(msg) { return 'bar:' + foo.inner(msg); };
  `));

  const foo = space.req('foo');
  t.equal((typeof foo.foo), 'function');
  t.equal(foo.foo('lorem'), 'foo:bar:inner:lorem');
  t.end();
});

test('space reports definedValues', t => {
  const space = makeSpace(tesseract);
  space.define('foo', ['a'], a => a + 1);
  space.define('a', 2);
  space.define('b', 0);

  t.deepEqual(space.definedValues(), {});
  space.req('foo');
  t.deepEqual(space.definedValues(), {a: 2, foo: 3});
  t.end();
});

test('space skips define on existing module', t => {
  const space = makeSpace(tesseract);
  space.define('a', 1);
  space.define('a', 2);
  t.equal(space.req('a'), 1);
  t.end();
});

test('space skips define on existing module, case2', t => {
  const space = makeSpace(tesseract);
  space.define('a', 1);
  t.equal(space.req('a'), 1); // promote 'a' from registered to defined
  space.define('a', 2);
  t.equal(space.req('a'), 1);
  t.end();
});

test('space does not do endless circular deps check', t => {
  const space = makeSpace(tesseract);

  space.define('test', ['test1'], function(y) { return y; });
  space.define('test1', ['require', 'yallist/yallist'], function(req) {
    const y = req('yallist/yallist');
    return y;
  });
  space.define('yallist/yallist', ['require', 'exports', 'module', './iterator'], new Function('require', 'exports', 'module', `
    module.exports = Yallist;
    function Yallist () {};
    require('./iterator.js');
  `));

  space.define('yallist/iterator', ['require', 'exports', 'module', './yallist'], function(req) {
    var Yallist = req('./yallist.js');
    Yallist.iterator = 'got';
  });

  const Yallist = space.req('test');
  t.equal((typeof Yallist), 'function');
  t.equal(Yallist.iterator, 'got');
  t.end();
});
