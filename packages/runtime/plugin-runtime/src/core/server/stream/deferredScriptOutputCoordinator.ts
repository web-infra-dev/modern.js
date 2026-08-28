import { SSR_HYDRATION_ID_PREFIX } from '@modern-js/utils/universal/constants';

type TokenizerState =
  | 'data'
  | 'tag-open'
  | 'start-tag-name'
  | 'before-attribute-name'
  | 'attribute-name'
  | 'after-attribute-name'
  | 'before-attribute-value'
  | 'attribute-value-double-quoted'
  | 'attribute-value-single-quoted'
  | 'attribute-value-unquoted'
  | 'self-closing-start-tag'
  | 'end-tag-name'
  | 'after-end-tag-name'
  | 'markup-declaration'
  | 'declaration'
  | 'comment'
  | 'bogus-comment'
  | 'raw-text'
  | 'raw-end-tag';

type OpenElement = {
  tagName: string;
  isContinuationContainer: boolean;
  isSegmentTableWrapper: boolean;
};

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

const RAW_TEXT_ELEMENTS = new Set([
  'iframe',
  'noembed',
  'noframes',
  'script',
  'style',
  'textarea',
  'title',
  'xmp',
]);

const REACT_SEGMENT_ID_PATTERN = new RegExp(
  `^${SSR_HYDRATION_ID_PREFIX}S:[0-9a-f]+$`,
);

const TABLE_SEGMENT_CHILDREN = new Set(['tbody', 'tr', 'colgroup']);

function isAsciiAlpha(char: string): boolean {
  return /[A-Za-z]/.test(char);
}

function isWhitespace(char: string): boolean {
  return /[\t\n\f\r ]/.test(char);
}

function getSuffix(value: string, pattern: string): string {
  const start = Math.max(0, value.length - pattern.length);
  for (let index = start; index < value.length; index++) {
    const suffix = value.slice(index);
    if (pattern.startsWith(suffix)) {
      return suffix;
    }
  }
  return '';
}

/**
 * Serializes deferred resolver scripts with the React output stream without
 * rewriting React HTML. Shell completion makes a resolver eligible to send;
 * this coordinator waits for a root-level HTML boundary before emitting it.
 */
export class DeferredScriptOutputCoordinator {
  private readonly pendingResolvers: string[] = [];

  private readonly openElements: OpenElement[] = [];

  private shellFinished = false;

  private closed = false;

  private state: TokenizerState = 'data';

  private currentTagName = '';

  private currentAttributes = new Map<string, string | true>();

  private currentAttributeName = '';

  private currentAttributeValue = '';

  private currentAttributeHasValue = false;

  private declarationPrefix = '';

  private commentTail = '';

  private rawTextElement: string | undefined;

  private rawTextSearch = '';

  private continuationProtocolScript = false;

  private continuationProtocolTail = '';

  private hasContinuationProtocolCall = false;

  private awaitingContinuationProtocol = false;

  public constructor(private readonly emit: (chunk: string) => void) {}

  public enqueueResolver(script: string): void {
    if (this.closed) {
      return;
    }

    this.pendingResolvers.push(script);
    this.flushResolvers();
  }

  /**
   * Keep this separate from the ShellChunkStatus assignment. The caller sets
   * FINISH at the existing marker position, then calls this after the marker
   * chunk's afterMark bytes have been observed.
   */
  public markShellFinished(): void {
    if (this.closed) {
      return;
    }

    this.shellFinished = true;
    this.flushResolvers();
  }

  public writeReact(chunk: string): void {
    if (this.closed || !chunk) {
      return;
    }

    this.flushResolvers();

    let emittedUntil = 0;
    for (let index = 0; index < chunk.length; index++) {
      const wasSafe = this.isSafeBoundary();
      this.consume(chunk[index]);

      if (!wasSafe && this.isSafeBoundary() && this.pendingResolvers.length) {
        this.emit(chunk.slice(emittedUntil, index + 1));
        emittedUntil = index + 1;
        this.flushResolvers();
      }
    }

    if (emittedUntil < chunk.length) {
      this.emit(chunk.slice(emittedUntil));
    }
  }

  public finish(): void {
    if (this.closed) {
      return;
    }

    this.flushResolvers();
    this.closed = true;

    if (this.pendingResolvers.length > 0) {
      throw new Error(
        'Cannot emit deferred resolver scripts because the React stream ended outside a safe HTML boundary.',
      );
    }
  }

  public abort(): void {
    this.closed = true;
    this.pendingResolvers.length = 0;
  }

  private isSafeBoundary(): boolean {
    return (
      this.shellFinished &&
      this.state === 'data' &&
      this.openElements.length === 0 &&
      !this.awaitingContinuationProtocol
    );
  }

  private flushResolvers(): void {
    if (!this.isSafeBoundary() || this.pendingResolvers.length === 0) {
      return;
    }

    while (this.pendingResolvers.length > 0) {
      const resolver = this.pendingResolvers.shift();
      if (resolver) {
        this.emit(resolver);
      }
    }
  }

