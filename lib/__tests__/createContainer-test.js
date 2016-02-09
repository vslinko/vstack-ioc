/**
 * vstack by @vslinko
 */

jest.autoMockOff();

const createContainer = require('../createContainer');

describe('createContainer', () => {
  pit('should store and resolve values', () => {
    const c = createContainer();

    c.set('a', 'b');

    return c.get('a').then((value) => {
      expect(value).toEqual('b');
    });
  });

  pit('should store and resolve services', () => {
    const c = createContainer();

    c.set('a', () => 'b');

    return c.get('a').then((value) => {
      expect(value).toEqual('b');
    });
  });

  pit('should resolve dependencies', () => {
    const c = createContainer();

    c.set('a', () => 1);

    c.set('b', ['a'], (a) => a + 2);

    return c.get('b').then((value) => {
      expect(value).toEqual(3);
    });
  });

  pit('should search services', () => {
    const c = createContainer();

    c.set('a', [], ['x'], () => 1);

    c.set('b', [], ['x'], () => 2);

    c.set('c', [], ['y'], () => 3);

    return c.search('x').then((services) => {
      expect(services).toEqual([1, 2]);
    });
  });

  it('should call plugin', () => {
    const c = createContainer();
    const plugin = jest.genMockFn();

    c.plugin(plugin);

    expect(plugin).toBeCalledWith(c);
  });

  pit('should compile', () => {
    const c = createContainer();
    const list = [];

    c.plugin((c_) => {
      c_.set('lister', () => ({
        add: (item) => {
          list.push(item);
        },
      }));

      c_.compile(() =>
        Promise.all([c.get('lister'), c.search('listable')])
          .then((values) => {
            const lister = values[0];
            const listable = values[1];

            listable.forEach((item) => {
              lister.add(item);
            });
          })
      );
    });

    c.plugin((c_) => {
      c_.set('a', [], ['listable'], 1);
      c_.set('b', [], ['listable'], 2);
      c_.set('c', [], ['not-listable'], 3);
    });

    return c.build().then(() => {
      expect(list).toEqual([1, 2]);
    });
  });

  it('should not rewrite service', () => {
    const c = createContainer();

    expect(() => {
      c.set('a', 1);
      c.set('a', 2);
    }).toThrow('Service "a" already defined');
  });

  it('should check cirrural dependency', () => {
    const c = createContainer();

    expect(() => {
      c.set('a', ['b'], () => 1);
      c.set('b', ['c'], () => 2);
      c.set('c', ['a'], () => 3);
    }).toThrow('Dependency Cycle Found: c -> a -> b -> c');
  });
});
