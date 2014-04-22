'use strict';

var Request = require('./Request');
var Response = require('./Response');
var validationHelpers = require('./validation-helpers');

var hop = {}.hasOwnProperty;

// # BaseClient([options])

// Base class for service clients. Unlike [`Client`](./Client.js.html) does not
// provide any public methods so subclasses can declare them as they like,
// without having to override say a `get()` method.

// Throws `TypeError` instances if illegal options are provided.
function BaseClient(options) {
  // ## Options
  var pathname, query, headers, overrideAuth, auth, transport;
  if (options) {
    // Configure a client when it's instantiated. If provided it must be an
    // object. Only own-properties are considered.
    if (typeof options !== 'object') {
      throw new TypeError('Expected `options` to be an object.');
    }

    // ### `pathname`

    // Sets the `pathname` property. If given it must be a non-empty string.
    // Cannot contain a `?` search component, use the `query` option instead.
    if (hop.call(options, 'pathname')) {
      if (typeof options.pathname !== 'string' || options.pathname === '') {
        throw new TypeError('Expected `pathname` to be a non-empty string.');
      } else if (~options.pathname.indexOf('?')) {
        throw new TypeError('`pathname` cannot contain `?`.');
      }
      pathname = options.pathname;
    }

    // ### `query`

    // Updates the `query` parameter list. Optional, but if given it must be an
    // object. Only own-properties are considered as parameters.

    // Parameter names must not be empty strings. Values can be strings, finite
    // numbers, and booleans. They'll be cast to strings if necessary.
    if (hop.call(options, 'query')) {
      if (!options.query || typeof options.query !== 'object') {
        throw new TypeError('Expected `query` to be an object.');
      }
      query = options.query;
    }

    // ### `headers`

    // Updates the `headers` list. Optional, but if given it must be an object.
    // Only own-properties are considered as headers.

    // Header names are downcased and may not be the same as other downcased
    // names. They must not be empty strings either.

    // Values can be strings, finite numbers, and booleans. They'll be cast to
    // strings if necessary. Values may be arrays, in which case each item will
    // still need to be a string, finite number, or boolean. Again they'll be
    // cast to strings if necessary. Array values are not allowed to include
    // other arrays.
    if (hop.call(options, 'headers')) {
      if (!options.headers || typeof options.headers !== 'object') {
        throw new TypeError('Expected `headers` to be an object.');
      }
      headers = options.headers;
    }

    // ### `auth`

    // Sets the `auth` property. If provided will override any existing default.
    overrideAuth = hop.call(options, 'auth');
    auth = options.auth;

    // ### `transport`

    // Sets the `transport` property. Optional only if the client class provides
    // a default transport. Must be an object, but other methods are not
    // checked.
    if (hop.call(options, 'transport')) {
      if (!options.transport || typeof options.transport !== 'object') {
        throw new TypeError('Expected `transport` to be an object.');
      }
      transport = options.transport;
    }
  }

  // ## BaseClient#pathname

  // The remote path. Subclasses can set a default value on the prototype or
  // instance before the base constructor is called. Such values *must not*
  // include a query component. Defaults to `/`.
  this.pathname = pathname || this.pathname || '/';

  // ## BaseClient#query

  // Flat list of parameters and values, e.g. `['foo', 'bar', 'baz', 'thud']`
  // would correspond to `foo=bar&baz=thud`.

  // Subclasses can set an initial value on the prototype or instances before
  // the base constructor is called. The `query` option is then *added* to this
  // initial value. This can lead to duplicate parameters. Exactly how these
  // are sent to the service depends on the behavior of the `Request` class.

  // When setting the initial value make sure the parameter names are non-empty
  // strings and the values are strings.
  if (query) {
    if (this.query) {
      this.query = this.query.concat(this._normalizeQuery(query));
    } else {
      this.query = this._normalizeQuery(query);
    }
  } else if (this.query) {
    // To be safe, the initial `query` list is never used directly.
    this.query = this.query.slice();
  } else {
    this.query = [];
  }

  // ## BaseClient#headers

  // Flat list of headers and values, e.g. `['content-type', 'text/plain']`
  // would correspond to a `content-type: text/plain` header.

  // Subclasses can set an initial value on the prototype or instance before the
  // base constructor is called. The `headers` option is then *added* to this
  // initial value. This can lead to duplicate headers. Exactly how these
  // are sent to the service depends on the behavior of the `Request` class.

  // When setting the initial value make sure the header names are non-empty,
  // downcased strings and the values are strings, or flat arrays containing
  // just strings.
  if (headers) {
    if (this.headers) {
      this.headers = this.headers.concat(this._normalizeHeaders(headers));
    } else {
      this.headers = this._normalizeHeaders(headers);
    }
  } else if (this.headers) {
    // To be safe, the initial `headers` list is never used directly.
    this.headers = this.headers.slice();
  } else {
    this.headers = [];
  }

  // ## BaseClient#auth

  // Credential for authenticating with the service. Its format depends on the
  // behavior of the `Request` class, which is responsible for including it in
  // the request issued against the service.

  // Subclasses can set a default value on the prototype or instance before the
  // base constructor is called. The `auth` option will override this default
  // value.
  if (overrideAuth) {
    this.auth = auth;
  } else {
    this.auth = this.auth;
  }

  // ## BaseClient#transport

  // An instance of a transport class, e.g.
  // [`SslTransport`](./SslTransport.js.html), responsible for issuing the
  // request against the service.
  if (transport) {
    this.transport = transport;
  } else {
    this.transport = this.transport;
  }
  if (!this.transport) {
    throw new TypeError('Expected `transport` option.');
  }
}

