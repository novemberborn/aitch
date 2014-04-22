'use strict';

var sinon = require('sinon');

var BaseClient = require('../').BaseClient;
var validationHelpers = require('../').validationHelpers;

describe('BaseClient', function() {
  function throwsError(options, message) {
    it('throws a `TypeError`', function() {
      assert.throws(function() {
        return new BaseClient(options);
      }, TypeError, message);
    });
  }

  function makeOption(name, value) {
    var options = {};
    options[name] = value;
    return options;
  }

  function withTransport(options, base) {
    base = base || {};
    if (!base.transport) {
      base.transport = {};
    }

    var obj = Object.create(base);
    BaseClient.call(obj, options);
    return obj;
  }

  var client, mockTransport;
  beforeEach(function() {
    mockTransport = sinon.mock({ issueRequest: function() {} });
    client = new BaseClient({ transport: mockTransport.object });
  });

  describe('BaseClient([options]) constructor', function() {
    describe('`options` is truey, but not an object', function() {
      throwsError('42', 'Expected `options` to be an object.');
    });

    describe('`pathname` option', function() {
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
    });

    ['query', 'headers', 'transport'].forEach(function(name) {
      describe('`' + name + '` option', function() {
        describe('is falsey', function() {
          throwsError(
            makeOption(name, null),
            'Expected `' + name + '` to be an object.');
        });

        describe('is not an object', function() {
          throwsError(
            makeOption(name, '42'),
            'Expected `' + name + '` to be an object.');
        });
      });
    });

    describe('`pathname` property', function() {
      describe('specified in options', function() {
        it('is set to `options.pathname`', function() {
          assert.property(
            withTransport({ pathname: '/foo' }), 'pathname', '/foo');
        });
      });

      describe('already exists on the instance', function() {
        it('is set to the existing value', function() {
          assert.property(
            withTransport(null, { pathname: '/foo' }), 'pathname', '/foo');
        });

        it('is an own-property', function() {
          var t = withTransport(null, { pathname: '/foo' });
          assert.isTrue(t.hasOwnProperty('pathname'));
        });
      });

      describe('does not exist and is not specified', function() {
        it('defaults to `/`', function() {
          assert.property(withTransport(), 'pathname', '/');
        });
      });
    });

    [
      { name: 'query', normalizer: '_normalizeQuery' },
      { name: 'headers', normalizer: '_normalizeHeaders' },
    ].forEach(function(subject) {
      var name = subject.name;
      var normalizer = subject.normalizer;

      describe('`' + name + '` property', function() {
        var fakeInstance;
        beforeEach(function() {
          fakeInstance = sinon.mock({});
          fakeInstance.object[normalizer] = function() {};
        });

        describe('specified in options', function() {
          describe('and already exists on the instance', function() {
            describe('`options.' + name + '`', function() {
              it('is normalized', function() {
                fakeInstance.object[name] = [];
                fakeInstance.expects(normalizer)
                  .once().calledWithExactly(sentinels.foo);

                withTransport(
                  makeOption(name, sentinels.foo), fakeInstance.object);

                fakeInstance.verify();
              });

              describe('once normalized', function() {
                it('is concatenated with the existing value', function() {
                  var expected = sentinels.stubArray();
                  var existing = expected.slice();
                  fakeInstance.object[name] = existing;
                  fakeInstance.expects(normalizer)
                    .once().returns([existing.pop()]);

                  var client = withTransport(
                    makeOption(name, {}), fakeInstance.object);
                  assert.matchingSentinels(client[name], expected);
                });
              });
            });
          });

          describe('and does not exists on the instance', function() {
            describe('`options.' + name + '`', function() {
              it('is normalized', function() {
                fakeInstance.expects(normalizer)
                  .once().calledWithExactly(sentinels.foo);

                withTransport(
                  makeOption(name, sentinels.foo), fakeInstance.object);

                fakeInstance.verify();
              });

              describe('once normalized', function() {
                it('is assigned to `' + name + '`', function() {
                  fakeInstance.expects(normalizer)
                    .once().returns(sentinels.foo);

                  var client = withTransport(
                    makeOption(name, {}), fakeInstance.object);
                  assert.matchingSentinels(client[name], sentinels.foo);
                });
              });
            });
          });

          describe('not specified in options', function() {
            describe('but exists on the instance', function() {
              it('assigns a copy of the existing value to `' + name + '`',
                function() {
                  var existing = sentinels.stubArray();
                  var client = withTransport(
                    null, makeOption(name, existing));
                  var value = client[name];

                  assert.notStrictEqual(value, existing);
                  assert.matchingSentinels(value, existing);
                });
            });

            describe('does not exist on the instance', function() {
              it('assigns an empty array to `' + name + '`', function() {
                assert.deepEqual(withTransport()[name], []);
              });
            });
          });
        });
      });
    });

    describe('`auth` property', function() {
      describe('specified in options', function() {
        describe('`options.auth`', function() {
          it('is assigned to `auth`', function() {
            assert.matchingSentinels(
              withTransport({ auth: sentinels.foo }).auth,
              sentinels.foo);
          });
        });
      });

      describe('not specified in options', function() {
        it('assigns `auth` to itself', function() {
          var client = withTransport(null, { auth: sentinels.foo });
          assert.matchingSentinels(client.auth, sentinels.foo);
          assert.isTrue(client.hasOwnProperty('auth'));
        });
      });
    });

    describe('`transport` property', function() {
      describe('specified in options', function() {
        describe('`options.transport`', function() {
          it('is assigned to `transport`', function() {
            assert.matchingSentinels(
              withTransport({ transport: sentinels.foo }).transport,
              sentinels.foo);
          });
        });
      });

      describe('not specified in options', function() {
        it('assigns `transport` to itself', function() {
          var client = withTransport(null, { transport: sentinels.foo });
          assert.matchingSentinels(client.transport, sentinels.foo);
          assert.isTrue(client.hasOwnProperty('transport'));
        });
      });

      describe('is a falsey value', function() {
        throwsError('transport', null);
      });
    });
  });

  describe('#_normalizeQuery(query)', function() {
    var stub;
    beforeEach(function() {
      stub = sinon.stub(validationHelpers, 'castQueryValue').returnsArg(0);
    });
    afterEach(function() {
      stub.restore();
    });

    describe('`query` contains a property with an empty name', function() {
      it('throws a `TypeError`', function() {
        assert.throws(function() {
          client._normalizeQuery({ '': true });
        }, TypeError, 'Unexpected empty param name.');
      });
    });

    it('validates values from `query`', function() {
      client._normalizeQuery({ foo: 'bar' });

      assert.calledOnce(stub);
      assert.calledWithExactly(stub, 'bar', 'foo');
    });

    it('creates a list of params and values', function() {
      assert.deepEqual(client._normalizeQuery({ foo: 'bar' }), ['foo', 'bar']);
    });
  });

  describe('#_normalizeHeaders(headers)', function() {
    var stub;
    beforeEach(function() {
      stub = sinon.stub(validationHelpers, 'castHeaderValue').returnsArg(0);
    });
    afterEach(function() {
      stub.restore();
    });

    describe('`headers` contains a property with an empty name', function() {
      it('throws a `TypeError`', function() {
        assert.throws(function() {
          client._normalizeHeaders({ '': true });
        }, TypeError, 'Unexpected empty header name.');
      });
    });

    describe('`headers` contains a duplicate, case-insensitive property names',
      function() {
        it('throws a `TypeError`', function() {
          assert.throws(function() {
            client._normalizeHeaders({ foo: 'bar', FOO: 'baz' });
          }, TypeError, 'Unexpected duplicate `FOO` header.');
        });
      });

    it('validates values from `headers`', function() {
      client._normalizeHeaders({ host: 'foo' });

      assert.calledOnce(stub);
      assert.calledWithExactly(stub, 'foo', 'host');
    });

    it('creates a list of lowercased headers and values', function() {
      assert.deepEqual(
          client._normalizeHeaders({ host: 'foo', BAR: 'qux' }),
          ['host', 'foo', 'bar', 'qux']);
    });
  });

  describe('#_issueRequest(method, [options])', function() {
    var stubbedRequest;
    beforeEach(function() {
      stubbedRequest = sinon.stub(client, 'Request');
    });

    it('constructs a new Request instance', function() {
      client._issueRequest(sentinels.foo, sentinels.bar);
      assert.calledOnce(stubbedRequest);
      assert.calledWithExactly(stubbedRequest,
        client, sentinels.foo, sentinels.bar);
    });

    describe('if called without `options`', function() {
      it('defaults `options` to an empty object', function() {
        client._issueRequest(sentinels.foo);
        assert.calledOnce(stubbedRequest);
        assert.calledWithExactly(stubbedRequest,
          client, sentinels.foo, sinon.match.object);
      });
    });

    it('uses the transport to issue the request', function() {
      stubbedRequest.returns(sentinels.foo);
      client.Response = sentinels.bar;
      mockTransport.expects('issueRequest')
        .once()
        .withArgs(sentinels.foo, sentinels.bar)
        .returns(sentinels.baz);

      var result = client._issueRequest();
      assert.matchingSentinels(result, sentinels.baz);
      mockTransport.verify();
    });
  });
});
