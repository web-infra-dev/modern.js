import { parsedJSONFromElement } from '../../src/parsed';

describe('parsed utils', () => {
  it('should return null if no alias config', () => {
    document.body.innerHTML = `<script id='test' type="appliction/json">{"name": "modern.js"}</script>`;

    expect(parsedJSONFromElement('test')).toEqual({ name: 'modern.js' });
  });
});
