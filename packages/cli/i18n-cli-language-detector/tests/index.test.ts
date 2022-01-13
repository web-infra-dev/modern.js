import { I18CLILanguageDetector } from '../src';

describe('Test I18CLILanguageDetector', () => {
  test('should return language', () => {
    const detector = new I18CLILanguageDetector();
    const language = detector.detect();
    expect(typeof language === 'string').toBeTruthy();
  });
});
