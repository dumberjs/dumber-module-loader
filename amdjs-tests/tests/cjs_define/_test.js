// modified to make two in front of one
// due to our limitation on simplified circular deps implementation
go(     ["_reporter", "two", "one", "three"],
function (amdJS,       two,   one,   three) {
  var args = two.doSomething(),
      oneMod = two.getOneModule();

  amdJS.assert('large' === one.size, 'cjs_define: one.size');
  amdJS.assert('small' === two.size, 'cjs_define: two.size');
  amdJS.assert('small' === args.size, 'cjs_define: args.size');
  amdJS.assert('redtwo' === args.color, 'cjs_define: args.color');
  amdJS.assert('one' === oneMod.id, 'cjs_define: module.id property support');
  amdJS.assert('three' === three.name, 'cjs_define: three.name');
  amdJS.assert('four' === three.fourName, 'cjs_define: four.name via three');
  amdJS.assert('five' === three.fiveName, 'cjs_define: five.name via four');
  amdJS.print('DONE', 'done');
});