module.exports = BaseClient;

// ## BaseClient#Request

// Class used to describe requests that are to be issued against the service.
// Defaults to [`Request`](./Request.js.html).
BaseClient.prototype.Request = Request;

// ## BaseClient#Response

// Promise subclass for a service response. Defaults to
// [`Response`](./Response.js.html).
BaseClient.prototype.Response = Response;

// ## BaseClient#_normalizeQuery(query)

// Converts `query`'s own-properties and values into a flat list of alternating
// property names and values. Validates that the the names are not empty;
// validates the values and casts them to strings if necessary.

// Throws `TypeError` instances for validation errors.
BaseClient.prototype._normalizeQuery = function(query) {
  return Object.keys(query).reduce(function(result, p) {
    if (!p) {
      throw new TypeError('Unexpected empty param name.');
    }

    result.push(p, validationHelpers.castQueryValue(query[p], p));
    return result;
  }, []);
};

// ## BaseClient#_normalizeHeaders(headers)

// Converts `headers`' own-properties and values into a flat list of alternating
// property names and values. First downcases the property names and checks
// against other names in the same `headers` object in case there are
// case-insensitive duplicates. Validates that the the names are not empty;
// validates the values and casts them to strings if necessary.

// Throws `TypeError` instances for validation errors.
BaseClient.prototype._normalizeHeaders = function(headers) {
  var encountered = {};
  return Object.keys(headers).reduce(function(result, h) {
    if (!h) {
      throw new TypeError('Unexpected empty header name.');
    }

    var lowercased = h.toLowerCase();
    if (hop.call(encountered, lowercased)) {
      throw new TypeError('Unexpected duplicate `' + h + '` header.');
    }
    encountered[lowercased] = true;

    result.push(lowercased, validationHelpers.castHeaderValue(headers[h], h));
    return result;
  }, []);
};

// ## BaseClient#_issueRequest(method, [options])

// Constructs and issues a request using the `.transport`.

// For documentation on `options` see the [`Request`](./Request.js.html) class.
BaseClient.prototype._issueRequest = function(method, options) {
  return this.transport.issueRequest(
    new this.Request(this, method, options || {}), this.Response);
};
