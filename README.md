# no-unused

[experimental, early stage of development]

Finds unused properties in code utilizing TypeScript type system.


## Usage

```sh
npx no-unused src/**/*.ts
```

```
Arguments:
  pattern                        pattern for source files (omit to find automatically)

Options:
  -V, --version                  output the version number
  -i, --ignore [pattern]         pattern for ignored files (default: "**/*.@(spec|test).*")
  -I, --ignoreExports [pattern]  pattern for files where exports are ignored
  -p, --project [string]         path to tsconfig.json (omit to resolve automatically)
  -e, --errors                   emit tsc errors
  -h, --help                     display help for command
```

*Note: files matched with `--ignore` won't be analyzed. Files containing `.spec.` or `.test.`
are ignored by default to also find identifiers that are used only in tests.*


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

App entrypoints appear unused because they are meant to be used by external code. To ignore them:

**Option 1**
Use `--ignoreExports entrypointsPattern`

```sh
npx no-unused src/**/*.ts --ignoreExports 'src/entrypoint.ts,src/otherEntrypoints/*.ts'
```

**Option 2**

add `/** @public */` comment:

```ts
/** @public */
export const renderApp = () => ({ignoredAsWell});

function ignoredAsWell() {};
```


## Eslint plugin

See [eslint-plugin-no-unused](https://www.npmjs.com/package/eslint-plugin-no-unused)
