var util = require('util');
var path = require('path');
var fs = require('fs');
var express = require('express');
var app = express();
var systemNotify = false;

function fourOhFour(res, msg) {
  console.log(msg);
  res.end('', 404);
}

app.get('/', function(req, res) {
  // run all tests
  fs.readFile(path.normalize(path.join(__dirname, './resources/all.html')), function(err, data) {
		if (err) return fourOhFour(res, err);
		var output = data.toString();
		res.setHeader('Content-Type', 'text/html');
		res.end(output);
  });
});

app.get('/util/reporter.js', function(req, res) {
  // load the reporters
  fs.readFile(path.normalize(path.join(__dirname, './resources/reporter.js')), function(err, data) {
	if (err) return fourOhFour(res, err);
	res.setHeader('Content-Type', 'text/javascript');
	res.end(data.toString());
  });
});

app.get('/util/all.js', function(req, res) {
  // load the reporters
  fs.readFile(path.normalize(path.join(__dirname, './resources/all.js')), function(err, data) {
	if (err) return fourOhFour(res, err);
	res.setHeader('Content-Type', 'text/javascript');
	res.end(data.toString());
  });
});

app.get('/util/all.css', function(req, res) {
  // load the reporters
  fs.readFile(path.normalize(path.join(__dirname, './resources/all.css')), function(err, data) {
	if (err) return fourOhFour(res, err);
	res.setHeader('Content-Type', 'text/css');
	res.end(data.toString());
  });
});

app.get('/config.js', function(req, res) {
  fs.readFile(path.normalize(path.join(__dirname, '../config.js')), function(err, data) {
    if (err) return fourOhFour(res, err);
    res.setHeader('Content-Type', 'text/javascript');
    res.end(data.toString());
  });
});

app.get('/dumber-module-loader.js', function(req, res) {
  fs.readFile(path.normalize(path.join(__dirname, '../../dist/index.js')), function(err, data) {
		if (err) return fourOhFour(res, err);
		res.setHeader('Content-Type', 'text/javascript');
		res.end(data.toString());
  });
});

app.get('/tests/:test/test.html', function(req, res) {
  // run one test
  fs.readFile(path.normalize(path.join(__dirname, './resources/template.html')), function(err, data) {
	if (err) return fourOhFour(res, err);

	var reporter = '/util/reporter.js';
	var testFile = '/tests/'+req.params.test+'/_test.js';
	var testName = req.params.test;

	var output = data.toString()
	  .replace(/\{\{REPORTER\}\}/g, reporter)
	  .replace(/\{\{TEST\}\}/g, testFile)
	  .replace(/\{\{TEST_NAME\}\}/g, testName);
	res.setHeader('Content-Type', 'text/html');
	res.end(output);
  });
});

app.get('/tests/:test/*', function(req, res) {
  // get a file for the specified test
  var testPath = '../tests/'+req.params.test+'/'+req.params[0];
  fs.readFile(path.normalize(path.join(__dirname, testPath)), function(err, data) {
	if (err) return fourOhFour(res, err);
	res.setHeader('Content-Type', 'text/javascript');
	res.end(data.toString());
  });
});

app.get('*', function(req, res){
  res.send('', 404);
});

app.listen(4000);

util.log('AMD JS Test server running on port 4000');
util.log('To run:  http://localhost:4000');

