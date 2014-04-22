'use strict';

var https = require('https');

var sinon = require('sinon');

var UnencryptedTransport = require('../').UnencryptedTransport;
var Transport = require('../').Transport;

describe('Transport', function() {
  function makeTransport(options, base) {
    base = base || {};
    var obj = Object.create(base);
    Transport.call(obj, options);
    return obj;
  }

  it('extends UnencryptedTransport', function() {
    assert.instanceOf(new Transport(), UnencryptedTransport);
  });

  describe('Transport([options]) constructor', function() {
    var callSpy;
    beforeEach(function() {
      callSpy = sinon.spy(UnencryptedTransport, 'call');
    });
    afterEach(function() {
      callSpy.restore();
    });

    it('calls UnencryptedTransport, passing `options`', function() {
      var thisArg = new sentinels.Sentinel('thisArg');
      Transport.call(thisArg, sentinels.foo);

      assert.calledOnce(callSpy);
      assert.calledWithExactly(callSpy, thisArg, sentinels.foo);
    });

    describe('`tls` option', function() {
      function throwsError(options, message) {
        it('throws a `TypeError`', function() {
          assert.throws(function() {
            return new Transport(options);
          }, TypeError, message);
        });
      }

      describe('`agent` option is not false', function() {
        throwsError(
          { agent: true, tls: {} },
          'Unexpected `tls`, `agent` is not `false`.');
      });

      describe('is falsey', function() {
        throwsError(
          { agent: false, tls: null },
          'Expected `tls` to be an object.');
      });

      describe('is not an object', function() {
        throwsError(
          { agent: false, tls: '42' },
          'Expected `tls` to be an object.');
      });
    });
  });

  describe('`port` property', function() {
    describe('not specified in options', function() {
      describe('already exists on the instance', function() {
        it('is set to the existing value', function() {
          assert.property(
            makeTransport(null, { port: sentinels.foo }),
            'port',
            sentinels.foo
          );
        });
      });

      describe('does not exist', function() {
        it('defaults to `443`', function() {
          assert.property(makeTransport(), 'port', 443);
        });
      });
    });
  });

  describe('`tls` property', function() {
    describe('specified in options', function() {
      it('is set to `options.tls`', function() {
        assert.property(
          makeTransport({ agent: false }, { tls: sentinels.foo }),
          'tls',
          sentinels.foo);
      });
    });

    describe('already exists on the instance', function() {
      it('is set to the existing value', function() {
        assert.property(
          makeTransport({ agent: false }, { tls: sentinels.foo }),
          'tls',
          sentinels.foo);
      });

      it('is an own-property', function() {
        var t = makeTransport({ agent: false }, { tls: sentinels.foo });
        assert.isTrue(t.hasOwnProperty('tls'));
      });
    });

    describe('does not exist and is not specified', function() {
      it('defaults to `null`', function() {
        assert.isNull(makeTransport().tls);
      });
    });
  });

  describe('#_makeRequest(options)', function() {
    var stub;
    beforeEach(function() {
      stub = sinon.stub(https, 'request').returns(sentinels.bar);
    });
    afterEach(function() {
      stub.restore();
    });

    it('relies on `https.request()`', function() {
      var result = new Transport()._makeRequest(sentinels.foo);

      assert.calledOnce(stub);
      assert.calledWithExactly(stub, sentinels.foo);
      assert.matchingSentinels(result, sentinels.bar);
    });

    describe('with `tls` specified', function() {
      it('mixes the `tls` object onto `options`', function() {
        var transport = new Transport({
          agent: false,
          tls: {
            pfx: new sentinels.Sentinel('pfx'),
            key: new sentinels.Sentinel('key'),
            passphrase: new sentinels.Sentinel('passphrase'),
            cert: new sentinels.Sentinel('cert'),
            ca: new sentinels.Sentinel('ca'),
            ciphers: new sentinels.Sentinel('ciphers'),
            rejectUnauthorized: new sentinels.Sentinel('rejectUnauthorized'),
            secureProtocol: new sentinels.Sentinel('secureProtocol')
          }
        });

        var options = {};
        transport._makeRequest(options);

        assert.matchingSentinels(options, transport.tls);
      });
    });
  });
});
