'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sentinels = require('chai-sentinels');
var promiseAssertions = require('legendary/test/support/assertions');

chai.use(sentinels);
chai.use(require('chai-as-promised'));
chai.use(promiseAssertions);

sinon.assert.expose(chai.assert, { prefix: '' });

global.assert = chai.assert;
global.sentinels = sentinels;
