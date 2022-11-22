declare class StackTracey {

    constructor (input?: Error|string|StackTracey.Entry[], offset?: number)

    items: StackTracey.Entry[]

    extractEntryMetadata (e: StackTracey.Entry): StackTracey.Entry

    shortenPath (relativePath: string): string
    relativePath (fullPath: string): string
    isThirdParty (relativePath: string): boolean

    rawParse (str: string): StackTracey.Entry[]

    withSourceAt (i: number): StackTracey.Entry
    withSourceAsyncAt (i: number): Promise<StackTracey.Entry>

    withSource (entry: StackTracey.Entry): StackTracey.Entry
    withSourceAsync (entry: StackTracey.Entry): Promise<StackTracey.Entry>

    withSources ():        StackTracey
    withSourcesAsync ():   Promise<StackTracey>
    mergeRepeatedLines (): StackTracey

    clean ():              StackTracey
    cleanAsync ():         Promise<StackTracey>

    isClean (entry: StackTracey.Entry, index: number): boolean

    map    (f: (x: StackTracey.Entry, i: number, arr: StackTracey.Entry[]) => StackTracey.Entry):   StackTracey
    filter (f: (x: StackTracey.Entry, i: number, arr: StackTracey.Entry[]) => boolean):             StackTracey
    slice  (from?: number, to?: number):                                                            StackTracey
    concat (...args: StackTracey.Entry[]):                                                          StackTracey

    at (i: number): StackTracey.Entry

    asTable (opts?: { maxColumnWidths?: StackTracey.MaxColumnWidths }): string

    maxColumnWidths (): StackTracey.MaxColumnWidths

    static resetCache (): void
    static locationsEqual (a: StackTracey.Location, b: StackTracey.Location): boolean
}

declare namespace StackTracey {

    interface SourceFile {

        path: string
        text: string
        lines: string[]
        error?: Error
    }
    
    interface Location {
    
        file:    string
        line?:   number
        column?: number
    }
    
    interface Entry extends Location {
    
        beforeParse: string
        callee:      string
        index:       boolean
        native:      boolean
    
        calleeShort:  string
        fileRelative: string
        fileShort:    string
        fileName:     string
        thirdParty:   boolean
    
        hide?:       boolean
        sourceLine?: string
        sourceFile?: SourceFile
        error?:      Error
    }
    
    interface MaxColumnWidths {
        callee:     number
        file:       number
        sourceLine: number
    }
}

export = StackTracey
