/**
 * vstack by @vslinko
 */

'use strict';

const DepGraph = require('dependency-graph').DepGraph;

function createContainer() {
  const container = {};
  const graph = new DepGraph();
  const tags = Object.create(null);
  const factories = Object.create(null);
  const values = Object.create(null);
  const compilers = [];

  function addDepenencyPath(source, destination) {
    graph.addNode(source);
    graph.addNode(destination);
    graph.addDependency(source, destination);
    graph.dependenciesOf(source);
  }

  function getter(key) {
    if (key in values) {
      return Promise.resolve(values[key]);
    }

    if (!(key in factories)) {
      throw new Error(`Unknown service "${key}"`);
    }

    return Promise.all(factories[key].dependencies.map(getter))
      .then((args) => factories[key].factory.apply(null, args))
      .then((value) => {
        values[key] = value;
        return values[key];
      });
  }

  function set(definition) {
    const name = definition.name;
    const value = definition.value;
    const serviceTags = definition.tags || [];
    const serviceDependencies = definition.dependencies || [];

    if (name in values || name in factories) {
      throw new Error(`Service "${name}" already defined`);
    }

    serviceDependencies.forEach((dependency) => {
      addDepenencyPath(name, dependency);
    });

    serviceTags.forEach((tag) => {
      if (!(tag in tags)) {
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
    if (!(tag in tags)) {
      return Promise.resolve([]);
    }

    return get(tags[tag]);
  }

  function onBuild(compiler) {
    compilers.push(compiler);
  }

  function build() {
    return Promise.all(compilers.map(compiler => compiler()));
  }

  container.set = set;
  container.get = get;
  container.search = search;
  container.onBuild = onBuild;
  container.build = build;

  return container;
}

module.exports = createContainer;
