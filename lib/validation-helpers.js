'use strict';

// # Validation Helpers

// Helper methods for dealing with header and query-parameter values.

// ## castHeaderValue(value, header, inArray)

// Casts finite numbers and boolean `value`s to a string. If `value` is an
// array, and `inArray` is false, do the same for each array item. Such arrays
// are not allowed to contain other arrays.

// Returns the cast value, or throws a `TypeError` instance if the `value` is
// of an unexpected type.
exports.castHeaderValue = function(value, header, inArray) {
  if (typeof value === 'string' ||
      typeof value === 'number' && isFinite(value) ||
      typeof value === 'boolean') {
    return value + '';
  }

  if (!inArray && Array.isArray(value)) {
    return value.map(function(value) {
      return exports.castHeaderValue(value, header, true);
    });
  }

  throw new TypeError('Unexpected value for `' + header + '` header.');
};

// ## castQueryValue(value, param)

// Casts finite numbers and boolean `value`s to a string.

// Returns the cast value, or throws a `TypeError` instance if the `value` is
// of an unexpected type.
exports.castQueryValue = function(value, param) {
  if (typeof value === 'string' ||
      typeof value === 'number' && isFinite(value) ||
      typeof value === 'boolean') {
    return value + '';
  }

  throw new TypeError('Unexpected value for `' + param + '` param.');
};
