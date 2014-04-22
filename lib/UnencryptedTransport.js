'use strict';

var http = require('http');
var Promise = require('legendary').Promise;

var hop = {}.hasOwnProperty;

// # UnencryptedTransport([options])

// Manages the connection to the service, issuing requests against it. Relies on
// Node's `http` module for the actual connections.
function UnencryptedTransport(options) {
  // ## Options
  var hostname = this.hostname || 'localhost';
  var port = this.port || 80;
  var agent = this.agent;

  if (options) {
    if (typeof options !== 'object') {
      // Throws a `TypeError` instance if options is provided, but is not an
      // object.
      throw new TypeError('Expected `options` to be an object.');
    }

    // ### `hostname`

    // Sets the `hostname` property.
    if (hop.call(options, 'hostname')) {
      hostname = options.hostname;
    }

    // ### `port`

    // Sets the `port` property.
    if (hop.call(options, 'port')) {
      port = options.port;
    }

    // ### `agent`

    // Sets the `agent` property. Passed to Node's `http` module.
    if (hop.call(options, 'agent')) {
      agent = options.agent;
    }
  }

  // ## UnencryptedTransport#hostname

  // The domain or IP address of the service endpoint. Defaults to `localhost`.

  // Subclasses can set a default value on the prototype or instance before the
  // base constructor is called.
  this.hostname = hostname;

  // ## UnencryptedTransport#port

  // The port the service is listening on. Defaults to `80`.

  // Subclasses can set a default value on the prototype or instance before the
  // base constructor is called.
  this.port = port;

  // ## UnencryptedTransport#agent

  // Controls agent behavior.

  // Subclasses can set a default value on the prototype or instance before the
  // base constructor is called.
  this.agent = agent;
}

module.exports = UnencryptedTransport;

// ## UnencryptedTransport#_makeRequest(options)

// Calls out to Node's `http` module to make a `ClientRequest` instance. Can
// be overriden, for instance [`SslTransport`](./SslTransport.js.html) changes
// this method to use the `https` module.

// Expects to be called with an `options` object containing `hostname`, `port`,
// `agent`, `method`, `path`, `headers` and `auth` properties.
UnencryptedTransport.prototype._makeRequest = function(options) {
  return http.request(options);
};

// ## UnencryptedTransport#issueRequest(descriptor, [Response])

// Issues a request against the connected service. Expects the `descriptior`
// object to have `method`, `path`, `headers` and `auth` properties.

// Expects `Response` to be a promise constructor, defaults to
// [Legendary](https://github.com/novemberborn/legendary)'s
// [`Promise`](http://novemberborn.github.io/legendary/lib/promise.js.html).

// Returns a promise for the service response. If the request emits an `error`
// event, the promise is rejected with that error. If the promise is cancelled
// the request is aborted.
UnencryptedTransport.prototype.issueRequest = function(descriptor, Response) {
  if (!Response) {
    Response = Promise;
  }

  var request = this._makeRequest({
    hostname: this.hostname,
    port: this.port,
    agent: this.agent,
    method: descriptor.method,
    path: descriptor.path,
    headers: descriptor.headers,
    auth: descriptor.auth
  });

  return new Response(function(resolve, reject) {
    request.on('response', resolve);
    request.on('error', reject);

    // If the `descriptor` contains a `body` object with a `stream` property,
    // that stream is piped to the request. Or if it contains a `chunk`
    // property, that buffer is written to the request. Else the request is
    // closed immediately.
    if (descriptor.body) {
      if (descriptor.body.stream) {
        descriptor.body.stream.pipe(request);
      } else {
        request.end(descriptor.body.chunk);
      }
    } else {
      request.end();
    }

    return function() {
      request.removeListener('response', resolve);
      request.removeListener('error', reject);
      request.abort();
    };
  });
};
