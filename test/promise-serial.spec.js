import test from 'tape';
import promiseSerial from '../src/promise-serial';

test('promiseSerial run tasks in sequence', t => {
  let result = '';

  promiseSerial(['a', 'b', 'c'], c => '#' + c)
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

test('promiseSerial ensures order', t => {
  let result = '';

  promiseSerial(['a', 'b', 'c'], c => {
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

test('promiseSerial stops at first failure', t => {
  let result = '';

  promiseSerial(['a', 'b', 'c'], c => {
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

test('promiseSerial works on empty array', t => {
  let result = '';

  promiseSerial([], c => '#' + c)
  .then(
    results => {
      t.equal(results.length, 0);
    },
    err => {
      t.pass(err.message);
    }
  )
  .then(t.end);
});
