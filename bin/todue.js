#!/usr/bin/env node
var fs    = require('fs');
var path  = require('path');
var pkg   = require('../package.json');
var ToDue = require('../lib/todue');

var yargs = require('yargs')
  .usage('Usage: $0 [--api KEY] [FILE]\nFILE defaults to $TODO_FILE environment variable or STDIN.')
  .example('$0 -a 12345 -', 'Read STDIN for todo list.')
  .example('$0 -a 12345 ~/todo/todo.txt', 'Use ~/todo/todo.txt for list of todos.')
  .describe('api', 'Set the Prowl service API key to KEY. (or use $PROWL_API_KEY environemnt variable)')
  .alias('api', 'a')
  .alias('dry-run', 'n')
  .describe('dry-run', 'Don\'t actually submit to Prowl service.')
  .version(pkg.version, 'version')
  .alias('version', 'v')
  .help('help')
  .alias('help', 'h')
  .boolean(['dry-run', 'n']);

function exitSuccess() {
  process.exit(0);
}

function exitError(err) {
  console.error(err);
  process.exit(2);
}

var todoStream;
var argv     = yargs.argv;
var todoFile = argv._[0] || process.env.TODO_FILE || '-';
var apiKey   = argv.api || process.env.PROWL_API_KEY;

if (!apiKey) {
  yargs.showHelp();
  exitError("No API key given for Prowl service");
}

if (argv.dryRun) {
  // Mock the Prowl class for debugging
  apiKey = {
    push: function(title, app, opts, cb) {
      var pri = opts.priority ? ' (' + opt.priority + ')' : '';
      console.log('Posting "%s" %s via %s%s.', title, opts.description, app, pri);
      cb();
    }
  };
}

if (todoFile === '-') {
  todoStream = process.stdin;
} else {
  todoStream = fs.createReadStream(todoFile);
}

todoStream
  .pipe(ToDue.todoParse())
  .pipe(ToDue.filterComplete())
  .pipe(ToDue.filterByDueDate())
  .pipe(ToDue.sendToProwl(apiKey))
  .on('finish', exitSuccess)
  .on('error', exitError);
