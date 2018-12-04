var path = require('path');
var fs = require('fs');

function fourOhFour(res) {
  res.end('', 404);
}
module.exports = function(req, res) {
  if (req.url === '/mock/util/reporter.js') {
    fs.readFile(path.normalize(path.join(__dirname, 'util/reporter.js')), function(err, data) {
      if (err) return fourOhFour(res);
      res.setHeader('Content-Type', 'text/javascript');
      res.end(data.toString());
    });
  } else if (req.url === '/mock/util/all.js') {
    fs.readFile(path.normalize(path.join(__dirname, 'util/all.js')), function(err, data) {
      if (err) return fourOhFour(res);
      res.setHeader('Content-Type', 'text/javascript');
      res.end(data.toString());
    });
  } else if (req.url === '/mock/util/all.css') {
    fs.readFile(path.normalize(path.join(__dirname, 'util/all.css')), function(err, data) {
      if (err) return fourOhFour(res);
      res.setHeader('Content-Type', 'text/css');
      res.end(data.toString());
    });
  } else if (req.url === '/mock/config.js') {
    fs.readFile(path.normalize(path.join(__dirname, 'config.js')), function(err, data) {
      if (err) return fourOhFour(res);
      res.setHeader('Content-Type', 'text/javascript');
      res.end(data.toString());
    });
  } else if (req.url === '/mock/dumber-module-loader.js') {
    fs.readFile(path.normalize(path.join(__dirname, '../dist/index.js')), function(err, data) {
      if (err) return fourOhFour(res);
      res.setHeader('Content-Type', 'text/javascript');
      res.end(data.toString());
    });
  } else if (req.url.startsWith('/mock/tests/')) {
    const m = req.url.match(/^\/mock\/tests\/([^/]+)\/(.+)$/);
    const test = m[1];
    const file = m[2];

    if (file === 'test.html') {
      fs.readFile(path.normalize(path.join(__dirname, './util/template.html')), function(err, data) {
        if (err) return fourOhFour(res);

        var reporter = '/mock/util/reporter.js';
        var testFile = '/mock/tests/'+test+'/_test.js';
        var testName = test;

        var output = data.toString()
          .replace(/\{\{REPORTER\}\}/g, reporter)
          .replace(/\{\{TEST\}\}/g, testFile)
          .replace(/\{\{TEST_NAME\}\}/g, testName);
        res.setHeader('Content-Type', 'text/html');
        res.end(output);
      });
    } else {
      var testPath = 'tests/'+test+'/'+file;
      fs.readFile(path.normalize(path.join(__dirname, testPath)), function(err, data) {
        if (err) return fourOhFour(res);
        res.setHeader('Content-Type', 'text/javascript');
        res.end(data.toString());
      });
    }
  } else {
    res.send('', 404);
  }
};
