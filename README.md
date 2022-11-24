# no-unused

[experimental, early stage of development]

Finds unused properties in code utilizing TypeScript type system.


## Usage

```sh
npx no-unused src/**/*.ts
```


### Example output

**Source file:**

```ts
const data = {name: 'John', surname: 'Smith'};

type Params = {a?: number; wat?: string};

const selector = ({a}: Params) => [a, data.name];

selector({});
```

**Output:**

```
src/example.ts:1:29 - message TS0: Unused identifier

1 const data = {name: 'John', surname: 'Smith'};
                              ~~~~~~~
src/example.ts:3:28 - message TS0: Unused identifier

3 type Params = {a?: number; wat?: string};
                             ~~~

Total: 2 unused identifiers
```


## Ignoring unused app entrypoints

App entrypoints appear unused because they are meant to be used by external code.
To ignore them add `/** @public */` comment:

```ts
/** @public */
export const renderApp = () => ({ignoredAsWell});

function ignoredAsWell() {};
```


## Eslint plugin

See [eslint-plugin-no-unused](https://www.npmjs.com/package/eslint-plugin-no-unused)
