'use strict';

var sinon = require('sinon');

var validationHelpers = require('../').validationHelpers;

describe('Validation helpers', function() {
  describe('castHeaderValue(value, header, inArray)', function() {
    [
      { desc: 'an object', value: {} },
      { desc: '`null`', value: null },
      { desc: '`undefined`', value: undefined },
      { desc: 'non-finite numbers', value: Infinity }
    ].forEach(function(subject) {
      describe('`value` is ' + subject.desc, function() {
        it('throws a `TypeError`', function() {
          assert.throws(function() {
            validationHelpers.castHeaderValue(subject.value, 'foo');
          }, TypeError, 'Unexpected value for `foo` header.');
        });
      });
    });

    [
      { desc: 'a string', value: 'a string', result: 'a string' },
      { desc: 'a number', value: 42, result: '42' },
      { desc: '`true`', value: true, result: 'true' },
      { desc: '`false`', value: false, result: 'false' }
    ].forEach(function(subject) {
      describe('`value` is ' + subject.desc, function() {
        it('casts to a string', function() {
          assert.equal(
            validationHelpers.castHeaderValue(subject.value),
            subject.result);
        });
      });
    });

    describe('`value` is an array', function() {
      describe('`inArray` is falsey', function() {
        var spy;
        beforeEach(function() {
          spy = sinon.spy(validationHelpers, 'castHeaderValue');
        });
        afterEach(function() {
          spy.restore();
        });

        it('recurses', function() {
          validationHelpers.castHeaderValue(['bar'], 'foo', false);

          assert.calledTwice(spy);
          assert.calledWithExactly(spy, 'bar', 'foo', true);
        });

        it('casts each value', function() {
          assert.deepEqual(
            validationHelpers.castHeaderValue(['a string', 42, true, false]),
            ['a string', '42', 'true', 'false']);
        });
      });

      describe('inArray is truey', function() {
        it('throws a `TypeError`', function() {
          assert.throws(function() {
            validationHelpers.castHeaderValue([], 'foo', true);
          }, TypeError, 'Unexpected value for `foo` header.');
        });
      });
    });
  });

  describe('castQueryValue(value, param)', function() {
    [
      { desc: 'an object', value: {} },
      { desc: '`null`', value: null },
      { desc: '`undefined`', value: undefined },
      { desc: 'non-finite numbers', value: Infinity }
    ].forEach(function(subject) {
      describe('`value` is ' + subject.desc, function() {
        it('throws a `TypeError`', function() {
          assert.throws(function() {
            validationHelpers.castQueryValue(subject.value, 'foo');
          }, TypeError, 'Unexpected value for `foo` param.');
        });
      });
    });

    [
      { desc: 'a string', value: 'a string', result: 'a string' },
      { desc: 'a number', value: 42, result: '42' },
      { desc: '`true`', value: true, result: 'true' },
      { desc: '`false`', value: false, result: 'false' }
    ].forEach(function(subject) {
      describe('`value` is ' + subject.desc, function() {
        it('casts to a string', function() {
          assert.equal(
            validationHelpers.castQueryValue(subject.value),
            subject.result);
        });
      });
    });
  });
});
