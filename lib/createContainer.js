/**
 * vstack by @vslinko
 */

var DepGraph = require('dep-graph');

function createContainer() {
  var container = {};
  var graph = new DepGraph();
  var tags = {};
  var factories = {};
  var values = {};
  var compilers = [];

  function addDepenencyPath(source, destination) {
    graph.add(source, destination);

    try {
      graph.descendantsOf(source);
    } catch (e) {
      const newError = new Error(
        'Circular dependency between "' + source + '" and "' + destination + '"'
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
      throw new Error('Unknown service "' + key + '"');
    }

    return Promise.all(factories[key].dependencies.map(getter))
      .then(function(args) {
        return factories[key].factory.apply(null, args);
      })
      .then(function(value) {
        values[key] = value;
        return values[key];
      });
  }

  function set(name, serviceDependencies, serviceTags, value) {
    if (values.hasOwnProperty(name) || factories.hasOwnProperty(name)) {
      throw new Error('Service "' + name + '" already defined');
    }

    if (!value) {
      value = serviceTags;
      serviceTags = [];
    }

    if (!value) {
      value = serviceDependencies;
      serviceDependencies = [];
    }

    serviceDependencies.forEach(function(dependency) {
      addDepenencyPath(name, dependency);
    });

    serviceTags.forEach(function(tag) {
      if (!tags[tag]) {
        tags[tag] = [];
      }

      tags[tag].push(name);
    });

    if (typeof value === 'function') {
      factories[name] = {
        dependencies: serviceDependencies,
        factory: value
      };
    } else {
      values[name] = value;
    }
  }

  function get(keys) {
    if (Array.isArray(keys)) {
      return Promise.all(keys.map(getter));
    } else {
      return getter(keys);
    }
  }

  function search(tag) {
    if (tags[tag]) {
      return get(tags[tag]);
    } else {
      return Promise.resolve([]);
    }
  }

  function plugin(pluginFunction) {
    pluginFunction(container);
  }

  function compile(compiler) {
    compilers.push(compiler);
  }

  function build() {
    return Promise.all(compilers.map(function(compiler) {
      return compiler();
    }));
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
