import _global from '../src/_global';

let originalFetchApi = _global.fetch;

export function mockFetchApi(mock = {}) {
  _global.fetch = url => {
    const text = mock[url];
    if (typeof text !== 'string') {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: false,
            status: 500,
            statusText: 'failed'
          });
        });
      });
    }

    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          text: () => new Promise(resolve => {
            setTimeout(() => {
              resolve(text);
            });
          }),
          json: () => new Promise(resolve => {
            setTimeout(() => {
              resolve(JSON.parse(text));
            });
          })
        });
      });
    });
  };
}

export function restoreFetchApi() {
  _global.fetch = originalFetchApi;
}
