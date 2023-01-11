- Type : `'linked' | 'inline' | 'none'`
- Default: `'linked'`

Configure how to handle the legal comment.

A "legal comment" is considered to be any statement-level comment in JS or rule-level comment in CSS that contains @license or @preserve or that starts with //! or /\*!. These comments are preserved in output files by default since that follows the intent of the original authors of the code.

This behavior can be configured by using one of the following options:

- `linked`: Extract all legal comments to a .LEGAL.txt file and link to them with a comment.
- `inline`: Preserve all legal comments in original position.
- `none`: Remove all legal comments.

#### Example

Remove all legal comments:

```js
export default {
  output: {
    legalComments: 'none',
  },
};
```
