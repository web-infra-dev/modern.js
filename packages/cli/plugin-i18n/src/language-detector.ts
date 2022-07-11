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
    const shellLocale =
      process.env.LC_ALL ??
      process.env.LC_MESSAGES ??
      process.env.LANG ??
      process.env.LANGUAGE ??
      Intl.DateTimeFormat().resolvedOptions().locale;

    return this.formatShellLocale(shellLocale);
  }
}

export { I18CLILanguageDetector };
