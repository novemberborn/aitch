'use strict';

var EventEmitter = require('events').EventEmitter;
var http = require('http');

var sinon = require('sinon');
var Promise = require('legendary').Promise;

var UnencryptedTransport = require('../').UnencryptedTransport;

describe('UnencryptedTransport', function() {
  function makeOption(name, value) {
    var options = {};
    options[name] = value;
    return options;
  }

  function makeTransport(options, base) {
    base = base || {};
    var obj = Object.create(base);
    UnencryptedTransport.call(obj, options);
    return obj;
  }

  describe('UnencryptedTransport([options]) constructor', function() {
    describe('`options` is truey, but not an object', function() {
      it('throws a `TypeError`', function() {
        assert.throws(function() {
          return new UnencryptedTransport('42');
        }, TypeError, 'Expected `options` to be an object.');
      });
    });

    [
      { name: 'hostname', default: 'localhost' },
      { name: 'port', default: 80 },
      { name: 'agent', default: undefined }
    ].forEach(function(subject) {
      var name = subject.name;
      var defaultValue = subject.default;

      describe('`' + name + '` property', function() {
        describe('specified in options', function() {
          it('is set to `options.' + name + '`', function() {
            assert.property(
              makeTransport(makeOption(name, sentinels.foo)),
              name,
              sentinels.foo);
          });
        });

        describe('already exists on the instance', function() {
          it('is set to the existing value', function() {
            assert.property(
              makeTransport(null, makeOption(name, sentinels.foo)),
              name,
              sentinels.foo);
          });

          it('is an own-property', function() {
            var t = makeTransport(null, makeOption(name, sentinels.foo));
            assert.isTrue(t.hasOwnProperty(name));
          });
        });

        describe('does not exist and is not specified', function() {
          it('defaults to `' + defaultValue + '`', function() {
            assert.strictEqual(makeTransport()[name], defaultValue);
          });
        });
      });
    });
  });

  describe('#_makeRequest(options)', function() {
    var stub;
    beforeEach(function() {
      stub = sinon.stub(http, 'request').returns(sentinels.bar);
    });
    afterEach(function() {
      stub.restore();
    });

    it('relies on `http.request()`', function() {
      var result = new UnencryptedTransport()._makeRequest(sentinels.foo);

      assert.calledOnce(stub);
      assert.calledWithExactly(stub, sentinels.foo);
      assert.matchingSentinels(result, sentinels.bar);
    });
  });

  describe('#issueRequest(descriptor, [Response])', function() {
    var transport, mockRequest, stubbedMakeRequest;
    beforeEach(function() {
      transport = new UnencryptedTransport({
        hostname: new sentinels.Sentinel('hostname'),
        port: new sentinels.Sentinel('port'),
        agent: new sentinels.Sentinel('agent')
      });

      mockRequest = sinon.mock(new EventEmitter());
      mockRequest.object.abort = function() {};
      mockRequest.object.end = function() {};

      stubbedMakeRequest = sinon.stub(transport, '_makeRequest')
        .returns(mockRequest.object);
    });

    it('passes correct options to `_makeRequest()`', function() {
      transport.issueRequest({
        method: sentinels.foo,
        path: sentinels.bar,
        headers: sentinels.baz,
        auth: sentinels.qux
      });

      assert.calledOnce(stubbedMakeRequest);
      assert.calledWithMatch(stubbedMakeRequest, sinon.match({
        hostname: transport.hostname,
        port: transport.port,
        agent: transport.agent,
        method: sentinels.foo,
        path: sentinels.bar,
        headers: sentinels.baz,
        auth: sentinels.qux
      }));
    });

    describe('with a `Response` constructor', function() {
      it('is invoked, returning the result', function() {
        var constructor = sinon.spy(function() { return sentinels.foo; });
        var result = transport.issueRequest({}, constructor);

        assert.calledOnce(constructor);
        assert.calledWithMatch(constructor, sinon.match.func);
        assert.matchingSentinels(result, sentinels.foo);
      });
    });

    describe('without a `Response` constructor', function() {
      it('returns a Promise instance', function() {
        assert.instanceOf(transport.issueRequest({}), Promise);
      });
    });

    describe('request lifecycle management', function() {
      it('listens for `response` and `error` events', function() {
        mockRequest.expects('on').once().withArgs('response', sinon.match.func);
        mockRequest.expects('on').once().withArgs('error', sinon.match.func);

        transport.issueRequest({});
        mockRequest.verify();
      });

      describe('when the response promise is cancelled', function() {
        it('removes `response` and `error` event listeners', function() {
          mockRequest.expects('removeListener')
            .once().withArgs('response', sinon.match.func);
          mockRequest.expects('removeListener')
            .once().withArgs('error', sinon.match.func);

          transport.issueRequest({}).cancel();
          mockRequest.verify();
        });

        it('aborts the request', function() {
          mockRequest.expects('abort').once();

          transport.issueRequest({}).cancel();
          mockRequest.verify();
        });
      });

      describe('without a `body` option', function() {
        it('ends with no data', function() {
          mockRequest.expects('end').once().withArgs();

          transport.issueRequest({});
          mockRequest.verify();
        });
      });

      describe('with `body.stream` option', function() {
        var stream;
        beforeEach(function() {
          stream = sinon.mock({ pipe: function() {} });
          stream.expects('pipe').once().withExactArgs(mockRequest.object);
        });

        it('pipes stream', function() {
          transport.issueRequest({ body: { stream: stream.object } });
          stream.verify();
        });

        describe('and with a `body.chunk` option', function() {
          it('still just pipes the stream', function() {
            transport.issueRequest({ body: { stream: stream.object } });
            stream.verify();
          });
        });
      });

      describe('with `body.chunk` option', function() {
        it('ends with the chunk', function() {
          mockRequest.expects('end').once().withExactArgs(sentinels.foo);

          transport.issueRequest({ body: { chunk: sentinels.foo } });
          mockRequest.verify();
        });
      });

      describe('when `response` is emitted', function() {
        it('resolves the promise', function() {
          var p = transport.issueRequest({});
          mockRequest.object.emit('response', sentinels.foo);
          return assert.eventually.matchingSentinels(p, sentinels.foo);
        });
      });

      describe('when `error` is emitted', function() {
        it('rejects the promise', function() {
          var p = transport.issueRequest({});
          mockRequest.object.emit('error', sentinels.foo);
          return assert.isRejected(p, sentinels.Sentinel);
        });
      });
    });
  });
});
