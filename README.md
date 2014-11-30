# vstack ioc

> Inversion of Control container with promises support

[![circleci build](http://img.shields.io/badge/build-passed-brightgreen.svg)](https://circleci.com/gh/vslinko-vstack/vstack-ioc/tree/master)
[![codacy code quality](https://img.shields.io/codacy/6b878fc06b9343f38a5c4551dbbf0993.svg)](https://www.codacy.com/public/vslinko/vstack-ioc/dashboard)
[![code climate](https://img.shields.io/codeclimate/github/vslinko-vstack/vstack-ioc.svg)](https://codeclimate.com/github/vslinko-vstack/vstack-ioc/code)
[![github issues](https://img.shields.io/github/issues/vslinko-vstack/vstack-ioc.svg)](https://github.com/vslinko-vstack/vstack-ioc/issues)

[![npm license](https://img.shields.io/npm/l/vstack-ioc.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/vstack-ioc.svg)](https://www.npmjs.org/package/vstack-ioc)
[![david dependencies](https://img.shields.io/david/vslinko-vstack/vstack-ioc.svg)](https://www.npmjs.org/package/vstack-ioc)
[![david dev dependencies](https://img.shields.io/david/dev/vslinko-vstack/vstack-ioc.svg)](https://www.npmjs.org/package/vstack-ioc)
[![npm downloads](https://img.shields.io/npm/dm/vstack-ioc.svg)](https://www.npmjs.org/package/vstack-ioc)

[![gitter chat](http://img.shields.io/badge/gitter%20chat-vslinko--vstack-brightgreen.svg)](https://gitter.im/vslinko-vstack?utm_source=share-link&utm_medium=link&utm_campaign=share-link)
[![gratipay](https://img.shields.io/gratipay/vslinko.svg)](https://gratipay.com/vslinko/)
[![bountysource](https://img.shields.io/bountysource/team/vstack/activity.svg)](https://www.bountysource.com/teams/vstack)

## Usage

```js
var ioc = require('vstack-ioc');

var c = ioc.createContainer();

c.plugin(function(c) {
  c.set('collection', function() {
    var collection = [];

    return {
      add: function(item) {
        collection.push(item);
      },

      toArray: function() {
        return collection.concat();
      }
    }
  });

  c.compile(function() {
    return Promise.all([c.get('collection'), c.search('item')])
      .then(function(values) {
        var collection = values[0];
        var items = values[1];

        items.forEach(function(item) {
          collection.add(item);
        });
      });
  });
});

c.plugin(function(c) {
  c.set('a', [], ['item'], 1);
  c.set('b', [], ['item'], 2);
  c.set('c', [], ['not-item'], 3);
});

c.build()
  .then(function() {
    return c.get('collection');
  })
  .then(function(collection) {
    expect(collection.toArray()).toEqual([1, 2]);
  });
```
