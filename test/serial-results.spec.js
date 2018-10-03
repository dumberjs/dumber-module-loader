import test from 'tape';
import serialResults from '../src/serial-results';

test('serialResults run tasks in sequence', t => {
  t.deepEqual(serialResults(['a', 'b', 'c'], c => '#' + c), ['#a', '#b', '#c']);
  t.end();
});

test('serialResults returns promise ensuring order, in case of promise', t => {
  let result = '';

  serialResults(['a', 'b', 'c'], c => {
    if (c === 'b') {
      return new Promise(resolve => {
        setTimeout(() => resolve('#b'), 20);
      });
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
  let result = '';

  serialResults(['a', 'b', 'c'], c => {
    if (c === 'b') {
      return new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('stop at b')), 20);
      });
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
  let result = '';

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
