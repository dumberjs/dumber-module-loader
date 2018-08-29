import test from 'tape';
import {cleanPath, stripPluginPrefixOrSubfix} from '../src/id-utils';

test('cleanPath', t => {
  t.equal(cleanPath('  a/b '), 'a/b', 'trim off spaces');
  t.equal(cleanPath('  a/b/ '), 'a/b', 'remove trailing /');
  t.equal(cleanPath(' /a/ '), '/a', 'reserve leading /');
  t.equal(cleanPath(' ./a/ '), './a', 'reserve leading ./');
  t.equal(cleanPath(' ../../a/ '), '../../a', 'reserve leading ../');
  t.end();
});

test('stripPluginPrefixOrSubfix', t => {
  t.equal(stripPluginPrefixOrSubfix(' a/b '), 'a/b', 'trim off spaces');
  t.equal(stripPluginPrefixOrSubfix(' text!a/b '), 'a/b', 'trim off prefix');
  t.equal(stripPluginPrefixOrSubfix(' a/b.css!css '), 'a/b.css', 'trim off subfix');
  t.end();
});
