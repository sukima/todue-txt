var fs      = require('fs');
var path    = require('path');
var chai    = require('chai');
var expect  = chai.expect;
var sinon   = require('sinon');
var es      = require('event-stream');
var stream  = require('stream');
var through = require('through2');
var moment  = require('moment');
var ToDue   = require('..');

chai.Assertion.addMethod('afterDate', function(date) {
  var obj = moment(this._obj);
  date = moment(date);
  this.assert(
    obj.isAfter(date, 'day'),
    'expected #{act} to be after #{exp} (in days)',
    'expected #{act} to not be after #{exp} (in days)',
    date.format('YYYY-MM-DD'),
    obj.format('YYYY-MM-DD')
  );
});

var check = function(callback, expectations, args) {
  return function() {
    try {
      expectations(args && args());
      callback();
    } catch (err) {
      callback(err);
    }
  };
};

var checkStream = function(callback, expectations) {
  var results = [];
  return through.obj(function(chunk, enc, callback) {
    results.push(chunk);
    this.push(chunk);
    callback();
  }, check(callback, expectations, function() { return results; }))
  .once('error', callback);
};

var getFixturePath = function(todoName) {
  return path.join(__dirname, 'fixtures', todoName);
};

var getFixtureStream = function(todoName) {
  return fs.createReadStream(getFixturePath(todoName + '.txt'));
};

var getFixtureData = function(todoName) {
  return new stream.Readable({objectMode: true})
  .wrap(es.readArray(require(getFixturePath(todoName + '.json'))));
};

describe('todoParse', function() {
  beforeEach(function() {
    this.testStream = getFixtureStream('todoparse').pipe(es.split());
  });

  it('converts a text stream to stream of todo objects', function(done) {
    var expected = [
      {complete: false, description: 'test todo 1', contexts: ["Testing"], projects: ["tester"]},
      {complete: false, description: 'test todo 2', contexts: [], projects: ["tester"], due: "2015-06-07"},
      {complete: true,  description: 'test todo 3', contexts: ["Testing"], projects: []}
    ];

    this.testStream.pipe(ToDue.todoParse())
    .pipe(checkStream(done, function(results) {
      expect(results).to.deep.equal(expected);
    }));
  });
});

describe('filterByDueDate', function() {
  beforeEach(function() {
    this.testStream = getFixtureData('todo');
  });

  it('ignores todos that are in the future', function(done) {
    var date = moment("2015-06-07", "YYYY-MM-DD");
    this.testStream.pipe(ToDue.filterByDueDate(date))
    .pipe(checkStream(done, function(results) {
      expect(results).to.have.length.above(0);
      results.forEach(function(todo) {
        expect(todo).to.have.property('due');
        expect(todo.due).to.not.be.afterDate(date);
      });
    }));
  });

  it('flags todos that are past due', function(done) {
    var date = moment("2016-07-10", "YYYY-MM-DD");
    this.testStream.pipe(ToDue.filterByDueDate(date))
    .pipe(checkStream(done, function(results) {
      expect(results).to.have.length.above(0);
      results.forEach(function(todo) {
        expect(todo).to.have.property('pastDue', true);
      });
    }));
  });
});

describe('filterComplete', function() {
  beforeEach(function() {
    this.testStream = getFixtureData('todo');
  });

  it('ignores completed todos', function(done) {
    this.testStream.pipe(ToDue.filterComplete())
    .pipe(checkStream(done, function(results) {
      expect(results).to.have.length.above(0);
      results.forEach(function(todo) {
        expect(todo.complete).to.be.false;
      });
    }));
  });
});

describe('sendToProwl', function() {
  beforeEach(function() {
    this.testStream = getFixtureData('sendtoprowltodos');
    this.prowl = sinon.stub();
  });

  it('sends a todo message to the prowl API', function(done) {
    var prowl      = {push: sinon.mock().twice().callsArg(3)};
    this.testStream.pipe(ToDue.sendToProwl(prowl))
    .once('error', done)
    .once('finish', check(done, function() {
      prowl.push.verify();
    }));
  });
});
