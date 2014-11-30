# vstack ioc

> Inversion of Control container with promises support

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
