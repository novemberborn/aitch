'use strict';

var Promise = require('legendary').Promise;
var Thenstream = require('thenstream').Thenstream;
var PassThrough = require('stream').PassThrough;
var sinon = require('sinon');

var Response = require('../').Response;

describe('Response', function() {
  var resolve, reject, response;
  beforeEach(function() {
    response = new Response(function(res, rej) {
      resolve = res;
      reject = rej;
    });
  });

  it('is a Promise constructor', function() {
    assert.isPromiseConstructor(Response);
  });

  ['statusCode', 'headers'].forEach(function(prop) {
    describe('#' + prop, function() {
      it('returns a Promise', function() {
        var p = response[prop];
        assert.instanceOf(p, Promise);
        assert.notInstanceOf(p, Response);
      });

      describe('when accessed multiple times', function() {
        it('returns the same promise', function() {
          assert.strictEqual(response[prop], response[prop]);
        });
      });

      describe('when the response fulfills', function() {
        it('fulfills with the `.' + prop + '` property of the fulfillment ' +
          'value',
          function() {
            var value = {};
            value[prop] = sentinels.foo;
            resolve(value);
            return assert.eventually.matchingSentinels(
              response[prop], sentinels.foo);
          });
      });

      describe('when the response rejects', function() {
        it('rejects with the same reason', function() {
          reject(sentinels.foo);
          return assert.isRejected(response[prop], sentinels.Sentinel);
        });
      });
    });
  });

  describe('#stream', function() {
    it('returns a Thenstream', function() {
      assert.instanceOf(response.stream, Thenstream);
    });

    describe('when accessed multiple times', function() {
      it('returns the same stream', function() {
        assert.strictEqual(response.stream, response.stream);
      });
    });

    describe('when the response fulfills', function() {
      it('streams from the fulfillment value', function() {
        var stream = response.stream;

        var pt = new PassThrough({ objectMode: true });
        resolve(pt);

        return response.then(function() {
          pt.end(sentinels.foo);
          assert.matchingSentinels(stream.read(), sentinels.foo);
        });
      });
    });

    describe('when the response rejects', function() {
      it('emits an `error` event with that reason', function(done) {
        var spy = sinon.spy();
        response.stream.on('error', spy);

        reject(sentinels.foo);

        setTimeout(function() {
          assert.calledOnce(spy);
          assert.calledWithExactly(spy, sentinels.foo);
          done();
        }, 10);
      });
    });
  });
});
