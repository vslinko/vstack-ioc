# vstack ioc

> Inversion of Control container with promises support

[![CircleCI](https://img.shields.io/circleci/project/vslinko/vstack-ioc.svg)](https://circleci.com/gh/vslinko/vstack-ioc)
[![David](https://img.shields.io/david/vslinko/vstack-ioc.svg)](https://david-dm.org/vslinko/vstack-ioc)
[![David](https://img.shields.io/david/dev/vslinko/vstack-ioc.svg)](https://david-dm.org/vslinko/vstack-ioc)
[![Gitter](https://img.shields.io/gitter/room/vslinko/vstack-ioc.svg)](https://gitter.im/vslinko/vstack-ioc)

## Usage

```js
// init.js

const {createContainer} = require('vstack-ioc');

export default async function init() {
  const c = createContainer();

  require('./orm')(c);
  require('./user')(c);

  await c.build();

  const modelManager = await c.get('modelManager');
  console.log(modelManager.getModels()); // [UserModel, GroupModel]
}
```

```js
// orm.js

class ModelManager {
  constructor() {
    this.models = [];
  }

  addModel(model) {
    this.models.push(model);
  }

  getModels() {
    return this.models.concat();
  }
}

module.exports = (c) => {
  c.set('modelManager', () => new ModelManager());

  c.onBuild(async () => {
    const modelManager = await c.get('modelManager');
    const models = await c.search('model');

    models.forEach(model => modelManager.addModel(model));
  });
});
```

```js
// user.js

class UserModel {
  // ...
}

class GroupModel {
  constructor(userModel) {
    this.userModel = userModel;
  }

  // ...
}

module.exports = (c) => {
  c.set({
    name: 'userModel',
    tags: ['model'],
    value: () => new UserModel(),
  });
  c.set({
    name: 'groupModel',
    dependencies: ['userModel'],
    tags: ['model'],
    value: (userModel) => new GroupModel(userModel),
  });
};
```