  private consume(char: string): void {
    switch (this.state) {
      case 'data':
        if (char === '<') {
          this.state = 'tag-open';
        }
        return;
      case 'tag-open':
        if (char === '/') {
          this.currentTagName = '';
          this.state = 'end-tag-name';
        } else if (char === '!') {
          this.declarationPrefix = '';
          this.state = 'markup-declaration';
        } else if (char === '?') {
          this.state = 'bogus-comment';
        } else if (isAsciiAlpha(char)) {
          this.startTag(char);
          this.state = 'start-tag-name';
        } else {
          this.state = 'data';
        }
        return;
      case 'start-tag-name':
        if (isWhitespace(char)) {
          this.state = 'before-attribute-name';
        } else if (char === '/') {
          this.state = 'self-closing-start-tag';
        } else if (char === '>') {
          this.completeStartTag(false);
        } else {
          this.currentTagName += char.toLowerCase();
        }
        return;
      case 'before-attribute-name':
        if (isWhitespace(char)) {
          return;
        }
        if (char === '/') {
          this.state = 'self-closing-start-tag';
        } else if (char === '>') {
          this.completeStartTag(false);
        } else {
          this.startAttribute(char);
          this.state = 'attribute-name';
        }
        return;
      case 'attribute-name':
        if (isWhitespace(char)) {
          this.state = 'after-attribute-name';
        } else if (char === '=') {
          this.currentAttributeHasValue = true;
          this.state = 'before-attribute-value';
        } else if (char === '/') {
          this.completeAttribute();
          this.state = 'self-closing-start-tag';
        } else if (char === '>') {
          this.completeStartTag(false);
        } else {
          this.currentAttributeName += char.toLowerCase();
        }
        return;
      case 'after-attribute-name':
        if (isWhitespace(char)) {
          return;
        }
        if (char === '=') {
          this.currentAttributeHasValue = true;
          this.state = 'before-attribute-value';
        } else if (char === '/') {
          this.completeAttribute();
          this.state = 'self-closing-start-tag';
        } else if (char === '>') {
          this.completeStartTag(false);
        } else {
          this.completeAttribute();
          this.startAttribute(char);
          this.state = 'attribute-name';
        }
        return;
      case 'before-attribute-value':
        if (isWhitespace(char)) {
          return;
        }
        if (char === '"') {
          this.state = 'attribute-value-double-quoted';
        } else if (char === "'") {
          this.state = 'attribute-value-single-quoted';
        } else if (char === '>') {
          this.completeStartTag(false);
        } else {
          this.currentAttributeValue += char;
          this.state = 'attribute-value-unquoted';
        }
        return;
      case 'attribute-value-double-quoted':
        if (char === '"') {
          this.completeAttribute();
          this.state = 'before-attribute-name';
        } else {
          this.currentAttributeValue += char;
        }
        return;
      case 'attribute-value-single-quoted':
        if (char === "'") {
          this.completeAttribute();
          this.state = 'before-attribute-name';
        } else {
          this.currentAttributeValue += char;
        }
        return;
      case 'attribute-value-unquoted':
        if (isWhitespace(char)) {
          this.completeAttribute();
          this.state = 'before-attribute-name';
        } else if (char === '>') {
          this.completeStartTag(false);
        } else {
          this.currentAttributeValue += char;
        }
        return;
      case 'self-closing-start-tag':
        if (char === '>') {
          this.completeStartTag(true);
        } else if (!isWhitespace(char)) {
          this.startAttribute(char);
          this.state = 'attribute-name';
        }
        return;
      case 'end-tag-name':
        if (isWhitespace(char)) {
          this.state = 'after-end-tag-name';
        } else if (char === '>') {
          this.completeEndTag();
        } else {
          this.currentTagName += char.toLowerCase();
        }
        return;
      case 'after-end-tag-name':
        if (char === '>') {
          this.completeEndTag();
        }
        return;
      case 'markup-declaration':
        if (this.declarationPrefix.length < 2 && char === '-') {
          this.declarationPrefix += char;
          if (this.declarationPrefix === '--') {
            this.commentTail = '';
            this.state = 'comment';
          }
        } else {
          this.state = char === '>' ? 'data' : 'declaration';
        }
        return;
      case 'declaration':
        if (char === '>') {
          this.state = 'data';
        }
        return;
      case 'comment':
        this.commentTail = `${this.commentTail}${char}`.slice(-3);
        if (this.commentTail === '-->') {
          this.state = 'data';
        }
        return;
      case 'bogus-comment':
        if (char === '>') {
          this.state = 'data';
        }
        return;
      case 'raw-text':
        this.consumeRawText(char);
        return;
      case 'raw-end-tag':
        if (char === '>') {
          this.completeRawTextEndTag();
        } else if (!isWhitespace(char)) {
          this.state = 'raw-text';
          this.rawTextSearch = getSuffix(
            `${this.rawTextSearch}${char.toLowerCase()}`,
            `</${this.rawTextElement}`,
          );
        }
    }
  }

