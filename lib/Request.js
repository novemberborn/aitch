'use strict';

var validationHelpers = require('./validation-helpers');

var hop = {}.hasOwnProperty;

// # Request(client, method, options)

// Describes a request.

// `client` should be a [`BaseClient`](./BaseClient.js.html) instance.

// `method` can be any HTTP method, as understood by the transport responsible
// for actually issuing the request.

// Throws `TypeError` instances if illegal options are provided.

// ## Options

// ### `pathname`

// Overrides `client.pathname`. If given must be a non-empty string. Cannot
// contain a `?` search component, use the `query` option instead.

// ### `query`

// Mixes with `client.query`. If given, parameters from this option will replace
// those specified in the client.

// Parameter names must not be empty strings. Values can be strings, finite
// numbers, and booleans. They'll be cast to strings if necessary.

// ### `headers`

// Mixes with `client.headers`. If given, headers from this option will replace
// those specified in the client.

// Header names are downcased and may not be the same as other downcased
// names. They must not be empty strings either.

// Values can be strings, finite numbers, and booleans. They'll be cast to
// strings if necessary. Values may be arrays, in which case each item will
// still need to be a string, finite number, or boolean. Again they'll be
// cast to strings if necessary. Array values are not allowed to include
// other arrays.

// ### `auth`

// Overrides `client.auth`.

// ### Body options

// Only one of `stream`, `chunk`, `json` and `form` can be provided. Note that
// whether a body should be provided depends on the HTTP method used.

// #### `stream`

// Provides a stream that can be piped to the service. Must be an object with a
// `pipe` method.

// #### `chunk`

// Provides a single `Buffer` instance that can be written to the service.

// #### `json`

// Provides a value that can be converted to JSON and sent to the service
// using `utf8` encoding. If no `content-type` header is set, will set one
// according to `Request#DEFAULT_JSON_CONTENT_TYPE`.

// #### `form`

// Provides an object that can be URL-encoded and sent to the service using
// `utf8` encoding. If no `content-type` header is set, will set one according
// to `Request#DEFAULT_FORM_CONTENT_TYPE`.

// Parameter names must not be empty strings. Values can be strings, finite
// numbers, and booleans. They'll be cast to strings if necessary.

function Request(client, method, options) {
  // ## Request#method

  // HTTP method.
  this.method = method;

  // ## Request#path

  // Path value, consisting of a `pathname` and an optional search component.
  this.path = this.buildPath(client.pathname, client.query, options);

  // ## Request#headers

  // Headers object. All keys will are lowercased.
  this.headers = this.buildHeaders(client.headers, options);

  // ## Request#body

  // Body object. `null` if no body needs to be sent to the service. Has either
  // a `stream` property, containing a stream that can be piped, or a `chunk`
  // property, containing a `Buffer` instance.
  this.body = this.buildBody(options);

  // ## Request#auth

  // Authorization credential.
  this.auth = this.buildAuth(client.auth, options);
}

module.exports = Request;

// ## Request#DEFAULT_JSON_CONTENT_TYPE

// Default `content-type` header for JSON bodies.
Request.prototype.DEFAULT_JSON_CONTENT_TYPE =
  'application/json; charset=utf-8';

// ## Request#DEFAULT_FORM_CONTENT_TYPE

// Default `content-type` header for form bodies.
Request.prototype.DEFAULT_FORM_CONTENT_TYPE =
  'application/x-www-form-urlencoded; charset=utf-8';

// ## Request#buildPath(defaultPathname, baseQuery, options)

// Builds the `path`. If provided, `options.pathname` is used, otherwise
// `defaultPathname`. Combines `options.query` with `baseQuery` for the search
// component.

// Throws `TypeError` instances if illegal options are provided.
Request.prototype.buildPath = function(defaultPathname, baseQuery, options) {
  var path;
  if (hop.call(options, 'pathname')) {
    if (typeof options.pathname !== 'string' || options.pathname === '') {
      throw new TypeError('Expected `pathname` to be a non-empty string.');
    }
    path = options.pathname;
  } else {
    path = defaultPathname;
  }
  if (~path.indexOf('?')) {
    throw new TypeError('`pathname` cannot contain `?`.');
  }

  if (hop.call(options, 'query') &&
      (!options.query || typeof options.query !== 'object')) {
    throw new TypeError('Expected `query` to be an object.');
  }
  var pairs = this.buildQueryPairs(baseQuery, options.query);
  if (pairs.length) {
    path += '?' + pairs.join('&');
  }

  return path;
};

// ## Request#buildQueryPairs(base, [query])

