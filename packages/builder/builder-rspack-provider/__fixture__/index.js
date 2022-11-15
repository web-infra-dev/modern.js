import styles from './index.module.css';
import scssStyles from './index.module.scss';
import lessStyles from './index.module.less';

const test = document.createElement('div');
test.id = 'test-el';
test.innerHTML = `hello ${Math.ceil(Math.random() * 1000)}`;
document.body.appendChild(test);

console.log(styles);
console.log(scssStyles);
console.log(lessStyles);
console.log(NAME);
