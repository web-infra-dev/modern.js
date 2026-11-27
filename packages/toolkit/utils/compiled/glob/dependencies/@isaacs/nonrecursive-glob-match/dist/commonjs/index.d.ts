import { type Form } from './parse-class.js';
export type { Form };
export type MatcherOptions = {
    /** perform a case-insensitive match */
    nocase?: boolean;
    /** do not treat strings starting with `.` specially */
    dot?: boolean;
    /** do not match extglobs (treat them as normal strings) */
    noext?: boolean;
    /**
     * normalize unicode in the pattern and the tested strings, with
     * this form. `true` means `'NFC'`.
     */
    normalize?: boolean | Form;
    /**
     * A char that marks a numeric range in the pattern, as
     * `<mark><lo>..<hi><mark>`, where `lo` and `hi` are integers. It
     * matches the strings that the bash brace expansion `{<lo>..<hi>}`
     * makes, such as `{1..100}` or `{001..100}`, without making each
     * one. A mark is never escaped by a `\` before it. Inside a `[...]`
     * class, a mark is a char of the class.
     */
    rangeMark?: string;
};
export type Item = {
    t: 'lit';
    ch: string;
} | {
    t: 'any' | 'star';
} | {
    t: 'class';
    re: RegExp;
} | {
    t: 'ext';
    type: string;
    alts: Item[][];
};
export type Token = Item | {
    t: 'open';
    type: string;
} | {
    t: 'bar';
} | {
    t: 'close';
};
export type NegNode = {
    t: 'neg';
    id: number;
    sub: Node;
    next: Node;
};
export type SplitNode = {
    t: 'split';
    id: number;
    out: Node[];
};
export type Node = ({
    t: 'lit';
    id: number;
    next: Node;
} & Lit) | {
    t: 'any' | 'star';
    id: number;
    next: Node;
} | {
    t: 'class';
    id: number;
    re: RegExp;
    next: Node;
} | SplitNode | NegNode | {
    t: 'match';
    id: number;
};
/**
 * A literal char. With `nocase:true`, `re` folds case, and `ascii`
 * holds its results for ASCII chars, by char code: 1 for a match,
 * and 2 for not.
 */
export type Lit = {
    ch: string;
    re?: RegExp;
    ascii?: Uint8Array;
};
/**
 * For each node id, the gen of the last state that has the node as
 * a thread, and of the last state that walked through it. A state is
 * built to the end before the states around it go on, and the nodes
 * of a negated sub-pattern are only in its states (other than the
 * match node, which is never marked). So one mark for each node is
 * enough to know if the state being built has it. The Sims of a
 * matcher never run at the same time, so they share one Marks.
 */
export type Marks = {
    has: Float64Array;
    seen: Float64Array;
    gen: number;
};
/**
 * A node in a graph with no splits or negations. Such a graph is a
 * chain of nodes that each match one char, or a `*`.
 */
export type LinearNode = Exclude<Node, SplitNode | NegNode | {
    t: 'match';
}>;
export declare class Matcher {
    #private;
    pattern: string;
    options: MatcherOptions;
    constructor(pattern: string, options?: MatcherOptions);
    test(s: string): boolean;
    /**
     * The same as {@link Matcher#test}, but the string is not checked
     * for `/` chars, so the result for a string that has one is not
     * defined. Only use it for a string that is known to be one path
     * portion, such as a part of a path that was split on `/`. It can
     * be faster, because some patterns do not need to look at each char
     * of the string.
     */
    testUnchecked(s: string): boolean;
    /** a readable listing of the state machine */
    toString(): string;
}
