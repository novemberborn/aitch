'use strict';

var https = require('https');
var util = require('util');

var UnencryptedTransport = require('./UnencryptedTransport');

var hop = {}.hasOwnProperty;

// # Transport([options])

// Manages the connection to the service, issuing requests against it. Relies on
// Node's `https` module for the actual connections. Extends
// [`UnencryptedTransport`](./UnencryptedTransport.js.html).
function Transport(options) {
  // ## Transport#port

  // The port the service is listening on. Defaults to `443`.
  this.port = this.port || 443;
  this.tls = null;

  UnencryptedTransport.call(this, options);

  // ## Additional options

  // ### `tls`

  // Only if `agent` is `false`, set this to an object with the following
  // properties: `pfx`, `key`, `passphrase`, `cert`, `ca`, `ciphers`,
  // `rejectUnauthorized` and `secureProtocol`. Consult the [Node
  // documentation](http://nodejs.org/api/https.html#https_https_request_options_callback)
  // for details.

  if (options && hop.call(options, 'tls')) {
    if (this.agent !== false) {
      throw new TypeError('Unexpected `tls`, `agent` is not `false`.');
    }
    if (!options.tls || typeof options.tls !== 'object') {
      throw new TypeError('Expected `tls` to be an object.');
    }
    this.tls = options.tls;
  }
}

module.exports = Transport;

util.inherits(Transport, UnencryptedTransport);

// ## Transport#_makeRequest(options)

// Calls out to Node's `https` module to make a `ClientRequest` instance.

// Expects to be called with an `options` object containing `hostname`, `port`,
// `agent`, `method`, `path`, `headers` and `auth` properties.

// Will *add* any `tls` properties (`pfx`, `key`, `passphrase`, `cert`, `ca`,
// `ciphers`, `rejectUnauthorized` and `secureProtocol`) to `options`.
Transport.prototype._makeRequest = function(options) {
  if (this.tls) {
    options.pfx = this.tls.pfx;
    options.key = this.tls.key;
    options.passphrase = this.tls.passphrase;
    options.cert = this.tls.cert;
    options.ca = this.tls.ca;
    options.ciphers = this.tls.ciphers;
    options.rejectUnauthorized = this.tls.rejectUnauthorized;
    options.secureProtocol = this.tls.secureProtocol;
  }
  return https.request(options);
};
