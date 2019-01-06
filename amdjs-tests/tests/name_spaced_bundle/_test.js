config({
  bundles: {
    foo: {
      nameSpace: 'ns',
      user: ['a']
    }
  }
});

go(     ["_reporter", "ns/a"],
function (amdJS,       a) {
  amdJS.assert(3 === a, 'name_spaced_bundle: ns/a');
  amdJS.print('DONE', 'done');
});
