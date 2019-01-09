/* global define, requirejs */
import test from 'tape';
import '../src/index';
import {mockFetchApi, restoreFetchApi} from './mock-fetch';

test('define exports', t => {
  t.equal(typeof define, 'function');
  t.equal(typeof define.switchToUserSpace, 'function');
  t.equal(typeof define.switchToPackageSpace, 'function');
  t.equal(typeof define.currentSpace, 'function');
  t.equal(typeof define.amd, 'object');
  t.equal(typeof define.reset, 'function');
  t.equal(typeof requirejs, 'function');
  t.equal(typeof requirejs.config, 'function');
  t.equal(typeof requirejs.defined, 'function');
  t.equal(typeof requirejs.specified, 'function');
  t.equal(typeof requirejs.isBrowser, 'boolean');
  t.equal(typeof requirejs.version, 'string');
  t.equal(typeof requirejs.resolveModuleId, 'function');
  t.equal(typeof requirejs.undef, 'function');
  t.end();
});

test('define amd modules', t => {
  define.reset();

  define('foo/bar', ['a', './b'], (a, b) => a + b + 3);
  define('a', 1);
  define('foo/b.js', () => 2);

  requirejs(['foo/bar'],
    result => {
      t.equal(result, 6);
      t.end();
    },
    err => {
      t.fail(err.message);
      t.end();
    }
  );
});

test('requirejs can return promise', t => {
  define.reset();

  define('foo/bar', ['a', './b'], (a, b) => a + b + 3);
  define('a', 1);
  define('foo/b.js', () => 2);

  requirejs(['foo/bar'])
  .then(
    result => {
      t.equal(result[0], 6);
      t.end();
    },
    err => {
      t.fail(err.message);
      t.end();
    }
  );
});

test('require can be required to behave like normal AMD require', t => {
  define.reset();

  define('foo/bar', ['a'], a => a + 3);
  define('a', 1);
  define('foo/b.js', () => 2);

  requirejs(['require', 'foo/bar'],
    (r, result) => {
      t.equal(result, 4);

      r(['foo/b'],
        r2 => {
          t.equal(r2, 2);
          t.end();
        },
        err => {
          t.fail(err.message);
          t.end();
        }
      );
    },
    err => {
      t.fail(err.message);
      t.end();
    }
  );
});

test('require can be required to behave like normal commonjs require', t => {
  define.reset();

  define('foo/bar', ['a'], a => a + 3);
  define('a', 1);

  requirejs(['require', 'foo/bar'],
    req => {
      t.equal(req('foo/bar'), 4);
      t.end();
    },
    err => {
      t.fail(err.message);
      t.end();
    }
  );
});

test('user space module can access package space module', t => {
  define.reset();

  t.equal(define.currentSpace(), 'user');
  define('foo/bar', ['a', './b'], (a, b) => a + b + 3);
  define('foo/b.js', () => 2);
  t.equal(define.currentSpace(), 'user');
  define.switchToPackageSpace();
  t.equal(define.currentSpace(), 'package');
  define('a', 1);

  requirejs(['foo/bar'],
    result => {
      t.equal(result, 6);
      t.end();
    },
    err => {
      t.fail(err.message);
      t.end();
    }
  );
});

test('user space module can access package space module through cjs require', t => {
  define.reset();

  define('foo', ['require', 'bar'], req => req('bar')('HELLO'));
  define.switchToPackageSpace();
  define('bar', () => (s => s.toLowerCase()));

  requirejs(['foo'],
    result => {
      t.equal(result, 'hello');
      t.end();
    },
    err => {
      t.fail(err.message);
      t.end();
    }
  );
});

test('package space module can not access user space module', t => {
  mockFetchApi();
  define.reset();

  define('foo/bar', ['a', './b'], (a, b) => a + b + 3);
  define('foo/b', () => 2);
  define.switchToPackageSpace();
  define('a', ['foo/b'], b => b - 1);

  t.throws(() => requirejs(['foo/bar']));
  restoreFetchApi();
  t.end();
});

