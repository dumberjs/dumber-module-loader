import test from 'tape';
import {Space} from '../src/space';
import {parse} from '../src/id-utils';

const tesseract = {
  global: {},
  mappedId: id => id,
  req(moduleId) {
    return Promise.reject(new Error('cannot find module ' + moduleId));
  }
};

test('space define named module (nameAnonymousModule is no-op)', t => {
  const space = new Space(tesseract);

  t.notOk(space.has('foo'));
  t.notOk(space.registered('foo'));
  t.notOk(space.defined('foo'));

  const callback = () => 1;
  space.define('foo', callback);

  t.ok(space.has('foo'), 'has module foo');
  t.deepEqual(
    space.registered('foo'),
    {
      id: 'foo',
      deps: [],
      callback
    },
    'foo is registered'
  );
  t.notOk(space.defined('foo'), 'foo is not yet defined');

  // no-op
  space.nameAnonymousModule('bar');
  t.notOk(space.has('bar'), 'bar is not named');
  t.ok(space.has('foo'), 'still has module foo');

  t.end();
});

test('space define named module with deps (nameAnonymousModule is no-op)', t => {
  const space = new Space(tesseract);

  t.notOk(space.has('@scope/foo/bar'));
  t.notOk(space.registered('@scope/foo/bar'));
  t.notOk(space.defined('@scope/foo/bar'));

  const callback = () => 1;
  space.define('@scope/foo/bar', ['a', './b', '../c/d'], callback);

  t.ok(space.has('@scope/foo/bar'), 'has module @scope/foo/bar');
  t.deepEqual(
    space.registered('@scope/foo/bar'),
    {
      id: '@scope/foo/bar',
      deps: ['a', './b', '../c/d'],
      callback
    },
    '@scope/foo/bar is registered'
  );
  t.notOk(space.defined('@scope/foo/bar'), '@scope/foo/bar is not yet defined');

  // no-op
  space.nameAnonymousModule('foo');
  t.notOk(space.has('foo'), 'foo is not named');
  t.ok(space.has('@scope/foo/bar'), 'still has module @scope/foo/bar');

  t.end();
});

test('space define anonymous module', t => {
  const space = new Space(tesseract);

  t.notOk(space.has('foo'));
  t.notOk(space.registered('foo'));
  t.notOk(space.defined('foo'));

  const callback = () => 1;
  space.define(callback);

  t.notOk(space.has('foo'));

  space.nameAnonymousModule('foo');

  t.ok(space.has('foo'), 'has module foo');
  t.deepEqual(
    space.registered('foo'),
    {
      id: 'foo',
      deps: [],
      callback
    },
    'foo is registered'
  );
  t.notOk(space.defined('foo'), 'foo is not yet defined');

  t.end();
});

test('space define anonymous module with deps', t => {
  const space = new Space(tesseract);

  t.notOk(space.has('@scope/foo/bar'));
  t.notOk(space.registered('@scope/foo/bar'));
  t.notOk(space.defined('@scope/foo/bar'));

  const callback = () => 1;
  space.define(['a', './b', '../c/d'], callback);

  t.notOk(space.has('@scope/foo/bar'));

  space.nameAnonymousModule('@scope/foo/bar');

  t.ok(space.has('@scope/foo/bar'), 'has module @scope/foo/bar');
  t.deepEqual(
    space.registered('@scope/foo/bar'),
    {
      id: '@scope/foo/bar',
      deps: ['a', './b', '../c/d'],
      callback
    },
    '@scope/foo/bar is registered'
  );
  t.notOk(space.defined('@scope/foo/bar'), '@scope/foo/bar is not yet defined');

  t.end();
});

test('space understand Nodejs module name convention on .js extension', t => {
  const space = new Space(tesseract);
  const callback = () => 1;
  space.define('foo', callback);

  t.ok(space.registered('foo'));
  t.ok(space.registered('foo.js'), 'normalise .js extension');
  t.notOk(space.registered('foo.ts'), 'does not normalise unknown extension');
  t.notOk(space.registered('text!foo'), 'does not normalise plugin prefix');
  t.end();
});

test('space understand Nodejs module name convention on .js extension case2', t => {
  const space = new Space(tesseract);
  const callback = () => 1;
  space.define('foo.js', callback);

  t.ok(space.registered('foo.js'));
  t.ok(space.registered('foo'), 'normalise .js extension');
  t.notOk(space.registered('foo.ts'), 'does not normalise unknown extension');
  t.notOk(space.registered('text!foo.js'), 'does not normalise plugin prefix');
  t.end();
});

