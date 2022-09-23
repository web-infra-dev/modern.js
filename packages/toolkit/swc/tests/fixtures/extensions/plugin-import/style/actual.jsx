import { Button, KebabCase } from 'foo'

export function f() {
  console.log(Button)
  console.log(KebabCase)
}

export const Jsx = () => {
  return <KebabCase>
    <Button>button</Button>
  </KebabCase>
}
