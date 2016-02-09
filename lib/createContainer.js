/**
 * vstack by @vslinko
 */

const DepGraph = require('dep-graph');

function createContainer() {
  const container = {};
  const graph = new DepGraph();
  const tags = {};
  const factories = {};
  const values = {};
  const compilers = [];

  function addDepenencyPath(source, destination) {
    graph.add(source, destination);

    try {
      graph.descendantsOf(source);
    } catch (e) {
      const newError = new Error(
        `Circular dependency between "${source}" and "${destination}"`
      );
      newError.cause = e;
      throw newError;
    }
  }

  function getter(key) {
    if (key in values) {
      return Promise.resolve(values[key]);
    }

    if (!factories.hasOwnProperty(key)) {
      throw new Error(`Unknown service "${key}"`);
    }

    return Promise.all(factories[key].dependencies.map(getter))
      .then((args) => factories[key].factory.apply(null, args))
      .then((value) => {
        values[key] = value;
        return values[key];
      });
  }

  function set(name, serviceDependencies, serviceTags, value) {
    if (values.hasOwnProperty(name) || factories.hasOwnProperty(name)) {
      throw new Error(`Service "${name}" already defined`);
    }

    /* eslint-disable no-param-reassign */
    if (!value) {
      value = serviceTags;
      serviceTags = [];
    }

    if (!value) {
      value = serviceDependencies;
      serviceDependencies = [];
    }
    /* eslint-enable no-param-reassign */

    serviceDependencies.forEach((dependency) => {
      addDepenencyPath(name, dependency);
    });

    serviceTags.forEach((tag) => {
      if (!tags[tag]) {
        tags[tag] = [];
      }

      tags[tag].push(name);
    });

    if (typeof value === 'function') {
      factories[name] = {
        dependencies: serviceDependencies,
        factory: value,
      };
    } else {
      values[name] = value;
    }
  }

  function get(keys) {
    if (Array.isArray(keys)) {
      return Promise.all(keys.map(getter));
    }

    return getter(keys);
  }

  function search(tag) {
    if (!tags[tag]) {
      return Promise.resolve([]);
    }

    return get(tags[tag]);
  }

  function plugin(pluginFunction) {
    pluginFunction(container);
  }

  function compile(compiler) {
    compilers.push(compiler);
  }

  function build() {
    return Promise.all(compilers.map((compiler) => compiler()));
  }

  container.set = set;
  container.get = get;
  container.search = search;
  container.plugin = plugin;
  container.compile = compile;
  container.build = build;

  return container;
}

module.exports = createContainer;