// Builds a flat list of alternating parameters and values. `base` is expected
// to be the initial list, `query` an optional object that augments or overrides
// the base parameters.

// Throws `TypeError` instances if illegal options are provided.
Request.prototype.buildQueryPairs = function(base, query) {
  var pairs = [];
  for (var i = 0, l = base.length; i < l; i += 2) {
    var p = base[i], v = base[i + 1];
    if (!query || !hop.call(query, p)) {
      pairs.push(encodeURIComponent(p) + '=' + encodeURIComponent(v));
    }
  }

  if (query) {
    Object.keys(query).forEach(function(p) {
      if (!p) {
        throw new TypeError('Unexpected empty param name.');
      }

      var v = validationHelpers.castQueryValue(query[p], p);
      pairs.push(encodeURIComponent(p) + '=' + encodeURIComponent(v));
    });
  }

  return pairs;
};

// ## Request#buildHeaders(base, options)

// Builds an object of all headers. `base` is expected to be the initial list,
// `options` can optionally contain a `headers` object that augments or
// overrides the base headers.

// Throws `TypeError` instances if illegal options are provided.
Request.prototype.buildHeaders = function(base, options) {
  var headers = {};

  if (hop.call(options, 'headers')) {
    if (!options.headers || typeof options.headers !== 'object') {
      throw new TypeError('Expected `headers` to be an object.');
    }

    var extra = options.headers;
    Object.keys(extra).forEach(function(h) {
      if (!h) {
        throw new TypeError('Unexpected empty header name.');
      }

      var lowercased = h.toLowerCase();
      if (hop.call(headers, lowercased)) {
        throw new TypeError('Unexpected duplicate `' + h + '` header.');
      }
      headers[lowercased] = validationHelpers.castHeaderValue(extra[h], h);
    });
  }

  for (var i = 0, l = base.length; i < l; i += 2) {
    if (!hop.call(headers, base[i])) {
      headers[base[i]] = base[i + 1];
    }
  }

  return headers;
};

// ## Request#buildBody(options)

// Builds an object describing the body. See the body options above.

// Throws `TypeError` instances if illegal options are provided.
Request.prototype.buildBody = function(options) {
  if (hop.call(options, 'stream')) {
    if (!options.stream || typeof options.stream.pipe !== 'function') {
      throw new TypeError('Expected `stream` to be pipe()able.');
    }
    if (hop.call(options, 'chunk')) {
      throw new TypeError(
          'Unexpected `chunk` option when `stream` is present.');
    }
    if (hop.call(options, 'json')) {
      throw new TypeError(
          'Unexpected `json` option when `stream` is present.');
    }
    if (hop.call(options, 'form')) {
      throw new TypeError(
          'Unexpected `form` option when `stream` is present.');
    }

    return { stream: options.stream };
  }

  if (hop.call(options, 'chunk')) {
    if (!Buffer.isBuffer(options.chunk)) {
      throw new TypeError('Expected `chunk` to be a buffer.');
    }
    if (hop.call(options, 'json')) {
      throw new TypeError(
          'Unexpected `json` option when `chunk` is present.');
    }
    if (hop.call(options, 'form')) {
      throw new TypeError(
          'Unexpected `form` option when `chunk` is present.');
    }

    return { chunk: options.chunk };
  }

  if (hop.call(options, 'json')) {
    if (typeof options.json === 'undefined') {
      throw new TypeError('Unexpected undefined value for `json`.');
    }
    if (hop.call(options, 'form')) {
      throw new TypeError('Unexpected `form` option when `json` is present.');
    }

    if (!hop.call(this.headers, 'content-type')) {
      this.headers['content-type'] = this.DEFAULT_JSON_CONTENT_TYPE;
    }

    return { chunk: new Buffer(JSON.stringify(options.json), 'utf8') };
  }

  if (hop.call(options, 'form')) {
    if (!options.form || typeof options.form !== 'object') {
      throw new TypeError('Expected `form` to be an object.');
    }

    if (!hop.call(this.headers, 'content-type')) {
      this.headers['content-type'] = this.DEFAULT_FORM_CONTENT_TYPE;
    }

    var pairs = this.buildQueryPairs([], options.form);
    return { chunk: new Buffer(pairs.join('&'), 'utf8') };
  }

  return null;
};

// ## Request#buildAuth(auth, options)

// Builds the authorization credential. Returns `options.auth` if provided, else
// just `auth`.
Request.prototype.buildAuth = function(auth, options) {
  return hop.call(options, 'auth') ? options.auth : auth;
};