test('same module id can be defined in user and package spaces', t => {
  define.reset();

  define('foo', ['a', 'b-package'], (a, b) => a + b);
  define('a', () => 'a');

  define.switchToPackageSpace();
  define('b-package', ['a'], a => 'b' + a);
  define('a', 'A');

  requirejs(['foo'],
    result => {
      t.equal(result, 'abA');
      t.end();
    },
    err => {
      t.fail(err.message);
      t.end();
    }
  );
});

test('gets additional user space module from bundle', t => {
  define.reset();

  define('foo/bar', ['a', './b'], (a, b) => a + b + 3);
  define('foo/b.js', () => 2);

  requirejs.config({
    bundles: {
      'a-bundle': {
        user: ['a']
      }
    }
  });

  mockFetchApi({
    'a-bundle.js': "define('a', 1);"
  });

  requirejs(['foo/bar'],
    result => {
      t.equal(result, 6);
      restoreFetchApi();
      t.end();
    },
    err => {
      t.fail(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('gets additional user space module from bundle, requirejs returns promise', t => {
  define.reset();

  define('foo/bar', ['a', './b'], (a, b) => a + b + 3);
  define('foo/b.js', () => 2);

  requirejs.config({
    bundles: {
      'a-bundle': {
        user: ['a']
      }
    }
  });

  mockFetchApi({
    'a-bundle.js': "define('a', 1);"
  });

  requirejs(['foo/bar'])
  .then(
    result => {
      t.equal(result[0], 6);
      restoreFetchApi();
      t.end();
    },
    err => {
      t.fail(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('gets additional user space module from bundle, stops at bundle error', t => {
  define.reset();

  define('foo/bar', ['a', './b'], (a, b) => a + b + 3);
  define('foo/b.js', () => 2);

  requirejs.config({
    bundles: {
      'a-bundle': {
        user: ['a']
      }
    }
  });

  mockFetchApi({
    'a-bundle.js': "define('aa', 1);"
  });

  requirejs(['foo/bar'],
    () => {
      t.fail('should not succeed');
      restoreFetchApi();
      t.end();
    },
    err => {
      t.pass(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('gets additional package space module from bundle, supports simplified bundle config if there are only user space modules', t => {
  define.reset();

  requirejs.config({
    bundles: {
      'a-bundle': {
        package: ['a']
      },
      'b-bundle': ['foo/b.js', 'foo/bar']
    }
  });

  mockFetchApi({
    'a-bundle.js': "define.switchToPackageSpace(); define('a', 1);",
    'b-bundle.js': "define('foo/bar', ['a', './b'], (a, b) => a + b + 3); define('foo/b.js', () => 2);"
  });

  requirejs(['foo/bar'],
    result => {
      t.equal(result, 6);
      restoreFetchApi();
      t.end();
    },
    err => {
      t.fail(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('gets additional package space module from bundle, stops at bundle error', t => {
  define.reset();

  requirejs.config({
    bundles: {
      'a-bundle': {
        package: ['a']
      },
      'b-bundle': {
        user: ['foo/b.js', 'foo/bar']
      }
    }
  });

  mockFetchApi({
    'a-bundle.js': "define.switchToPackageSpace(); define('aa', 1);",
    'b-bundle.js': "define('foo/bar', ['a', './b'], (a, b) => a + b + 3); define('foo/b.js', () => 2);"
  });

  requirejs(['foo/bar'],
    () => {
      t.fail('should not succeed');
      restoreFetchApi();
      t.end();
    },
    err => {
      t.pass(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('gets additional package space module from bundle, requested from package space', t => {
  define.reset();

  requirejs.config({
    bundles: {
      'a-bundle': {
        package: ['a']
      },
      'b-bundle': {
        user: ['foo/bar']
      },
      'c-bundle': {
        package: ['c']
      },
    }
  });

  mockFetchApi({
    'a-bundle.js': "define.switchToPackageSpace(); define('a', 1);",
    'b-bundle.js': "define('foo/bar', ['c'], c => c + 3);",
    'c-bundle.js': "define.switchToPackageSpace(); define('c.js', ['a'], a => a + 2);"
  });

  requirejs(['foo/bar'],
    result => {
      t.equal(result, 6);
      restoreFetchApi();
      t.end();
    },
    err => {
      t.fail(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('gets additional package space module from bundle, requested from package space, stops at bundle error', t => {
  define.reset();

  requirejs.config({
    bundles: {
      'a-bundle': {
        package: ['a']
      },
      'b-bundle': {
        user: ['foo/bar']
      },
      'c-bundle': {
        package: ['c']
      },
    }
  });

  mockFetchApi({
    'a-bundle.js': "define.switchToPackageSpace(); define('aa', 1);",
    'b-bundle.js': "define('foo/bar', ['c'], c => c + 3);",
    'c-bundle.js': "define.switchToPackageSpace(); define('c.js', ['a'], a => a + 2);"
  });

  requirejs(['foo/bar'],
    () => {
      t.fail('should not succeed');
      restoreFetchApi();
      t.end();
    },
    err => {
      t.pass(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('gets runtime js user space module, with paths', t => {
  define.reset();

  requirejs.config({
    baseUrl: 'dist//runtime',
    paths: {
      'b-bundle': 'bundles/b.js',
      'foo': 'common/foo',
      'foo/b': '/other/b'
    },
    bundles: {
      'a-bundle': {
        package: ['a']
      },
      'b-bundle': {
        user: ['common/foo/bar']
      }
    }
  });

  mockFetchApi({
    '/other/b.js': "define([], () => 2);",
    'dist/runtime/a-bundle.js': "define.switchToPackageSpace(); define('a', 1);",
    'dist/runtime/bundles/b.js': "define('common/foo/bar', ['a', 'foo/b'], (a, b) => a + b + 3);"
  });

  requirejs(['foo/bar'],
    result => {
      t.equal(result, 6);
      restoreFetchApi();
      t.end();
    },
    err => {
      t.fail(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('gets runtime text! user space module', t => {
  define.reset();

  mockFetchApi({
    'foo.html': 'lorem'
  });

  requirejs(['text!foo.html'],
    result => {
      t.equal(result, 'lorem');
      restoreFetchApi();
      t.end();
    },
    err => {
      t.fail(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('gets user space json module', t => {
  define.reset();

  define('text!foo.json', '{"a":1}');
  t.notOk(requirejs.specified('json!foo.json'));
  t.ok(requirejs.specified('text!foo.json'));
  t.notOk(requirejs.specified('foo.json'));
  t.notOk(requirejs.defined('json!foo.json'));
  t.notOk(requirejs.defined('text!foo.json'));
  t.notOk(requirejs.defined('foo.json'));

  requirejs(['json!foo.json'],
    result => {
      t.deepEqual(result, {a: 1});
      t.ok(requirejs.specified('json!foo.json'));
      t.ok(requirejs.specified('text!foo.json'));
      t.ok(requirejs.specified('foo.json'));
      t.ok(requirejs.defined('json!foo.json'));
      t.ok(requirejs.defined('text!foo.json'));
      t.ok(requirejs.defined('foo.json'));

      requirejs(['foo.json'],
        r2 => {
          t.deepEqual(r2, {a: 1}, 'supports usage without prefix');

          restoreFetchApi();
          t.end();
        },
        err => {
          t.fail(err.message);
          restoreFetchApi();
          t.end();
        }
      );
    },
    err => {
      t.fail(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('gets package space json module', t => {
  define.reset();

  define.switchToPackageSpace();
  define('text!foo.json', '{"a":1}');

  requirejs(['json!foo.json'],
    result => {
      t.deepEqual(result, {a: 1});
      t.ok(requirejs.defined('json!foo.json'));

      requirejs(['foo.json'],
        r2 => {
          t.deepEqual(r2, {a: 1}, 'supports usage without prefix');
          t.ok(requirejs.defined('foo.json'));
          restoreFetchApi();
          t.end();
        },
        err => {
          t.fail(err.message);
          restoreFetchApi();
          t.end();
        }
      );
    },
    err => {
      t.fail(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('gets runtime json! user space module', t => {
  define.reset();

  mockFetchApi({
    'foo.json': '{"a": 1}'
  });

  requirejs(['json!foo.json'],
    result => {
      t.deepEqual(result, {a: 1});
      t.ok(requirejs.defined('json!foo.json'));

      requirejs(['foo.json'],
        r2 => {
          t.deepEqual(r2, {a: 1}, 'supports usage without prefix');
          t.ok(requirejs.defined('foo.json'));
          restoreFetchApi();
          t.end();
        },
        err => {
          t.fail(err.message);
          restoreFetchApi();
          t.end();
        }
      );
    },
    err => {
      t.fail(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('gets runtime json file user space module', t => {
  define.reset();

  mockFetchApi({
    'foo.json': '{"a": 1}'
  });

  requirejs(['foo.json'],
    result => {
      t.deepEqual(result, {a: 1});
      t.ok(requirejs.defined('foo.json'));

      requirejs(['json!foo.json'],
        r2 => {
          t.deepEqual(r2, {a: 1}, 'supports usage with prefix');
          t.ok(requirejs.defined('json!foo.json'));
          restoreFetchApi();
          t.end();
        },
        err => {
          t.fail(err.message);
          restoreFetchApi();
          t.end();
        }
      );
    },
    err => {
      t.fail(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('gets runtime html file user space module', t => {
  define.reset();

  mockFetchApi({
    'foo.html': 'lorem'
  });

  requirejs(['foo.html'],
    result => {
      t.equal(result, 'lorem');
      t.ok(requirejs.defined('foo.html'));

      requirejs(['text!foo.html'],
        r2 => {
          t.equal(r2, 'lorem', 'supports usage with prefix');
          t.ok(requirejs.defined('text!foo.html'));
          restoreFetchApi();
          t.end();
        },
        err => {
          t.fail(err.message);
          restoreFetchApi();
          t.end();
        }
      );
    },
    err => {
      t.fail(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('gets runtime svg file user space module', t => {
  define.reset();

  mockFetchApi({
    'foo.svg': 'lorem'
  });

  requirejs(['foo.svg'],
    result => {
      t.equal(result, 'lorem');
      t.ok(requirejs.defined('foo.svg'));

      requirejs(['text!foo.svg'],
        r2 => {
          t.equal(r2, 'lorem', 'supports usage with prefix');
          t.ok(requirejs.defined('text!foo.svg'));
          restoreFetchApi();
          t.end();
        },
        err => {
          t.fail(err.message);
          restoreFetchApi();
          t.end();
        }
      );
    },
    err => {
      t.fail(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('gets runtime css file user space module', t => {
  define.reset();

  mockFetchApi({
    'foo.css': 'lorem'
  });

  requirejs(['foo.css'],
    result => {
      t.equal(result, 'lorem');
      t.ok(requirejs.defined('foo.css'));

      requirejs(['text!foo.css'],
        r2 => {
          t.equal(r2, 'lorem', 'supports usage with prefix');
          t.ok(requirejs.defined('text!foo.css'));
          restoreFetchApi();
          t.end();
        },
        err => {
          t.fail(err.message);
          restoreFetchApi();
          t.end();
        }
      );
    },
    err => {
      t.fail(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('requirejs.undef remove a user space module, demote all module depends on it', t => {
  define.reset();

  define('foo', ['a'], a => a + 1);
  define('a', 1);

  t.ok(requirejs.specified('foo'));
  t.ok(requirejs.specified('a'));
  t.notOk(requirejs.defined('foo'));
  t.notOk(requirejs.defined('a'));

  requirejs(['foo'],
    result => {
      t.equal(result, 2);
      t.ok(requirejs.defined('foo'));
      t.ok(requirejs.defined('a'));

      requirejs.undef('a');

      t.notOk(requirejs.defined('foo'));
      t.notOk(requirejs.defined('a'));

      define('a', () => '1');

      requirejs(['foo'],
        r2 => {
          t.equal(r2, '11');
          t.ok(requirejs.defined('foo'));
          t.ok(requirejs.defined('a'));
          restoreFetchApi();
          t.end();
        },
        err => {
          t.fail(err.stack);
          restoreFetchApi();
          t.end();
        }
      );
    },
    err => {
      t.fail(err.stack);
          restoreFetchApi();
      t.end();
    }
  );
});

test('requirejs.toUrl returns url in requirejs fashion', t => {
  define.reset();
  t.equal(requirejs.toUrl('a'), 'a.js');
  t.equal(requirejs.toUrl('a.js'), 'a.js');
  t.equal(requirejs.toUrl('text!foo/bar.html'), 'foo/bar.html');
  t.equal(requirejs.toUrl('foo/bar.min'), 'foo/bar.min.js');

  requirejs.config({baseUrl: '/hello/world', paths: {foo: 'common/foo', '../src': ''}});
  t.equal(requirejs.toUrl('a'), '/hello/world/a.js');
  t.equal(requirejs.toUrl('a.js'), '/hello/world/a.js');
  t.equal(requirejs.toUrl('text!foo/bar.html'), '/hello/world/common/foo/bar.html');
  t.equal(requirejs.toUrl('foo/bar.min'), '/hello/world/common/foo/bar.min.js');
  t.equal(requirejs.toUrl('../src/a'), '/hello/world/a.js');
  t.equal(requirejs.toUrl('text!../src/foo/bar.html'), '/hello/world/foo/bar.html');
  t.end();
});

test('requirejs.definedValues returns all defined values', t => {
  define.reset();

  define('foo', ['a'], a => a + 1);
  define('a', 2);
  define('b', 0);

  t.deepEqual(requirejs.definedValues(), {});
  requirejs(['foo']);
  t.deepEqual(requirejs.definedValues(), {a: 2, foo: 3});
  t.end();
});

test('requirejs uses plugin module to load', t => {
  define.reset();

  define('foo', 5);
  define('plus-one', {
    load: (name, req, load) => {
      req([name], v => load(v + 1));
    }
  });

  requirejs(['plus-one!foo'],
    r => {
      t.equal(r, 6);
      t.ok(requirejs.defined('foo'));
      t.ok(requirejs.defined('plus-one!foo'));
      t.end();
    },
    err => {
      t.fail(err.stack);
      t.end();
    }
  );
});

test('requirejs uses ext:plugin module to load', t => {
  define.reset();

  const injected = [];
  function injectCss(v) {
    injected.push(v);
  }

  define('text!foo.css', 'lorem');
  requirejs.undef('ext:css'); // unset default css plugin
  define('ext:css', {
    load: (name, req, load) => {
      req(['text!' + name], v => {
        injectCss(v);
        load(v);
      });
    }
  });

  requirejs(['foo.css'],
    () => {
      t.deepEqual(injected, ['lorem']);
      t.ok(requirejs.defined('foo.css'));
      t.ok(requirejs.defined('text!foo.css'));
      t.end();
    },
    err => {
      t.fail(err.stack);
      t.end();
    }
  );
});

test('requirejs uses plugin module to load when plugin is in package space', t => {
  define.reset();

  define('foo', 5);
  define.switchToPackageSpace();
  define('plus-one', {
    load: (name, req, load) => {
      req([name], v => load(v + 1));
    }
  });

  requirejs(['plus-one!foo'],
    r => {
      t.equal(r, 6);
      t.ok(requirejs.defined('foo'));
      t.ok(requirejs.defined('plus-one!foo'));
      t.end();
    },
    err => {
      t.fail(err.stack);
      t.end();
    }
  );
});

test('requirejs uses ext:plugin module to load when plugin is in package space', t => {
  define.reset();

  const injected = [];
  function injectCss(v) {
    injected.push(v);
  }

  define('text!foo.css', 'lorem');
  requirejs.undef('ext:css'); // unset default css plugin
  define.switchToPackageSpace();
  define('ext:css', {
    load: (name, req, load) => {
      req(['text!' + name], v => {
        injectCss(v);
        load(v);
      });
    }
  });

  requirejs(['foo.css'],
    () => {
      t.deepEqual(injected, ['lorem']);
      t.ok(requirejs.defined('foo.css'));
      t.ok(requirejs.defined('text!foo.css'));
      t.end();
    },
    err => {
      t.fail(err.stack);
      t.end();
    }
  );
});

test('requirejs uses plugin module to load runtime', t => {
  define.reset();

  mockFetchApi({
    'foo.html': 'lorem'
  });

  define('wrap/html', {
    load: (name, req, load) => {
      req([name], v => load(`<div>${v}</div>`));
    }
  });

  requirejs(['wrap/html!foo.html'],
    result => {
      t.equal(result, '<div>lorem</div>');
      t.ok(requirejs.defined('foo.html'));
      t.ok(requirejs.defined('text!foo.html'));
      t.ok(requirejs.defined('wrap/html!foo.html'));
      restoreFetchApi();
      t.end();
    },
    err => {
      t.fail(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('requirejs uses plugin module to load runtime case2', t => {
  define.reset();

  mockFetchApi({
    'foo.html': 'lorem'
  });

  define('wrap/html', {
    load: (name, req, load) => {
      req(['text!' + name], v => load(`<div>${v}</div>`));
    }
  });

  requirejs(['wrap/html!foo.html'],
    result => {
      t.equal(result, '<div>lorem</div>');
      t.notOk(requirejs.defined('foo.html'));
      t.ok(requirejs.defined('text!foo.html'));
      t.ok(requirejs.defined('wrap/html!foo.html'));
      restoreFetchApi();
      t.end();
    },
    err => {
      t.fail(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('requirejs uses ext:plugin module to load runtime', t => {
  define.reset();

  mockFetchApi({
    'foo.css': 'lorem'
  });

  const injected = [];
  function injectCss(v) {
    injected.push(v);
  }

  requirejs.undef('ext:css'); // unset default css plugin
  define('ext:css', {
    load: (name, req, load) => {
      req(['text!' + name], v => {
        injectCss(v);
        load(v);
      });
    }
  });

  requirejs(['foo.css'],
    () => {
      t.deepEqual(injected, ['lorem']);
      t.ok(requirejs.defined('foo.css'));
      t.ok(requirejs.defined('text!foo.css'));
      restoreFetchApi();
      t.end();
    },
    err => {
      t.fail(err.stack);
      restoreFetchApi();
      t.end();
    }
  );
});

test('requirejs uses ext:plugin module to fail at runtime', t => {
  define.reset();
  mockFetchApi();

  const injected = [];
  function injectCss(v) {
    injected.push(v);
  }

  requirejs.undef('ext:css'); // unset default css plugin
  define('ext:css', {
    load: (name, req, load) => {
      req(['text!' + name], v => {
        injectCss(v);
        load(v);
      });
    }
  });

  requirejs(['foo.css'],
    () => {
      t.fail('should not pass');
      restoreFetchApi();
      t.end();
    },
    err => {
      t.pass(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('requirejs supports regexp glob', t => {
  const touched = [];
  define.reset();

  define('foo.spec', [], () => touched.push('foo.spec'));
  define('foo-bar', [], () => touched.push('foo-bar'));
  define('xyz.spec', [], () => touched.push('xyz.spec'));
  define.switchToPackageSpace();
  define('bar.spec', [], () => touched.push('bar.spec'));
  define('loo', [], () => touched.push('loo'));

  requirejs([/\.spec$/],
    () => {
      t.deepEqual(touched.sort(), [
        'bar.spec', 'foo.spec', 'xyz.spec'
      ]);
      t.end();
    },
    err => {
      t.fail(err.message);
      t.end();
    }
  );
});

test('requirejs supports cjs module returning undefined', t => {
  define.reset();

  define('foo', ['require', 'bar-core', 'bar'], req => '' + req('bar'));
  define.switchToPackageSpace();
  define('bar-core', [], () => 1);
  define('bar', ['bar-core'], () => undefined);

  requirejs(['foo'],
    result => {
      t.equal(result, 'undefined');
      t.end();
    },
    err => {
      t.fail(err.message);
      t.end();
    }
  );
});

test("requirejs supports dumber's wrap on es dynamic import()", t => {
  define.reset();

  define('foo', ['require', 'exports', 'module'], function (req, exps, mod) {var impor_ = function(d){return requirejs([requirejs.resolveModuleId(mod.id,d)]).then(function(r){return r[0]&&r[0].default?r[0].default:r;});};
    "use strict";
    exps.__esModule = true;
    exps.default = void 0;
    var _default = impor_('./a');
    exps.default = _default;
  });

  // simulate es module
  define('a',[], () => ({default:2}));

  requirejs(['foo'],
    result => {
      t.ok(result.default.then);

      result.default.then(
        v => {
          t.equal(v, 2);
          t.end();
        },
        err => {
          t.fail(err.message);
          t.end();
        }
      );
    },
    err => {
      t.fail(err.message);
      t.end();
    }
  );
});

test('does not create duplicated request to load additional bundle', t => {
  define.reset();

  requirejs.config({
    bundles: {
      'a-bundle': {
        user: ['a', 'b']
      }
    }
  });

  define._debug_count = 0;

  mockFetchApi({
    'a-bundle.js': "define('a', 1);define('b', 2);define._debug_count+=1;"
  });

  Promise.all([requirejs(['a']), requirejs(['b'])])
  .then(
    results => {
      t.deepEqual(results, [[1], [2]]);
      t.equal(define._debug_count, 1);
      delete define._debug_count;
      restoreFetchApi();
      t.end();
    },
    err => {
      t.fail(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('gets additional user space non-js module from bundle', t => {
  define.reset();

  define('foo', ['./a.html'], a => '<div>' + a + '</div>');

  requirejs.config({
    bundles: {
      'a-bundle': {
        user: ['a.html', 'text!a.html']
      }
    }
  });

  mockFetchApi({
    'a-bundle.js': "define('text!a.html', '<p>1</p>');"
  });

  requirejs(['foo'],
    result => {
      t.equal(result, '<div><p>1</p></div>');
      restoreFetchApi();
      t.end();
    },
    err => {
      t.fail(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('gets additional package space non-js module from bundle', t => {
  define.reset();

  define('foo', ['bar/a.html'], a => '<div>' + a + '</div>');

  requirejs.config({
    bundles: {
      'a-bundle': {
        package: ['bar/a.html', 'text!bar/a.html']
      }
    }
  });

  mockFetchApi({
    'a-bundle.js': "define('text!bar/a.html', '<p>1</p>');"
  });

  requirejs(['foo'],
    result => {
      t.equal(result, '<div><p>1</p></div>');
      restoreFetchApi();
      t.end();
    },
    err => {
      t.fail(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('gets name spaced modules from bundle', t => {
  define.reset();

  requirejs.config({
    paths: {
      'a-bundle': '/path/to/a-bundle.js'
    },
    bundles: {
      'a-bundle': {
        nameSpace: 'ns',
        user: ['a'],
        package: ['b']
      }
    }
  });

  mockFetchApi({
    '/path/to/a-bundle.js': `
      define.switchToUserSpace();
      define('a', ['b', 'lorem!./c'], (b, c) => b + c);
      define('lorem!c', [], () => 1);
      define.switchToPackageSpace();
      define('b', [], () => 2);
      define.switchToUserSpace();`
  });

  requirejs(['ns/a'],
    result => {
      t.equal(result, 3);
      t.deepEqual(Object.keys(requirejs.definedValues()).sort(), [
        'b', 'lorem!ns/c', 'ns/a'
      ]);
      restoreFetchApi();
      t.end();
    },
    err => {
      t.fail(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});

test('gets name spaced modules from bundle when bundle name and name space name are same', t => {
  define.reset();

  requirejs.config({
    paths: {
      'ns': '/path/to/ns.js'
    },
    bundles: {
      'ns': {
        nameSpace: 'ns',
        user: ['a'],
        package: ['b']
      }
    }
  });

  mockFetchApi({
    '/path/to/ns.js': `
      define.switchToUserSpace();
      define('a', ['b', 'lorem!./c'], (b, c) => b + c);
      define('lorem!c', [], () => 1);
      define.switchToPackageSpace();
      define('b', [], () => 2);
      define.switchToUserSpace();`
  });

  requirejs(['ns/a'],
    result => {
      t.equal(result, 3);
      t.deepEqual(Object.keys(requirejs.definedValues()).sort(), [
        'b', 'lorem!ns/c', 'ns/a'
      ]);
      restoreFetchApi();
      t.end();
    },
    err => {
      t.fail(err.message);
      restoreFetchApi();
      t.end();
    }
  );
});