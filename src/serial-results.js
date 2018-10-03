// sequential executing callbacks,
// if a callback return promise, wait for finish before continue.
// stop at first failure.
// if no promise in results, return results,
// else return a promise.
export default function (arr, callback) {
  let i = 0;
  let len = arr.length;

  function resolveChain(results) {
    if (i < len) {
      const result = callback(arr[i]);
      i += 1;

      if (result && typeof result.then === 'function') {
        return result.then(r => resolveChain([...results, r]));
      } else {
        return resolveChain([...results, result]);
      }
    } else {
      return results;
    }
  }

  return resolveChain([]);
}
