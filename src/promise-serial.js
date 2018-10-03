// sequential executing callbacks, stop at first failure
export default function (arr, callback) {
  let i = 0;
  let len = arr.length;

  function resolveChain(results) {
    if (i < len) {
      return Promise.resolve(callback(arr[i++]))
      .then(result => {
        return resolveChain([...results, result]);
      });
    } else {
      return Promise.resolve(results);
    }
  }

  return resolveChain([]);
}
