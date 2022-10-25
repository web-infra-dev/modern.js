import p from 'path'

if (Math.random() === 1.2) {
  console.log({...require("foo")}, p)
} else {
  require("bar")
}
