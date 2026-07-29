class I18CLILanguageDetector {
  private formatShellLocale(rawLC?: string): string {
    if (!rawLC) {
      return '';
    }

    // Get array of available languages
    const LCs = rawLC.split(':');

    const LC = LCs[0]
      // Get `en_US` part from `en_US.UTF-8`
      .split('.')[0]
      // Slice en_US to en
      .split('_')[0]
      // slice en-US to en
      .split('-')[0];

    if (LC === 'C') {
      return '';
    }

    return LC;
  }

  detect() {
    const env = (
      globalThis as {
        process?: {
          env?: Record<string, string | undefined>;
        };
      }
    ).process?.env;
    const shellLocale =
      env?.LC_ALL ??
      env?.LC_MESSAGES ??
      env?.LANG ??
      env?.LANGUAGE ??
      Intl.DateTimeFormat().resolvedOptions().locale;

    return this.formatShellLocale(shellLocale);
  }
}

export { I18CLILanguageDetector };

export function getLocaleLanguage() {
  const detector = new I18CLILanguageDetector();
  return detector.detect();
}
