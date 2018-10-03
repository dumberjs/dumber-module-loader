/* global define, requirejs */
import test from 'tape';
import '../src/index';
import {mockFetchApi, restoreFetchApi} from './mock-fetch';

test('define exports', t => {
  t.equal(typeof define, 'function');
  t.equal(typeof define.switchToUserSpace, 'function');
  t.equal(typeof define.switchToPackageSpace, 'function');
  t.equal(typeof define.amd, 'object');
  t.equal(typeof define.reset, 'function');
  t.equal(typeof requirejs, 'function');
  t.equal(typeof requirejs.config, 'function');
  t.equal(typeof requirejs.defined, 'function');
  t.equal(typeof requirejs.isBrowser, 'boolean');
  t.equal(typeof requirejs.version, 'string');
  t.equal(typeof requirejs.undef, 'function');
  t.end();
});

test('define amd modules', t => {
  define.reset();
  define.switchToUserSpace();

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

test('require can be required to behave like normal AMD require', t => {
  define.reset();
  define.switchToUserSpace();

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
  define.switchToUserSpace();

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
  define.switchToUserSpace();

  define('foo/bar', ['a', './b'], (a, b) => a + b + 3);
  define('foo/b.js', () => 2);
  define.switchToPackageSpace();
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

test('package space module can not access user space module', t => {
  mockFetchApi();
  define.reset();
  define.switchToUserSpace();

  define('foo/bar', ['a', './b'], (a, b) => a + b + 3);
  define('foo/b', () => 2);
  define.switchToPackageSpace();
  define('a', ['foo/b'], b => b - 1);

  requirejs(['foo/bar'],
    result => {
      t.fail('should not load foo/bar');
      t.end();
    },
    err => {
      t.pass('expected ' + err.message);
      t.end();
    }
  );
});

test('same module id can be defined in user and package spaces', t => {
  define.reset();
  define.switchToUserSpace();

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
  define.switchToUserSpace();

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
    './a-bundle.js': "define('a', 1);"
  });

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

test('gets additional user space module from bundle, stops at bundle error', t => {
  define.reset();
  define.switchToUserSpace();

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
    './a-bundle.js': "define('aa', 1);"
  });

  requirejs(['foo/bar'],
    result => {
      t.fail('should not succeed');
      t.end();
    },
    err => {
      t.pass(err.message);
      t.end();
    }
  );
});

test('gets additional package space module from bundle', t => {
  define.reset();
  define.switchToUserSpace();

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
    './a-bundle.js': "define.switchToPackageSpace(); define('a', 1);",
    './b-bundle.js': "define('foo/bar', ['a', './b'], (a, b) => a + b + 3); define('foo/b.js', () => 2);"
  });

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

test('gets additional package space module from bundle, stops at bundle error', t => {
  define.reset();
  define.switchToUserSpace();

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
    './a-bundle.js': "define.switchToPackageSpace(); define('aa', 1);",
    './b-bundle.js': "define('foo/bar', ['a', './b'], (a, b) => a + b + 3); define('foo/b.js', () => 2);"
  });

  requirejs(['foo/bar'],
    result => {
      t.fail('should not succeed');
      t.end();
    },
    err => {
      t.pass(err.message);
      t.end();
    }
  );
});

test('gets additional package space module from bundle, requested from package space', t => {
  define.reset();
  define.switchToUserSpace();

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
    './a-bundle.js': "define.switchToPackageSpace(); define('a', 1);",
    './b-bundle.js': "define('foo/bar', ['c'], c => c + 3);",
    './c-bundle.js': "define.switchToPackageSpace(); define('c.js', ['a'], a => a + 2);"
  });

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

test('gets additional package space module from bundle, requested from package space, stops at bundle error', t => {
  define.reset();
  define.switchToUserSpace();

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
    './a-bundle.js': "define.switchToPackageSpace(); define('aa', 1);",
    './b-bundle.js': "define('foo/bar', ['c'], c => c + 3);",
    './c-bundle.js': "define.switchToPackageSpace(); define('c.js', ['a'], a => a + 2);"
  });

  requirejs(['foo/bar'],
    result => {
      t.fail('should not succeed');
      t.end();
    },
    err => {
      t.pass(err.message);
      t.end();
    }
  );
});

