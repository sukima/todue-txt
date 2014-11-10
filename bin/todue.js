#!/usr/bin/env node
var fs    = require('fs');
var path  = require('path');
var pkg   = require('../package.json');
var ToDue = require('../lib/todue');

var argv = require('yargs')
  .usage('Usage: $0 [--config CONFIG | FILE]')
  .example('$0 -', 'Read STDIN for todo list.')
  .example('$0 ~/todo/done.txt', 'Use ~/todo/done.txt for list of todos.')
  .version(pkg.version, 'version')
  .alias('version', 'v')
  .help('help')
  .alias('help', 'h')
  .argv;

function exitSuccess() {
  process.exit(0);
}

function exitError(err) {
  console.error(err);
  process.exit(2);
}

function processTodo(stream) {
  var apiKey = {push: function() {}};

  stream
  .pipe(ToDue.todoParse())
  .pipe(ToDue.filterComplete())
  .pipe(ToDue.filterByDueDate())
  .pipe(ToDue.sendToProwl(apiKey))
  .on('finish', exitSuccess)
  .on('error', exitError);
}

var todoStream;
var todoFile = argv._[0] || process.env.TODO_FILE || '-';

if (todoFile === '-') {
  todoStream = process.stdin;
} else {
  todoStream = fs.createReadStream(todoFile);
}

processTodo(todoStream);
