let originalFetchApi = globalThis.fetch;

function makeResponse(obj) {
  return {
    ...obj,
    clone: () => obj
  };
}

export function mockFetchApi(mock = {}) {
  globalThis.define.__skip_script_load_test = true;
  globalThis.__fetch_hit = {};
  globalThis.fetch = url => {
    globalThis.__fetch_hit[url] = 1 + (globalThis.__fetch_hit[url] || 0);

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
  globalThis.fetch = originalFetchApi;
  globalThis.define.__skip_script_load_test = false;
}
