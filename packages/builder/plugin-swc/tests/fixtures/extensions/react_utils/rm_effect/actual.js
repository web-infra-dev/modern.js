import {useEffect} from 'react'

export default () => {
  useEffect(() => {
    console.log('hello');
  }, [])

  return <div>Hello World</div>
}
