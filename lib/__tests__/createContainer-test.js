/**
 * vstack by @vslinko
 */

'use strict';

jest.autoMockOff();

const createContainer = require('../createContainer');

describe('createContainer', () => {
  pit('should store and resolve values', () => {
    const c = createContainer();

    c.set({ name: 'a', value: 'b' });

    return c.get('a').then((value) => {
      expect(value).toEqual('b');
    });
  });

  pit('should store and resolve services', () => {
    const c = createContainer();

    c.set({ name: 'a', value: () => 'b' });

    return c.get('a').then((value) => {
      expect(value).toEqual('b');
    });
  });

  pit('should resolve dependencies', () => {
    const c = createContainer();

    c.set({ name: 'a', value: () => 1 });

    c.set({ name: 'b', dependencies: ['a'], value: (a) => a + 2 });

    return c.get('b').then((value) => {
      expect(value).toEqual(3);
    });
  });

  pit('should search services', () => {
    const c = createContainer();

    c.set({ name: 'a', tags: ['x'], value: () => 1 });

    c.set({ name: 'b', tags: ['x'], value: () => 2 });

    c.set({ name: 'c', tags: ['y'], value: () => 3 });

    return c.search('x').then((services) => {
      expect(services).toEqual([1, 2]);
    });
  });

  pit('should compile', () => {
    const c = createContainer();
    const list = [];

    ((c_) => {
      c_.set({
        name: 'lister',
        value: () => ({
          add: (item) => {
            list.push(item);
          },
        }),
      });

      c_.onBuild(() =>
        Promise.all([c.get('lister'), c.search('listable')])
          .then((values) => {
            const lister = values[0];
            const listable = values[1];

            listable.forEach((item) => {
              lister.add(item);
            });
          })
      );
    })(c);

    ((c_) => {
      c_.set({ name: 'a', tags: ['listable'], value: 1 });
      c_.set({ name: 'b', tags: ['listable'], value: 2 });
      c_.set({ name: 'c', tags: ['not-listable'], value: 3 });
    })(c);

    return c.build().then(() => {
      expect(list).toEqual([1, 2]);
    });
  });

  it('should not rewrite service', () => {
    const c = createContainer();

    expect(() => {
      c.set({ name: 'a', value: 1 });
      c.set({ name: 'a', value: 2 });
    }).toThrow('Service "a" already defined');
  });

  it('should check cirrural dependency', () => {
    const c = createContainer();

    expect(() => {
      c.set({ name: 'a', dependencies: ['b'], value: () => 1 });
      c.set({ name: 'b', dependencies: ['c'], value: () => 2 });
      c.set({ name: 'c', dependencies: ['a'], value: () => 3 });
    }).toThrow('Dependency Cycle Found: c -> a -> b -> c');
  });
});
