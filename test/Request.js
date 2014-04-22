'use strict';

var sinon = require('sinon');

var BaseClient = require('../').BaseClient;
var Request = require('../').Request;
var validationHelpers = require('../').validationHelpers;

describe('Request', function() {
  var client, request;
  beforeEach(function() {
    client = new BaseClient({ transport: {} });
    request = new Request({
      pathname: '/',
      headers: [],
      query: []
    }, 'GET', {});
  });

  describe('Request(client, method, options) constructor', function() {
    it('sets its `method` property to `method`', function() {
      assert.matchingSentinels(
        new Request(client, sentinels.foo, sentinels.bar).method,
        sentinels.foo);
    });

    it('calls builders, in order', function() {
      var fakeInstance = sinon.mock({
        buildPath: function() {},
        buildHeaders: function() {},
        buildBody: function() {},
        buildAuth: function() {}
      });

      var builderSentinels = [
        'pathname', 'query', 'headers', 'auth', 'method', 'options'
      ].reduce(function(result, label) {
        result[label] = new sentinels.Sentinel(label);
        return result;
      }, {});

      var path = fakeInstance.expects('buildPath')
        .once().withExactArgs(
          builderSentinels.pathname,
          builderSentinels.query,
          builderSentinels.options);
      var headers = fakeInstance.expects('buildHeaders')
        .once().withExactArgs(
          builderSentinels.headers,
          builderSentinels.options);
      var body = fakeInstance.expects('buildBody')
        .once().withExactArgs(builderSentinels.options);
      var auth = fakeInstance.expects('buildAuth')
        .once().withExactArgs(builderSentinels.auth, builderSentinels.options);

      Request.call(fakeInstance.object, {
        pathname: builderSentinels.pathname,
        query: builderSentinels.query,
        headers: builderSentinels.headers,
        auth: builderSentinels.auth
      }, builderSentinels.method, builderSentinels.options);

      assert.callOrder(path, headers, body, auth);
      fakeInstance.verify();
    });
  });

  describe('#buildPath(defaultPathname, baseQuery, options)', function() {
    function throwsError(options, message) {
      it('throws a `TypeError`', function() {
        assert.throws(function() {
          return request.buildPath('/', [], options);
        }, TypeError, message);
      });
    }

    describe('`options.pathname`', function() {
      describe('is not a string', function() {
        throwsError(
          { pathname: null },
          'Expected `pathname` to be a non-empty string.');
      });

      describe('is an empty string', function() {
        throwsError(
          { pathname: '' },
          'Expected `pathname` to be a non-empty string.');
      });

      describe('contains a `?`', function() {
        throwsError(
          { pathname: '/foo?bar' },
          '`pathname` cannot contain `?`.');
      });

      describe('if specified', function() {
        it('is used in the path', function() {
          assert.equal(
            request.buildPath('/foo', [], { pathname: '/bar' }),
            '/bar');
        });
      });

      describe('if not specified', function() {
        it('`defaultPathname` is used in the path', function() {
          assert.equal(
            request.buildPath('/foo', [], {}),
            '/foo');
        });
      });
    });

    describe('`options.query`', function() {
      describe('is falsey', function() {
        throwsError(
          { query: null },
          'Expected `query` to be an object.');
      });

      describe('is not an object', function() {
        throwsError(
          { query: '42' },
          'Expected `query` to be an object.');
      });
    });

    it('relies on #buildQueryPairs()', function() {
      var spy = sinon.spy(request, 'buildQueryPairs');
      request.buildPath('/', sentinels.foo, { query: sentinels.bar });
      assert.calledOnce(spy);
      assert.calledWithExactly(spy, sentinels.foo, sentinels.bar);
    });

    it('combines the pathname with the built query parts', function() {
      sinon.stub(request, 'buildQueryPairs').returns(['bar', 'baz']);
      assert.equal(request.buildPath('/foo', [], {}), '/foo?bar&baz');
    });
  });

  describe('#buildQueryPairs(base, [query])', function() {
    it('creates encoded pairs from the `base` list', function() {
      assert.deepEqual(
        request.buildQueryPairs(['foo', 'bar', 'bäz', 'qüx']),
        ['foo=bar', 'b%C3%A4z=q%C3%BCx']);
    });

    describe('with `query`', function() {
      var stub;
      beforeEach(function() {
        stub = sinon.stub(validationHelpers, 'castQueryValue').returnsArg(0);
      });
      afterEach(function() {
        stub.restore();
      });

      describe('containing a property with an empty name', function() {
        it('throws a `TypeError`', function() {
          assert.throws(function() {
            request.buildQueryPairs([], { '': true });
          }, TypeError, 'Unexpected empty param name.');
        });
      });

      it('validates values', function() {
        request.buildQueryPairs([], { foo: 'bar' });

        assert.calledOnce(stub);
        assert.calledWithExactly(stub, 'bar', 'foo');
      });

      it('creates encoded pairs from the `query` object', function() {
        assert.deepEqual(
          request.buildQueryPairs([], { 'foo': 'bar', 'bäz': 'qüx' }),
          ['foo=bar', 'b%C3%A4z=q%C3%BCx']);
      });

      it('is combined with `base`', function() {
        var pairs = request.buildQueryPairs(
          ['foo', '---', 'baz', 'qux'],
          { 'foo': 'bar', 'quux': 'corge' });
        assert.deepEqual(pairs, ['baz=qux', 'foo=bar', 'quux=corge']);
      });
    });
  });

  describe('#buildHeaders(base, options)', function() {
    function throwsError(headers, message) {
      it('throws a `TypeError`', function() {
        assert.throws(function() {
          return request.buildHeaders([], { headers: headers });
        }, TypeError, message);
      });
    }

    it('constructs an object from the `base` list', function() {
      assert.deepEqual(
        request.buildHeaders(['foo', 'bar', 'baz', 'qux'], {}),
        { foo: 'bar', baz: 'qux' });
    });

    describe('with `options.headers`', function() {
      var stub;
      beforeEach(function() {
        stub = sinon.stub(validationHelpers, 'castHeaderValue').returnsArg(0);
      });
      afterEach(function() {
        stub.restore();
      });

      describe('is falsey', function() {
        throwsError(
          null,
          'Expected `headers` to be an object.');
      });

      describe('is not an object', function() {
        throwsError(
          '42',
          'Expected `headers` to be an object.');
      });

      describe('containing a property with an empty name', function() {
        throwsError(
          { '': true },
          'Unexpected empty header name.');
      });

      describe('containing a duplicate, case-insensitive property name',
        function() {
          throwsError(
            { foo: 'bar', FOO: 'baz' },
            'Unexpected duplicate `FOO` header.');
        });

      it('validates values', function() {
        request.buildHeaders([], { headers: { foo: 'bar' } });

        assert.calledOnce(stub);
        assert.calledWithExactly(stub, 'bar', 'foo');
      });

      it('uses lowercased header names', function() {
        assert.deepEqual(
          request.buildHeaders([], { headers: { FoO: 'bar' } }),
          { foo: 'bar' });
      });

      it('is combined with `base`', function() {
        var headers = request.buildHeaders(
          ['foo', '---', 'baz', 'qux'],
          { headers: { 'foo': 'bar', 'quux': 'corge' } });
        assert.deepEqual(headers,
          { baz: 'qux', foo: 'bar', quux: 'corge' });
      });
    });
  });

  describe('#buildBody(options)', function() {
    function throwsError(options, message) {
      it('throws a `TypeError`', function() {
        assert.throws(function() {
          return request.buildBody(options);
        }, TypeError, message);
      });
    }

    describe('with `options.stream`', function() {
      describe('is falsey', function() {
        throwsError(
          { stream: false },
          'Expected `stream` to be pipe()able.');
      });

      describe('does not have a pipe() function', function() {
        throwsError(
          { stream: { pipe: null } },
          'Expected `stream` to be pipe()able.');
      });

      describe('with `options.chunk` also passed', function() {
        throwsError(
          { stream: { pipe: function() {} }, chunk: true },
          'Unexpected `chunk` option when `stream` is present.');
      });

      describe('with `options.json` also passed', function() {
        throwsError(
          { stream: { pipe: function() {} }, json: true },
          'Unexpected `json` option when `stream` is present.');
      });

      describe('with `options.form` also passed', function() {
        throwsError(
          { stream: { pipe: function() {} }, form: true },
          'Unexpected `form` option when `stream` is present.');
      });

      it('returns a wrapped stream', function() {
        var stream = { pipe: function() {} };
        var options = { stream: stream };
        var result = request.buildBody(options);
        assert.notEqual(result, options);
        assert.strictEqual(result.stream, stream);
      });
    });

    describe('`options.chunk`', function() {
      describe('not a buffer', function() {
        throwsError(
          { chunk: 'foo' },
          'Expected `chunk` to be a buffer.');
      });

      describe('with `options.json` also passed', function() {
        throwsError(
          { chunk: new Buffer(''), json: true },
          'Unexpected `json` option when `chunk` is present.');
      });

      describe('with `options.form` also passed', function() {
        throwsError(
          { chunk: new Buffer(''), form: true },
          'Unexpected `form` option when `chunk` is present.');
      });

      it('returns a wrapped chunk', function() {
        var chunk = new Buffer('');
        var options = { chunk: chunk };
        var result = request.buildBody(options);
        assert.notEqual(result, options);
        assert.strictEqual(result.chunk, chunk);
      });
    });

    describe('`options.json`', function() {
      describe('is `undefined`', function() {
        throwsError(
          { json: undefined },
          'Unexpected undefined value for `json`.');
      });

      describe('with `options.form` also passed', function() {
        throwsError(
          { json: true, form: true },
          'Unexpected `form` option when `json` is present.');
      });

      describe('with no `content-type` header set', function() {
        it('sets the default JSON content type', function() {
          request.DEFAULT_JSON_CONTENT_TYPE = sentinels.foo;
          request.buildBody({ json: true });
          assert.matchingSentinels(
            request.headers['content-type'], sentinels.foo);
        });
      });

      describe('with `content-type` header already set', function() {
        it('doesn’t override existing content type', function() {
          request.DEFAULT_JSON_CONTENT_TYPE = sentinels.foo;
          request.headers['content-type'] = sentinels.bar;
          request.buildBody({ json: true });
          assert.matchingSentinels(
            request.headers['content-type'], sentinels.bar);
        });
      });

      it('returns a wrapped chunk of stringified JSON', function() {
        var result = request.buildBody({ json: true });
        assert.property(result, 'chunk');
        assert.instanceOf(result.chunk, Buffer);
        assert.equal(result.chunk.toString('utf8'), 'true');
      });
    });

    describe('with `options.form`', function() {
      describe('is falsey', function() {
        throwsError(
          { form: false },
          'Expected `form` to be an object.');
      });

      describe('not an object', function() {
        throwsError(
          { form: '42' },
          'Expected `form` to be an object.');
      });

      describe('with no `content-type` header set', function() {
        it('sets the default Form content type', function() {
          request.DEFAULT_FORM_CONTENT_TYPE = sentinels.foo;
          request.buildBody({ form: {} });
          assert.matchingSentinels(
            request.headers['content-type'], sentinels.foo);
        });
      });

      describe('with `content-type` header already set', function() {
        it('doesn’t override existing content type', function() {
          request.DEFAULT_FORM_CONTENT_TYPE = sentinels.foo;
          request.headers['content-type'] = sentinels.bar;
          request.buildBody({ form: {} });
          assert.matchingSentinels(
            request.headers['content-type'], sentinels.bar);
        });
      });

      it('encodes the form using #buildQueryPairs()', function() {
        var spy = sinon.spy(request, 'buildQueryPairs');
        request.buildBody({ form: sentinels.foo });
        assert.calledOnce(spy);
        assert.calledWithMatch(spy,
            sinon.match.array, sinon.match.same(sentinels.foo));
      });

      it('returns a wrapped chunk of the encoded form', function() {
        var wrapped = request.buildBody({ form: { foo: 'bar', baz: 'qux' } });
        assert.property(wrapped, 'chunk');
        assert.instanceOf(wrapped.chunk, Buffer);
        assert.equal(wrapped.chunk.toString('utf8'), 'foo=bar&baz=qux');
      });
    });

    describe('without any options', function() {
      it('returns `null`', function() {
        assert.isNull(request.buildBody({}));
      });
    });
  });

  describe('#buildAuth(auth, options)', function() {
    describe('without an `auth` option', function() {
      it('returns `auth` as-is', function() {
        assert.matchingSentinels(
          request.buildAuth(sentinels.foo, {}), sentinels.foo);
      });
    });

    describe('with an `auth` option', function() {
      it('returns `options.auth` as-is', function() {
        assert.matchingSentinels(
          request.buildAuth(sentinels.foo, { auth: sentinels.bar }),
          sentinels.bar);
      });
    });
  });
});
