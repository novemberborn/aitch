'use strict';

var sinon = require('sinon');

var BaseClient = require('../').BaseClient;
var Client = require('../').Client;

describe('Client', function() {
  var client, stubbedIssueRequest;
  beforeEach(function() {
    client = new Client({ transport: {} });
    stubbedIssueRequest = sinon.stub(client, '_issueRequest');
  });

  it('extends BaseClient', function() {
    assert.instanceOf(client, BaseClient);
  });

  describe('Client([options]) constructor', function() {
    var callSpy;
    beforeEach(function() {
      callSpy = sinon.spy(BaseClient, 'call');
    });
    afterEach(function() {
      callSpy.restore();
    });

    it('calls BaseClient, passing `options`', function() {
      var thisArg = new sentinels.Sentinel({
        transport: {
          writable: true,
          value: {}
        }
      });
      Client.call(thisArg, sentinels.foo);

      assert.calledOnce(callSpy);
      assert.calledWithExactly(callSpy, thisArg, sentinels.foo);
    });
  });

  describe('#request(method, [options])', function() {
    it('wraps `_issueRequest(method, options)`', function() {
      stubbedIssueRequest.returns(sentinels.foo);

      var result = client.request(sentinels.bar, sentinels.baz);

      assert.calledOnce(stubbedIssueRequest);
      assert.calledWithExactly(
        stubbedIssueRequest, sentinels.bar, sentinels.baz);
      assert.matchingSentinels(result, sentinels.foo);
    });
  });

  ['head', 'get', 'delete', 'put', 'post', 'patch'].forEach(function(method) {
    var upper = method.toUpperCase();
    describe('#' + method + '([options])', function() {
      it('wraps `_issueRequest(\'' + upper + '\', options)`', function() {
        stubbedIssueRequest.returns(sentinels.foo);

        var result = client[method](sentinels.bar);

        assert.calledOnce(stubbedIssueRequest);
        assert.calledWithExactly(stubbedIssueRequest, upper, sentinels.bar);
        assert.matchingSentinels(result, sentinels.foo);
      });
    });
  });
});
