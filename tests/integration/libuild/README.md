# Libuild Tests

## Structure

| Catalog   | Description                                                      |
| --------- | ---------------------------------------------------------------- |
| `configs` | Ensure that configuration items are not affected by code changes |
| `errors`  | Some test cases that are expected to be wrong                    |
| `fixture` | Testing the functions of the Libuild                             |
| `plugins` | Testing the function of the various plugins                      |
| `toolkit` | Test toolbox                                                     |

## How to update snapshot

`rush update && rush build && pnpm snapshot` in root directory of project.

## How to enable Mocha Test Explorer

> Make sure you are using vscode.

1. Install [Mocha Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter);
2. `rush update`;
3. Open the sidebar.
