'use strict';

// # main

// ## BaseClient

// Base class for clients. [Read more](./BaseClient.js.html).
exports.BaseClient = require('./BaseClient');

// ## Client

// Generic HTTP client with helper methods to make requests.
// [Read more](./Client.js.html).
exports.Client = require('./Client');

// ## Request

// Internal class describing a request. [Read more](./Request.js.html).
exports.Request = require('./Request');

// ## Response

// Promise subclass for a service response. [Read more](./Response.js.html).
exports.Response = require('./Response');

// ## Transport

// Issues the request against a service, over HTTPS, returning a `Response`
// promise. [Read more](./Transport.js.html).
exports.Transport = require('./Transport');

// ## UnencryptedTransport

// Issues the request against a service, over HTTP, returning a `Response`
// promise. [Read more](./UnencryptedTransport.js.html).
exports.UnencryptedTransport = require('./UnencryptedTransport');

// ## validationHelpers

// Helper methods for dealing with header and query-parameter values.
// [Read more](./validation-helpers.js.html).
exports.validationHelpers = require('./validation-helpers');
