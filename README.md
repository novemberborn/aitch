aitch
=====

Toolkit for constructing hypertext service clients.

## Installation

```
npm install legendary
npm install aitch
```

This module has a peer dependency on
[Legendary](https://github.com/novemberborn/legendary).

## Usage

See [API Docs](http://novemberborn.github.io/aitch/lib/main.js.html).

## Examples

Make an HTTP request against the GitHub API:

```js
'use strict';

var aitch = require('aitch');

var client = new aitch.Client({
  transport: new aitch.Transport({
    hostname: 'api.github.com'
  }),
  headers: {
    host: 'api.github.com',
    accept: 'application/vnd.github.v3+json',
    'user-agent': 'novemberborn/aitch'
  }
});

var response = client.get({
  pathname: '/repos/novemberborn/aitch/releases'
});

response.stream.pipe(process.stdout);
```
