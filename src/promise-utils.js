// mark promise with a flag __dr_async,
// so we know this is an async loading,
// instead of a sync loading which returns a
// promise object.
export function markPromise(maybePromise) {
  if (maybePromise && typeof maybePromise.then === 'function') {
    maybePromise.__dr_async = true;
  }
  return maybePromise;
}

export function isMarkedPromise(promise) {
  return promise &&
    typeof promise.then === 'function' &&
    promise.__dr_async;
}

// sequential executing callbacks,
// if a callback return promise, wait for finish before continue.
// stop at first failure.
// if no promise in results, return results,
// else return a promise.
export function serialResults(arr, callback) {
  let i = 0;
  let len = arr.length;

  function resolveChain(results) {
    if (i < len) {
      const result = callback(arr[i]);
      i += 1;

      if (isMarkedPromise(result)) {
        return result.then(r => resolveChain([...results, r]));
      } else {
        return resolveChain([...results, result]);
      }
    } else {
      return results;
    }
  }

  return markPromise(resolveChain([]));
}
