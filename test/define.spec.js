import test from 'tape';
import define from '../src/index';

test('define', t => {
  t.equal(typeof define, 'function');
  t.end();
});
