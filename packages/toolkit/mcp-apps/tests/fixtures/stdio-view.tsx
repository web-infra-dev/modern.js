import './stdio-style.css';
import logo from './stdio-logo.svg';
export default function Card() {
  return (
    <div className="stdio-fixture">
      <img src={logo} />
      Inline assets
    </div>
  );
}