test('gets runtime js user space module, with paths', t => {
  define.reset();
  define.switchToUserSpace();

  requirejs.config({
    baseUrl: 'dist//runtime',
    paths: {
      'b-bundle': 'bundles/b.js',
      'foo': 'common/foo',
      'foo/b': 'other/b',
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
    'dist/runtime/other/b.js': "define([], () => 2);",
    'dist/runtime/a-bundle.js': "define.switchToPackageSpace(); define('a', 1);",
    'dist/runtime/bundles/b.js': "define('common/foo/bar', ['a', 'foo/b'], (a, b) => a + b + 3);"
  });

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

test('gets runtime text! user space module', t => {
  define.reset();
  define.switchToUserSpace();

  mockFetchApi({
    './foo.html': 'lorem'
  });

  requirejs(['text!foo.html'],
    result => {
      t.equal(result, 'lorem');
      t.end();
    },
    err => {
      t.fail(err.message);
      t.end();
    }
  );
});


test('gets runtime json! user space module', t => {
  define.reset();
  define.switchToUserSpace();

  mockFetchApi({
    './foo.json': '{"a": 1}'
  });

  requirejs(['json!foo.json'],
    result => {
      t.deepEqual(result, {a: 1});
      t.ok(requirejs.defined('json!foo.json'));

      requirejs(['foo.json'],
        r2 => {
          t.deepEqual(result, {a: 1}, 'supports usage without prefix');
          t.ok(requirejs.defined('foo.json'));
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


// TODO test wasm


test('gets runtime json file user space module', t => {
  define.reset();
  define.switchToUserSpace();

  mockFetchApi({
    './foo.json': '{"a": 1}'
  });

  requirejs(['foo.json'],
    result => {
      t.deepEqual(result, {a: 1});
      t.ok(requirejs.defined('foo.json'));

      requirejs(['json!foo.json'],
        r2 => {
          t.deepEqual(result, {a: 1}, 'supports usage with prefix');
          t.ok(requirejs.defined('json!foo.json'));
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

test('gets runtime html file user space module', t => {
  define.reset();
  define.switchToUserSpace();

  mockFetchApi({
    './foo.html': 'lorem'
  });

  requirejs(['foo.html'],
    result => {
      t.equal(result, 'lorem');
      t.ok(requirejs.defined('foo.html'));

      requirejs(['text!foo.html'],
        r2 => {
          t.equal(result, 'lorem', 'supports usage with prefix');
          t.ok(requirejs.defined('text!foo.html'));
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

test('gets runtime svg file user space module', t => {
  define.reset();
  define.switchToUserSpace();

  mockFetchApi({
    './foo.svg': 'lorem'
  });

  requirejs(['foo.svg'],
    result => {
      t.equal(result, 'lorem');
      t.ok(requirejs.defined('foo.svg'));

      requirejs(['text!foo.svg'],
        r2 => {
          t.equal(result, 'lorem', 'supports usage with prefix');
          t.ok(requirejs.defined('text!foo.svg'));
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

test('gets runtime css file user space module', t => {
  define.reset();
  define.switchToUserSpace();

  mockFetchApi({
    './foo.css': 'lorem'
  });

  requirejs(['foo.css'],
    result => {
      t.equal(result, 'lorem');
      t.ok(requirejs.defined('foo.css'));

      requirejs(['text!foo.css'],
        r2 => {
          t.equal(result, 'lorem', 'supports usage with prefix');
          t.ok(requirejs.defined('text!foo.css'));
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

test('supports custom translators', t => {
  define.reset();
  define.switchToUserSpace();

  requirejs.config({
    translators: [
      (parsedId, response) => {
        if (parsedId.prefix || !parsedId.bareId.endsWith('.txt')) return;

        return response.text()
        .then(text => {
          define(parsedId.cleanId, 'txt:' + text);
          define('txt!' + parsedId.cleanId, 'txt:' + text);
        });
      }
    ]
  });

  mockFetchApi({
    './foo.txt': 'lorem'
  });

  requirejs(['foo.txt'],
    result => {
      t.equal(result, 'txt:lorem');
      t.ok(requirejs.defined('foo.txt'));

      requirejs(['txt!foo.txt'],
        r2 => {
          t.equal(result, 'txt:lorem', 'supports usage with prefix');
          t.ok(requirejs.defined('txt!foo.txt'));
          t.end();
        },
        err => {
          t.fail(err.message);
          t.end();
        }
      );
    },
    err => {
      t.fail(err.stack);
      t.end();
    }
  );
});

test('requirejs.undef remove a user space module, demote all module depends on it', t => {
  define.reset();
  define.switchToUserSpace();

  define('foo', ['a'], a => a + 1);
  define('a', 1);

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
          t.end();
        },
        err => {
          t.fail(err.stack);
          t.end();
        }
      );
    },
    err => {
      t.fail(err.stack);
      t.end();
    }
  );
});

test('requirejs.toUrl returns url in requirejs fashion', t => {
  t.equal(requirejs.toUrl('a'), './a');
  t.equal(requirejs.toUrl('a.js'), './a.js');
  t.equal(requirejs.toUrl('text!foo/bar.html'), './foo/bar.html');
  t.equal(requirejs.toUrl('foo/bar.min'), './foo/bar.min');
  t.end();
});
