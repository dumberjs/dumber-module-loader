import _global from '../src/_global';

let originalFetchApi = _global.fetch;

function makeResponse(obj) {
  return {
    ...obj,
    clone: () => obj
  };
}

export function mockFetchApi(mock = {}) {
  _global.define.__skip_script_load_test = true;
  _global.__fetch_hit = {};
  _global.fetch = url => {
    _global.__fetch_hit[url] = 1 + (_global.__fetch_hit[url] || 0);

    const text = mock[url];
    if (!text) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(makeResponse({
            ok: false,
            status: 500,
            statusText: 'failed'
          }));
        });
      });
    }

    return new Promise(resolve => {
      setTimeout(() => {
        resolve(makeResponse({
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
          }),
          arrayBuffer: () => new Promise(resolve => {
            setTimeout(() => {
              resolve(text);
            });
          })
        }));
      });
    });
  };
}

export function restoreFetchApi() {
  _global.fetch = originalFetchApi;
  _global.define.__skip_script_load_test = false;
}
