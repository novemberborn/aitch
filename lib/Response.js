'use strict';

var blessObject = require('legendary').blessObject;
var extendConstructor = require('legendary').extendConstructor;
var Promise = require('legendary').Promise;
var Thenstream = require('thenstream').Thenstream;

// # Response(executor)

// A subclass of [Legendary](https://github.com/novemberborn/legendary)'s
// [`Promise`](http://novemberborn.github.io/legendary/lib/promise.js.html) that
// represents a service response.

// Assumes the fulfillment value will be an `IncomingMessage` from Node's `http`
// module.
function Response(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError();
  }

  if (!(this instanceof Response)) {
    return new Response(executor);
  }

  if (executor !== blessObject) {
    blessObject(this, executor, true);
  }
}

module.exports = extendConstructor(Response);

function getStatusCode(r) {
  return r.statusCode;
}

function getHeaders(r) {
  return r.headers;
}

Object.defineProperties(Response.prototype, {
  // ## Response#statusCode

  // A Promise instance for the status code of the response.
  statusCode: {
    configurable: true,
    get: function() {
      if (!this._statusCode) {
        this._statusCode = this.then(getStatusCode).to(Promise);
      }
      return this._statusCode;
    }
  },

  // ## Response#headers

  // A Promise instance for the response headers.
  headers: {
    configurable: true,
    get: function() {
      if (!this._headers) {
        this._headers = this.then(getHeaders).to(Promise);
      }
      return this._headers;
    }
  },

  // ## Response#stream

  // A readable stream for the response body.
  stream: {
    configurable: true,
    get: function() {
      if (!this._stream) {
        this._stream = new Thenstream(this);
      }
      return this._stream;
    }
  }
});
