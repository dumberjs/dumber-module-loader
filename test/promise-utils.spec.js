import test from 'tape';
import {markPromise, isMarkedPromise, serialResults} from '../src/promise-utils';

test('markPromise ignores non promise', t => {
  t.equal(markPromise(), undefined);
  t.notOk(isMarkedPromise(markPromise()));
  t.equal(markPromise('1'), '1');
  t.notOk(isMarkedPromise(markPromise('1')));
  t.equal(markPromise(1), 1);
  t.notOk(isMarkedPromise(markPromise(1)));
  t.equal(markPromise(false), false);
  t.notOk(isMarkedPromise(markPromise(false)));
  t.deepEqual(markPromise([]), []);
  t.notOk(isMarkedPromise(markPromise([])));
  t.deepEqual(markPromise({then:2}), {then:2});
  t.notOk(isMarkedPromise(markPromise({then:2})));
  t.end();
});

test('markPromise marks promise', t => {
  const marked = markPromise(Promise.resolve(1));
  t.ok(isMarkedPromise(marked));
  const marked2 = markPromise(Promise.reject(new Error('marked-reject')));
  t.ok(isMarkedPromise(marked2));

  Promise.all([
    marked.then(
      v1 => {
        t.equal(v1, 1);
      },
      err => {
        t.fail(err.message);
      }
    ),
    marked2.then(
      () => {
        t.fail('should not pass');
      },
      err => {
        t.equal(err.message, 'marked-reject');
      }
    )
  ]).then(() => {
    t.end();
  });
});

test('serialResults run tasks in sequence', t => {
  t.deepEqual(serialResults(['a', 'b', 'c'], c => '#' + c), ['#a', '#b', '#c']);
  t.end();
});

test('serialResults returns promise ensuring order, in case of promise', t => {
  serialResults(['a', 'b', 'c'], c => {
    if (c === 'b') {
      return markPromise(new Promise(resolve => {
        setTimeout(() => resolve('#b'), 20);
      }));
    } else {
      return '#' + c;
    }
  })
  .then(
    results => {
      t.deepEqual(results, ['#a', '#b', '#c']);
    },
    err => {
      t.fail(err.message);
    }
  )
  .then(t.end);
});

test('serialResults stops at first failure, in case of promise', t => {
  serialResults(['a', 'b', 'c'], c => {
    if (c === 'b') {
      return markPromise(new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('stop at b')), 20);
      }));
    } else if (c === 'c') {
      t.fail('should not run c');
    } else if (c === 'a') {
      t.pass('should run a');
      return '#a';
    }
  })
  .then(
    () => {
      t.fail('should not succeed');
    },
    err => {
      t.pass(err.message);
    }
  )
  .then(t.end);
});

test('serialResults stops at first failure, when no promise', t => {
  t.throws(() => serialResults(['a', 'b', 'c'], c => {
    if (c === 'b') {
      throw new Error('stop at b');
    } else if (c === 'c') {
      t.fail('should not run c');
    } else if (c === 'a') {
      t.pass('should run a');
      return '#a';
    }
  }));
  t.end();
});

test('serialResults works on empty array', t => {
  t.deepEqual(serialResults([], c => '#' + c), []);
  t.end();
});
