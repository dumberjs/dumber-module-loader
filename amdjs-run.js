const fs = require('fs');
const browserRun = require('browser-run');
const { Writable } = require('stream');

let result = null;
let timeoutSeconds = 20;

const opts = {input: 'html', mock: 'amdjs-tests/mock.js'};
const browser = process.argv[2];
if (browser) opts.browser = browser;
const server = browserRun(opts);

const detectFinish = new Writable({
  write(chunk, encoding, callback) {
    const lines = chunk.toString();
    process.stdout.write(lines);
    const check = lines.match(/#test: (\w+)/);
    if (check) {
      result = check[1];
      process.stdout.write('amdjs-tests ' + result + '\n');
      done();
    }
    callback();
  }
});

function done() {
  server.stop();
  process.exit(result === 'pass' ? 0 : 1);
}

fs.createReadStream('amdjs-tests/index.html')
.pipe(server)
.pipe(detectFinish);

setTimeout(() => {
  if (result === null) {
    process.stdout.write('Timeout: no result received in ' + timeoutSeconds + 'seconds');
  }
  done();
}, timeoutSeconds * 1000);