  private startTag(char: string): void {
    this.currentTagName = char.toLowerCase();
    this.currentAttributes = new Map();
    this.currentAttributeName = '';
    this.currentAttributeValue = '';
    this.currentAttributeHasValue = false;
  }

  private startAttribute(char: string): void {
    this.currentAttributeName = char.toLowerCase();
    this.currentAttributeValue = '';
    this.currentAttributeHasValue = false;
  }

  private completeAttribute(): void {
    if (!this.currentAttributeName) {
      return;
    }

    this.currentAttributes.set(
      this.currentAttributeName,
      this.currentAttributeHasValue ? this.currentAttributeValue : true,
    );
    this.currentAttributeName = '';
    this.currentAttributeValue = '';
    this.currentAttributeHasValue = false;
  }

  private completeStartTag(selfClosing: boolean): void {
    this.completeAttribute();
    const tagName = this.currentTagName;
    const id = this.currentAttributes.get('id');
    const hasReactSegmentId =
      typeof id === 'string' && REACT_SEGMENT_ID_PATTERN.test(id);
    const hasHiddenAttribute = this.currentAttributes.has('hidden');
    const isHiddenSegmentTable =
      tagName === 'table' && hasHiddenAttribute && !hasReactSegmentId;
    const isTableSegmentChild =
      hasReactSegmentId &&
      TABLE_SEGMENT_CHILDREN.has(tagName) &&
      this.openElements[this.openElements.length - 1]?.isSegmentTableWrapper ===
        true;
    const isContinuationContainer =
      hasReactSegmentId &&
      ((tagName === 'div' && hasHiddenAttribute) ||
        ((tagName === 'svg' || tagName === 'math') &&
          id !== undefined &&
          this.currentAttributes.get('aria-hidden') === 'true' &&
          this.currentAttributes.get('style') === 'display:none') ||
        (tagName === 'table' && hasHiddenAttribute) ||
        isTableSegmentChild);
    this.continuationProtocolScript =
      tagName === 'script' && this.awaitingContinuationProtocol;
    this.continuationProtocolTail = '';
    this.hasContinuationProtocolCall = false;

    if (!selfClosing && !VOID_ELEMENTS.has(tagName)) {
      this.openElements.push({
        tagName,
        isContinuationContainer,
        isSegmentTableWrapper: isHiddenSegmentTable,
      });
    }

    this.currentTagName = '';
    this.currentAttributes = new Map();
    this.currentAttributeName = '';
    this.currentAttributeValue = '';
    this.currentAttributeHasValue = false;

    if (!selfClosing && RAW_TEXT_ELEMENTS.has(tagName)) {
      this.rawTextElement = tagName;
      this.rawTextSearch = '';
      this.state = 'raw-text';
    } else {
      this.state = 'data';
    }
  }

  private completeEndTag(): void {
    this.closeOpenElement(this.currentTagName);
    this.currentTagName = '';
    this.state = 'data';
  }

  private consumeRawText(char: string): void {
    const rawTextElement = this.rawTextElement;
    if (!rawTextElement) {
      this.state = 'data';
      return;
    }

    const endTagPrefix = `</${rawTextElement}`;
    if (this.continuationProtocolScript) {
      this.continuationProtocolTail =
        `${this.continuationProtocolTail}${char}`.slice(-4);
      if (/\$(?:RC|RS|RX|RB)\b/.test(this.continuationProtocolTail)) {
        this.hasContinuationProtocolCall = true;
      }
    }
    this.rawTextSearch = getSuffix(
      `${this.rawTextSearch}${char.toLowerCase()}`,
      endTagPrefix,
    );
    if (this.rawTextSearch === endTagPrefix) {
      this.state = 'raw-end-tag';
    }
  }

  private completeRawTextEndTag(): void {
    const rawTextElement = this.rawTextElement;
    if (rawTextElement) {
      this.closeOpenElement(rawTextElement);
    }
    if (
      rawTextElement === 'script' &&
      this.continuationProtocolScript &&
      this.hasContinuationProtocolCall
    ) {
      this.awaitingContinuationProtocol = false;
    }
    this.rawTextElement = undefined;
    this.rawTextSearch = '';
    this.continuationProtocolScript = false;
    this.continuationProtocolTail = '';
    this.hasContinuationProtocolCall = false;
    this.state = 'data';
  }

  private closeOpenElement(tagName: string): void {
    const matchingIndex = this.openElements
      .map(element => element.tagName)
      .lastIndexOf(tagName);
    if (matchingIndex === -1) {
      return;
    }

    const closedElements = this.openElements.splice(matchingIndex);
    const closedContinuation = closedElements.some(
      element => element.isContinuationContainer,
    );
    if (closedContinuation) {
      this.awaitingContinuationProtocol = true;
    }
  }
}
