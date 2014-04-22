'use strict';

var BaseClient = require('./BaseClient');
var util = require('util');

// # Client([options])

// Generic HTTP client with helper methods to make requests. Extends
// [`BaseClient`](./BaseClient.js.html).
function Client(options) {
  BaseClient.call(this, options);
}

util.inherits(Client, BaseClient);

module.exports = Client;

// ## Client#request(method, [options])

// Make a request. Set `method` to be any HTTP method, as understood by the
// configured transport. Returns a [`Response`](./Response.js.html) promise.

// For documentation on `options` see the [`Request`](./Request.js.html) class.
Client.prototype.request = function(method, options) {
  return this._issueRequest(method, options);
};

// ## Client#head([options])

// Make a `HEAD` request. Returns a `Response` promise.
Client.prototype.head = function(options) {
  return this._issueRequest('HEAD', options);
};

// ## Client#get([options])

// Make a `GET` request. Returns a `Response` promise.
Client.prototype.get = function(options) {
  return this._issueRequest('GET', options);
};

// ## Client#delete([options])

// Make a `DELETE` request. Returns a `Response` promise.
Client.prototype.delete = function(options) {
  return this._issueRequest('DELETE', options);
};

// ## Client#put([options])

// Make a `PUT` request. Returns a `Response` promise.
Client.prototype.put = function(options) {
  return this._issueRequest('PUT', options);
};

// ## Client#post([options])

// Make a `POST` request. Returns a `Response` promise.
Client.prototype.post = function(options) {
  return this._issueRequest('POST', options);
};

// ## Client#patch([options])

// Make a `PATCH` request. Returns a `Response` promise.
Client.prototype.patch = function(options) {
  return this._issueRequest('PATCH', options);
};