test('space understand Nodejs module name convention on implicit /index', t => {
  const space = new Space(tesseract);
  const callback = () => 1;
  space.define('foo/index', callback);

  t.ok(space.registered('foo/index'));
  t.ok(space.registered('foo/index.js'), 'normalise .js extension');
  t.notOk(space.registered('foo/index.ts'), 'does not normalise unknown extension');
  t.notOk(space.registered('text!foo/index'), 'does not normalise plugin prefix');
  t.notOk(space.registered('text!foo/index.js'), 'does not normalise plugin prefix');

  t.ok(space.registered('foo'), 'tries implicit /index');
  t.notOk(space.registered('foo.js'));
  t.end();
});

test('space understand Nodejs module name convention on implicit /index.js', t => {
  const space = new Space(tesseract);
  const callback = () => 1;
  space.define('foo/index.js', callback);

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
  const space = new Space(tesseract);
  space.define('foo/index.js', 5);

  t.deepEqual(space.registered('foo'), {id: 'foo/index.js', deps: [], callback: 5});
  t.deepEqual(space.registered('foo/index'), {id: 'foo/index.js', deps: [], callback: 5});
  t.deepEqual(space.registered('foo/index.js'), {id: 'foo/index.js', deps: [], callback: 5});
  t.notOk(space.defined('foo'));
  t.notOk(space.defined('foo/index'));
  t.notOk(space.defined('foo/index.js'));

  space.req('foo').then(
    value => {
      t.equal(value, 5);
      t.notOk(space.registered('foo'));
      t.notOk(space.registered('foo/index'));
      t.notOk(space.registered('foo/index.js'));

      t.deepEqual(space.defined('foo'), {id: 'foo/index.js', deps: [], callback: 5, value: 5});
      t.deepEqual(space.defined('foo/index'), {id: 'foo/index.js', deps: [], callback: 5, value: 5});
      t.deepEqual(space.defined('foo/index.js'), {id: 'foo/index.js', deps: [], callback: 5, value: 5});
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('space.req returns the evaluated value and move the module from registered to defined', t => {
  const space = new Space(tesseract);
  const callback = () => 5;
  space.define('foo/index', callback);

  t.deepEqual(space.registered('foo'), {id: 'foo/index', deps: [], callback});
  t.deepEqual(space.registered('foo/index'), {id: 'foo/index', deps: [], callback});
  t.deepEqual(space.registered('foo/index.js'), {id: 'foo/index', deps: [], callback});
  t.notOk(space.defined('foo'));
  t.notOk(space.defined('foo/index'));
  t.notOk(space.defined('foo/index.js'));

  space.req('foo//index.js').then(
    value => {
      t.equal(value, 5);
      t.notOk(space.registered('foo'));
      t.notOk(space.registered('foo/index'));
      t.notOk(space.registered('foo/index.js'));

      t.deepEqual(space.defined('foo'), {id: 'foo/index', deps: [], callback, value: 5});
      t.deepEqual(space.defined('foo/index'), {id: 'foo/index', deps: [], callback, value: 5});
      t.deepEqual(space.defined('foo/index.js'), {id: 'foo/index', deps: [], callback, value: 5});
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('space.req resolve dependencies', t => {
  const space = new Space(tesseract);
  t.deepEqual(space.ids(), []);
  space.define('foo/sum', ['a', './b'], (a, b) => a + b);
  space.define('a/index', ['./a'], a => a);
  space.define('a/a', [], () => 2);
  space.define('foo/b', [], 3);

  t.ok(space.registered('foo/sum'));
  t.ok(space.registered('a'));
  t.ok(space.registered('foo/b'));
  t.notOk(space.defined('foo/sum'));
  t.notOk(space.defined('a'));
  t.notOk(space.defined('foo/b'));
  t.deepEqual(space.ids(), ['a/a', 'a/index', 'foo/b', 'foo/sum']);

  space.req('foo/sum').then(
    value => {
      t.equal(value, 5);
      t.notOk(space.registered('foo/sum'));
      t.notOk(space.registered('a'));
      t.notOk(space.registered('foo/b'));

      t.ok(space.defined('foo/sum'));
      t.ok(space.defined('a'));
      t.ok(space.defined('foo/b'));
      t.deepEqual(space.ids(), ['a/a', 'a/index', 'foo/b', 'foo/sum']);
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('space.req resolve dependencies with mappedId', t => {
  const space = new Space({
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
  space.define('common/a/a', [], () => 2);
  space.define('foo/b', [], 3);

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

  space.req('foo/sum').then(
    value => {
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
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('space.req accesses tesseract global and req', t => {
  const _global = {};
  const req = function (id) {
    if (id === 'a') return Promise.resolve(2);
    return Promise.reject(new Error('cannot find module ' + id));
  };

  const space = new Space({global: _global, req, mappedId: id => id});
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

test('space.req fails tesseract req', t => {
  const space = new Space(tesseract);
  space.define('foo', ['a'], a => a + 3);

  space.req('foo').then(
    value => {
      t.fail('should not get foo!');
    },
    err => {
      t.equal(err.message, 'cannot find module a');
    }
  ).then(t.end);
});

test('space.req fails tesseract req with commonjs wrapper', t => {
  const space = new Space(tesseract);
  space.define('foo', ['require', 'module', 'a'], function (require, module, a) {
    module.exports = a + 3;
  });

  space.req('foo').then(
    value => {
      t.fail('should not get foo!');
    },
    err => {
      t.equal(err.message, 'cannot find module a');
    }
  ).then(t.end);
});

test('space.req supports commonjs wrapper', t => {
  const space = new Space(tesseract);
  // name _require here in order to not confusing browserify
  space.define('foo', ['require', 'exports', 'module', 'a'], function (_require, exports, module) {
    var __filename = module.filename || '', __dirname = __filename.substring(0, __filename.lastIndexOf('/') + 1);
    const a = _require('a');
    exports.foo = a + 3;
    exports.filename = __filename;
    exports.dirname = __dirname;
  });
  space.define('a', ['module'], function (module) {
    module.exports = 2;
  });

  t.notOk(space.has('require'));
  t.notOk(space.has('exports'));
  t.notOk(space.has('module'));
  t.ok(space.registered('foo'));
  t.ok(space.registered('a'));
  t.notOk(space.defined('foo'));
  t.notOk(space.defined('a'));

  t.deepEqual(space.ids(), ['a', 'foo']);

  space.req('foo').then(
    value => {
      t.deepEqual(value, {foo: 5, filename: '/foo.js', dirname: '/'});
      t.notOk(space.has('require'));
      t.notOk(space.has('exports'));
      t.notOk(space.has('module'));
      t.notOk(space.registered('foo'));
      t.notOk(space.registered('a'));
      t.ok(space.defined('foo'));
      t.ok(space.defined('a'));
      t.deepEqual(space.ids(), ['a', 'foo']);
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});


test('space.req fails missing commonjs dep, does not do dynamic load', t => {
  const space = new Space(tesseract);
  // name _require here in order to not confusing browserify
  space.define('foo', ['require', 'exports', 'module'], function (_require, exports, module) {
    const a = _require('a');
    exports.foo = a + 3;
  });
  space.define('a', ['module'], function (module) {
    module.exports = 2;
  });

  t.deepEqual(space.ids(), ['a', 'foo']);

  space.req('foo').then(
    () => {
      t.fail('should not succeed');
    },
    err => {
      t.pass(err.message);
    }
  ).then(t.end);
});

test('space.undef removes module, re-eval all modules deps on it', t => {
  const space = new Space({
    ...tesseract,
    mappedId: id => {
      const parsed = parse(id);
      if (parsed.parts[0] === 'foo') return parsed.prefix + 'common/' + parsed.cleanId;
      return id;
    }
  });
  space.define('bar', ['foo'], f => f + 3);
  space.define('common/foo', ['a'], a => a + 3);
  space.define('a', [], 2);

  t.ok(space.has('bar'));
  t.notOk(space.has('foo'));
  t.ok(space.has('common/foo'));
  t.ok(space.has('a'));

  t.deepEqual(space.ids(), ['a', 'bar', 'common/foo']);

  space.req('bar').then(
    value => {
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

      space.define('a',  [], 5);

      t.deepEqual(space.ids(), ['a', 'bar', 'common/foo']);
      t.ok(space.has('bar'));
      t.notOk(space.has('foo'));
      t.ok(space.has('common/foo'));
      t.ok(space.has('a'));

      return space.req('bar').then(
        value => {
          t.equal(value, 11);
        }
      );
    }
  ).catch(
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('space.purge cleanup everything', t => {
  const space = new Space(tesseract);
  space.define('bar', ['foo'], f => f + 3);
  space.define('foo', ['a'], a => a + 3);
  space.define('a', [], 2);

  t.ok(space.has('bar'));
  t.ok(space.has('foo'));
  t.ok(space.has('a'));

  t.deepEqual(space.ids(), ['a', 'bar', 'foo']);

  space.purge();
  t.notOk(space.has('bar'));
  t.notOk(space.has('foo'));
  t.notOk(space.has('a'));
  t.equal(space.ids().length, 0);
  t.end();
});
