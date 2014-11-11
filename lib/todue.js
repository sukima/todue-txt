var util    = require('util');
var stream  = require('stream');
var es      = require('event-stream');
var through = require('through2');
var moment  = require('moment');
var Prowl   = require('node-prowl');

exports.split = es.split;

exports.todoParse = function todoParse() {
  var parse = through.obj(function(data, enc, callback) {
    if (!data) {
      this.push(null);
      return callback();
    }
    data = data.toString();
    var todo = {
      contexts: [],
      projects: []
    };
    if (/^x /i.test(data)) {
      todo.complete = true;
      data = data.substr(2);
    } else {
      todo.complete = false;
    }
    data = data.replace(/\s+due:(\S+)/i, function(match, dueDate) {
      todo.due = dueDate;
      return '';
    });
    data = data.replace(/\s+@(\S+)/g, function(match, context) {
      todo.contexts.push(context);
      return '';
    });
    data = data.replace(/\s+\+(\S+)/g, function(match, context) {
      todo.projects.push(context);
      return '';
    });
    todo.description = data.trim();
    this.push(todo);
    callback();
  });

  return es.split().pipe(parse);
};

exports.filterByDueDate = function filterByDueDate(dueOnDate) {
  dueOnDate = (dueOnDate != null) ? moment(dueOnDate) : moment();
  return es.map(function(data, callback) {
    var due = data.due && moment(data.due);
    if (due && !due.isAfter(dueOnDate, 'day')) {
      data.pastDue = dueOnDate.isAfter(due, 'day');
      callback(null, data);
    } else {
      callback();
    }
  });
};

exports.filterComplete = function filterComplete() {
  return es.map(function(data, callback) {
    if (data.complete) {
      callback();
    } else {
      callback(null, data);
    }
  });
};

exports.todoProwlDesc = function todoProwlDesc(todo) {
  var priority = todo.priority && todo.priority.toUpperCase();
  if (priority) {
    return util.format('(%s) %s', priority, todo.description);
  } else {
    return todo.description;
  }
};

exports.prowlPriority = function prowlPriority(priority) {
  switch (priority && priority.toUpperCase()) {
    case 'A': return 2;
    case 'B': return 1;
    case 'C': return 0;
    case 'D': return -1;
    case 'E': return -2;
    default:  return 0;
  }
};

exports.sendToProwl = function sendToProwl(apiKey) {
  var prowl = (typeof apiKey === 'string') ? new Prowl(apiKey) : apiKey;
  var prowlStream = new stream.Writable({objectMode: true});
  prowlStream._write = function(todo, enc, callback) {
    var options = {
      description: exports.todoProwlDesc(todo),
      priority:    exports.prowlPriority(todo.priority)
    };
    prowl.push('Due Today', 'todo.txt', options, callback);
  };
  return prowlStream;
};
