import PropTypes from 'prop-types';

const App = () => (
  <div className="container">
    <p className="description" id="description">
      description
    </p>
  </div>
);

App.propTypes = {
  testPropTypes: PropTypes.string,
};

window.testAppPropTypes = App.propTypes;

export default App;
