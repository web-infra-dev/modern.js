(()=>{"use strict";var e={36:e=>{e.exports=require("../postcss-value-parser")},161:(e,n,o)=>{var t=o(484),r=o(317);class LayerName{parts;constructor(e){this.parts=e}tokens(){return[...this.parts]}slice(e,n){const o=[];for(let e=0;e<this.parts.length;e++)this.parts[e][0]===t.TokenType.Ident&&o.push(e);const r=o.slice(e,n);return new LayerName(this.parts.slice(r[0],r[r.length-1]+1))}concat(e){const n=[t.TokenType.Delim,".",-1,-1,{value:"."}];return new LayerName([...this.parts.filter((e=>e[0]===t.TokenType.Ident||e[0]===t.TokenType.Delim)),n,...e.parts.filter((e=>e[0]===t.TokenType.Ident||e[0]===t.TokenType.Delim))])}segments(){return this.parts.filter((e=>e[0]===t.TokenType.Ident)).map((e=>e[4].value))}name(){return this.parts.filter((e=>e[0]===t.TokenType.Ident||e[0]===t.TokenType.Delim)).map((e=>e[1])).join("")}equal(e){const n=this.segments(),o=e.segments();if(n.length!==o.length)return!1;for(let e=0;e<n.length;e++){if(n[e]!==o[e])return!1}return!0}toString(){return t.stringify(...this.parts)}toJSON(){return{parts:this.parts,segments:this.segments(),name:this.name()}}}function parseFromTokens(e,n){const o=r.parseCommaSeparatedListOfComponentValues(e,{onParseError:null==n?void 0:n.onParseError}),s=(null==n?void 0:n.onParseError)??(()=>{}),i=["6.4.2. Layer Naming and Nesting","Layer name syntax","<layer-name> = <ident> [ '.' <ident> ]*"],a=e[0][2],c=e[e.length-1][3],u=[];for(let e=0;e<o.length;e++){const n=o[e];for(let e=0;e<n.length;e++){const o=n[e];if(!r.isTokenNode(o)&&!r.isCommentNode(o)&&!r.isWhitespaceNode(o))return s(new t.ParseError(`Invalid cascade layer name. Invalid layer name part "${o.toString()}"`,a,c,i)),[]}const d=n.flatMap((e=>e.tokens()));let p=!1,l=!1,m=null;for(let e=0;e<d.length;e++){const n=d[e];if(n[0]!==t.TokenType.Comment&&n[0]!==t.TokenType.Whitespace&&n[0]!==t.TokenType.Ident&&(n[0]!==t.TokenType.Delim||"."!==n[4].value))return s(new t.ParseError(`Invalid cascade layer name. Invalid character "${n[1]}"`,a,c,i)),[];if(!p&&n[0]===t.TokenType.Delim)return s(new t.ParseError("Invalid cascade layer name. Layer names can not start with a dot.",a,c,i)),[];if(p){if(n[0]===t.TokenType.Whitespace){l=!0;continue}if(l&&n[0]===t.TokenType.Comment)continue;if(l)return s(new t.ParseError("Invalid cascade layer name. Encountered unexpected whitespace between layer name parts.",a,c,i)),[];if(m&&m[0]===t.TokenType.Ident&&n[0]===t.TokenType.Ident)return s(new t.ParseError("Invalid cascade layer name. Layer name parts must be separated by dots.",a,c,i)),[];if(m&&m[0]===t.TokenType.Delim&&n[0]===t.TokenType.Delim)return s(new t.ParseError("Invalid cascade layer name. Layer name parts must not be empty.",a,c,i)),[]}n[0]===t.TokenType.Ident&&(p=!0),n[0]!==t.TokenType.Ident&&n[0]!==t.TokenType.Delim||(m=n)}if(!m)return s(new t.ParseError("Invalid cascade layer name. Empty layer name.",a,c,i)),[];if(m[0]===t.TokenType.Delim)return s(new t.ParseError("Invalid cascade layer name. Layer name must not end with a dot.",a,c,i)),[];u.push(new LayerName(d))}return u}n.LayerName=LayerName,n.addLayerToModel=function addLayerToModel(e,n){return n.forEach((n=>{const o=n.segments();e:for(let t=0;t<o.length;t++){const o=n.slice(0,t+1),r=o.segments();let s=-1,i=0;for(let n=0;n<e.length;n++){const o=e[n].segments();let t=0;n:for(let e=0;e<o.length;e++){const n=o[e],s=r[e];if(s===n&&e+1===r.length)continue e;if(s!==n){if(s!==n)break n}else t++}t>=i&&(s=n,i=t)}-1===s?e.push(o):e.splice(s+1,0,o)}})),e},n.parse=function parse(e,n){const o=t.tokenizer({css:e},{onParseError:null==n?void 0:n.onParseError}),r=[];for(;!o.endOfFile();)r.push(o.nextToken());return r.push(o.nextToken()),parseFromTokens(r,n)},n.parseFromTokens=parseFromTokens},317:(e,n,o)=>{var t,r=o(484);function consumeComponentValue(e,n){const o=n[0];if(o[0]===r.TokenType.OpenParen||o[0]===r.TokenType.OpenCurly||o[0]===r.TokenType.OpenSquare){const o=consumeSimpleBlock(e,n);return{advance:o.advance,node:o.node}}if(o[0]===r.TokenType.Function){const o=consumeFunction(e,n);return{advance:o.advance,node:o.node}}if(o[0]===r.TokenType.Whitespace){const o=consumeWhitespace(e,n);return{advance:o.advance,node:o.node}}if(o[0]===r.TokenType.Comment){const o=consumeComment(e,n);return{advance:o.advance,node:o.node}}return{advance:1,node:new TokenNode(o)}}n.ComponentValueType=void 0,(t=n.ComponentValueType||(n.ComponentValueType={})).Function="function",t.SimpleBlock="simple-block",t.Whitespace="whitespace",t.Comment="comment",t.Token="token";class FunctionNode{type=n.ComponentValueType.Function;name;endToken;value;constructor(e,n,o){this.name=e,this.endToken=n,this.value=o}getName(){return this.name[4].value}normalize(){this.endToken[0]===r.TokenType.EOF&&(this.endToken=[r.TokenType.CloseParen,")",-1,-1,void 0])}tokens(){return this.endToken[0]===r.TokenType.EOF?[this.name,...this.value.flatMap((e=>e.tokens()))]:[this.name,...this.value.flatMap((e=>e.tokens())),this.endToken]}toString(){const e=this.value.map((e=>r.isToken(e)?r.stringify(e):e.toString())).join("");return r.stringify(this.name)+e+r.stringify(this.endToken)}indexOf(e){return this.value.indexOf(e)}at(e){if("number"==typeof e)return e<0&&(e=this.value.length+e),this.value[e]}walk(e){let n=!1;if(this.value.forEach(((o,t)=>{n||(!1!==e({node:o,parent:this},t)?"walk"in o&&!1===o.walk(e)&&(n=!0):n=!0)})),n)return!1}toJSON(){return{type:this.type,name:this.getName(),tokens:this.tokens(),value:this.value.map((e=>e.toJSON()))}}isFunctionNode(){return FunctionNode.isFunctionNode(this)}static isFunctionNode(e){return!!e&&(e instanceof FunctionNode&&e.type===n.ComponentValueType.Function)}}function consumeFunction(e,n){const o=[];let t=1;for(;;){const s=n[t];if(!s||s[0]===r.TokenType.EOF)return e.onParseError(new r.ParseError("Unexpected EOF while consuming a function.",n[0][2],n[n.length-1][3],["5.4.9. Consume a function","Unexpected EOF"])),{advance:n.length,node:new FunctionNode(n[0],s,o)};if(s[0]===r.TokenType.CloseParen)return{advance:t+1,node:new FunctionNode(n[0],s,o)};if(s[0]===r.TokenType.Comment||s[0]===r.TokenType.Whitespace){const r=consumeAllCommentsAndWhitespace(e,n.slice(t));t+=r.advance,o.push(...r.nodes);continue}const i=consumeComponentValue(e,n.slice(t));t+=i.advance,o.push(i.node)}}class SimpleBlockNode{type=n.ComponentValueType.SimpleBlock;startToken;endToken;value;constructor(e,n,o){this.startToken=e,this.endToken=n,this.value=o}normalize(){if(this.endToken[0]===r.TokenType.EOF){const e=r.mirrorVariant(this.startToken);e&&(this.endToken=e)}}tokens(){return this.endToken[0]===r.TokenType.EOF?[this.startToken,...this.value.flatMap((e=>e.tokens()))]:[this.startToken,...this.value.flatMap((e=>e.tokens())),this.endToken]}toString(){const e=this.value.map((e=>r.isToken(e)?r.stringify(e):e.toString())).join("");return r.stringify(this.startToken)+e+r.stringify(this.endToken)}indexOf(e){return this.value.indexOf(e)}at(e){if("number"==typeof e)return e<0&&(e=this.value.length+e),this.value[e]}walk(e){let n=!1;if(this.value.forEach(((o,t)=>{n||(!1!==e({node:o,parent:this},t)?"walk"in o&&!1===o.walk(e)&&(n=!0):n=!0)})),n)return!1}toJSON(){return{type:this.type,startToken:this.startToken,tokens:this.tokens(),value:this.value.map((e=>e.toJSON()))}}isSimpleBlockNode(){return SimpleBlockNode.isSimpleBlockNode(this)}static isSimpleBlockNode(e){return!!e&&(e instanceof SimpleBlockNode&&e.type===n.ComponentValueType.SimpleBlock)}}function consumeSimpleBlock(e,n){const o=r.mirrorVariantType(n[0][0]);if(!o)throw new Error("Failed to parse, a mirror variant must exist for all block open tokens.");const t=[];let s=1;for(;;){const i=n[s];if(!i||i[0]===r.TokenType.EOF)return e.onParseError(new r.ParseError("Unexpected EOF while consuming a simple block.",n[0][2],n[n.length-1][3],["5.4.8. Consume a simple block","Unexpected EOF"])),{advance:n.length,node:new SimpleBlockNode(n[0],i,t)};if(i[0]===o)return{advance:s+1,node:new SimpleBlockNode(n[0],i,t)};if(i[0]===r.TokenType.Comment||i[0]===r.TokenType.Whitespace){const o=consumeAllCommentsAndWhitespace(e,n.slice(s));s+=o.advance,t.push(...o.nodes);continue}const a=consumeComponentValue(e,n.slice(s));s+=a.advance,t.push(a.node)}}class WhitespaceNode{type=n.ComponentValueType.Whitespace;value;constructor(e){this.value=e}tokens(){return this.value}toString(){return r.stringify(...this.value)}toJSON(){return{type:this.type,tokens:this.tokens()}}isWhitespaceNode(){return WhitespaceNode.isWhitespaceNode(this)}static isWhitespaceNode(e){return!!e&&(e instanceof WhitespaceNode&&e.type===n.ComponentValueType.Whitespace)}}function consumeWhitespace(e,n){let o=0;for(;;){if(n[o][0]!==r.TokenType.Whitespace)return{advance:o,node:new WhitespaceNode(n.slice(0,o))};o++}}class CommentNode{type=n.ComponentValueType.Comment;value;constructor(e){this.value=e}tokens(){return[this.value]}toString(){return r.stringify(this.value)}toJSON(){return{type:this.type,tokens:this.tokens()}}isCommentNode(){return CommentNode.isCommentNode(this)}static isCommentNode(e){return!!e&&(e instanceof CommentNode&&e.type===n.ComponentValueType.Comment)}}function consumeComment(e,n){return{advance:1,node:new CommentNode(n[0])}}function consumeAllCommentsAndWhitespace(e,n){const o=[];let t=0;for(;;)if(n[t][0]!==r.TokenType.Whitespace){if(n[t][0]!==r.TokenType.Comment)return{advance:t,nodes:o};o.push(new CommentNode(n[t])),t++}else{const e=consumeWhitespace(0,n.slice(t));t+=e.advance,o.push(e.node)}}class TokenNode{type=n.ComponentValueType.Token;value;constructor(e){this.value=e}tokens(){return[this.value]}toString(){return r.stringify(this.value)}toJSON(){return{type:this.type,tokens:this.tokens()}}isTokenNode(){return TokenNode.isTokenNode(this)}static isTokenNode(e){return!!e&&(e instanceof TokenNode&&e.type===n.ComponentValueType.Token)}}function isSimpleBlockNode(e){return SimpleBlockNode.isSimpleBlockNode(e)}function isFunctionNode(e){return FunctionNode.isFunctionNode(e)}n.CommentNode=CommentNode,n.FunctionNode=FunctionNode,n.SimpleBlockNode=SimpleBlockNode,n.TokenNode=TokenNode,n.WhitespaceNode=WhitespaceNode,n.consumeAllCommentsAndWhitespace=consumeAllCommentsAndWhitespace,n.consumeComment=consumeComment,n.consumeComponentValue=consumeComponentValue,n.consumeFunction=consumeFunction,n.consumeSimpleBlock=consumeSimpleBlock,n.consumeWhitespace=consumeWhitespace,n.gatherNodeAncestry=function gatherNodeAncestry(e){const n=new Map;return e.walk((e=>{Array.isArray(e.node)?e.node.forEach((o=>{n.set(o,e.parent)})):n.set(e.node,e.parent)})),n},n.isCommentNode=function isCommentNode(e){return CommentNode.isCommentNode(e)},n.isFunctionNode=isFunctionNode,n.isSimpleBlockNode=isSimpleBlockNode,n.isTokenNode=function isTokenNode(e){return TokenNode.isTokenNode(e)},n.isWhitespaceNode=function isWhitespaceNode(e){return WhitespaceNode.isWhitespaceNode(e)},n.parseCommaSeparatedListOfComponentValues=function parseCommaSeparatedListOfComponentValues(e,n){const o={onParseError:(null==n?void 0:n.onParseError)??(()=>{})},t=[...e];if(0===e.length)return[];t[t.length-1][0]!==r.TokenType.EOF&&t.push([r.TokenType.EOF,"",t[t.length-1][2],t[t.length-1][3],void 0]);const s=[];let i=[],a=0;for(;;){if(!t[a]||t[a][0]===r.TokenType.EOF)return i.length&&s.push(i),s;if(t[a][0]===r.TokenType.Comma){s.push(i),i=[],a++;continue}const n=consumeComponentValue(o,e.slice(a));i.push(n.node),a+=n.advance}},n.parseComponentValue=function parseComponentValue(e,n){const o={onParseError:(null==n?void 0:n.onParseError)??(()=>{})},t=[...e];t[t.length-1][0]!==r.TokenType.EOF&&t.push([r.TokenType.EOF,"",t[t.length-1][2],t[t.length-1][3],void 0]);const s=consumeComponentValue(o,t);if(t[Math.min(s.advance,t.length-1)][0]===r.TokenType.EOF)return s.node;o.onParseError(new r.ParseError("Expected EOF after parsing a component value.",e[0][2],e[e.length-1][3],["5.3.9. Parse a component value","Expected EOF"]))},n.parseListOfComponentValues=function parseListOfComponentValues(e,n){const o={onParseError:(null==n?void 0:n.onParseError)??(()=>{})},t=[...e];t[t.length-1][0]!==r.TokenType.EOF&&t.push([r.TokenType.EOF,"",t[t.length-1][2],t[t.length-1][3],void 0]);const s=[];let i=0;for(;;){if(!t[i]||t[i][0]===r.TokenType.EOF)return s;const e=consumeComponentValue(o,t.slice(i));s.push(e.node),i+=e.advance}},n.replaceComponentValues=function replaceComponentValues(e,n){for(let o=0;o<e.length;o++){const t=e[o];for(let e=0;e<t.length;e++){const o=t[e];{const r=n(o);if(r){t.splice(e,1,r);continue}}(isSimpleBlockNode(o)||isFunctionNode(o))&&o.walk(((e,o)=>{if("number"!=typeof o)return;const t=e.node,r=n(t);r&&e.parent.value.splice(o,1,r)}))}}return e},n.stringify=function stringify(e){return e.map((e=>e.map((e=>r.stringify(...e.tokens()))).join(""))).join(",")}},484:(e,n)=>{class ParseError extends Error{sourceStart;sourceEnd;parserState;constructor(e,n,o,t){super(e),this.name="ParseError",this.sourceStart=n,this.sourceEnd=o,this.parserState=t}}class Reader{cursor;source="";codePointSource=[];length=0;representationStart=0;representationEnd=-1;constructor(e){this.cursor=0,this.source=e,this.length=e.length,this.codePointSource=new Array(this.length);for(let e=0;e<this.length;e++)this.codePointSource[e]=this.source.charCodeAt(e)}advanceCodePoint(e=1){this.cursor+=e,this.representationEnd=this.cursor-1}readCodePoint(e=1){const n=this.codePointSource[this.cursor];return void 0!==n&&(this.cursor+=e,this.representationEnd=this.cursor-1,n)}unreadCodePoint(e=1){this.cursor-=e,this.representationEnd=this.cursor-1}}var o,t,r;n.TokenType=void 0,(o=n.TokenType||(n.TokenType={})).Comment="comment",o.AtKeyword="at-keyword-token",o.BadString="bad-string-token",o.BadURL="bad-url-token",o.CDC="CDC-token",o.CDO="CDO-token",o.Colon="colon-token",o.Comma="comma-token",o.Delim="delim-token",o.Dimension="dimension-token",o.EOF="EOF-token",o.Function="function-token",o.Hash="hash-token",o.Ident="ident-token",o.Number="number-token",o.Percentage="percentage-token",o.Semicolon="semicolon-token",o.String="string-token",o.URL="url-token",o.Whitespace="whitespace-token",o.OpenParen="(-token",o.CloseParen=")-token",o.OpenSquare="[-token",o.CloseSquare="]-token",o.OpenCurly="{-token",o.CloseCurly="}-token",n.NumberType=void 0,(t=n.NumberType||(n.NumberType={})).Integer="integer",t.Number="number",function(e){e.Unrestricted="unrestricted",e.ID="id"}(r||(r={}));const s=Object.values(n.TokenType);const i=39,a=42,c=8,u=13,d=9,p=58,l=44,m=64,f=127,T=33,h=12,k=46,C=62,S=45,y=31,v=69,P=101,E=123,g=40,w=91,N=60,O=10,I=11,F=95,L=1114111,b=0,A=35,W=37,x=43,D=34,V=65533,U=92,R=125,B=41,q=93,_=59,M=14,H=47,$=32;function checkIfFourCodePointsWouldStartCDO(e,n){return n.codePointSource[n.cursor]===N&&n.codePointSource[n.cursor+1]===T&&n.codePointSource[n.cursor+2]===S&&n.codePointSource[n.cursor+3]===S}function isDigitCodePoint(e){return e>=48&&e<=57}function isUppercaseLetterCodePoint(e){return e>=65&&e<=90}function isLowercaseLetterCodePoint(e){return e>=97&&e<=122}function isHexDigitCodePoint(e){return isDigitCodePoint(e)||e>=97&&e<=102||e>=65&&e<=70}function isLetterCodePoint(e){return isLowercaseLetterCodePoint(e)||isUppercaseLetterCodePoint(e)}function isNonASCIICodePoint(e){return e>=128}function isIdentStartCodePoint(e){return isLetterCodePoint(e)||isNonASCIICodePoint(e)||e===F}function isIdentCodePoint(e){return isIdentStartCodePoint(e)||isDigitCodePoint(e)||e===S}function isNewLine(e){return 10===e||13===e||12===e}function isWhitespace(e){return 32===e||10===e||9===e||13===e||12===e}function checkIfTwoCodePointsAreAValidEscape(e,n){return n.codePointSource[n.cursor]===U&&!isNewLine(n.codePointSource[n.cursor+1])}function checkIfThreeCodePointsWouldStartAnIdentSequence(e,n){return n.codePointSource[n.cursor]===S?n.codePointSource[n.cursor+1]===S||(!!isIdentStartCodePoint(n.codePointSource[n.cursor+1])||n.codePointSource[n.cursor+1]===U&&!isNewLine(n.codePointSource[n.cursor+2])):!!isIdentStartCodePoint(n.codePointSource[n.cursor])||checkIfTwoCodePointsAreAValidEscape(0,n)}function checkIfThreeCodePointsWouldStartANumber(e,n){return n.codePointSource[n.cursor]===x||n.codePointSource[n.cursor]===S?!!isDigitCodePoint(n.codePointSource[n.cursor+1])||n.codePointSource[n.cursor+1]===k&&isDigitCodePoint(n.codePointSource[n.cursor+2]):n.codePointSource[n.cursor]===k?isDigitCodePoint(n.codePointSource[n.cursor+1]):isDigitCodePoint(n.codePointSource[n.cursor])}function checkIfTwoCodePointsStartAComment(e,n){return n.codePointSource[n.cursor]===H&&n.codePointSource[n.cursor+1]===a}function checkIfThreeCodePointsWouldStartCDC(e,n){return n.codePointSource[n.cursor]===S&&n.codePointSource[n.cursor+1]===S&&n.codePointSource[n.cursor+2]===C}function consumeComment(e,o){for(o.advanceCodePoint(2);;){const n=o.readCodePoint();if(!1===n){e.onParseError(new ParseError("Unexpected EOF while consuming a comment.",o.representationStart,o.representationEnd,["4.3.2. Consume comments","Unexpected EOF"]));break}if(n===a&&(void 0!==o.codePointSource[o.cursor]&&o.codePointSource[o.cursor]===H)){o.advanceCodePoint();break}}return[n.TokenType.Comment,o.source.slice(o.representationStart,o.representationEnd+1),o.representationStart,o.representationEnd,void 0]}function consumeEscapedCodePoint(e,n){const o=n.readCodePoint();if(!1===o)return e.onParseError(new ParseError("Unexpected EOF while consuming an escaped code point.",n.representationStart,n.representationEnd,["4.3.7. Consume an escaped code point","Unexpected EOF"])),V;if(isHexDigitCodePoint(o)){const e=[o];for(;void 0!==n.codePointSource[n.cursor]&&isHexDigitCodePoint(n.codePointSource[n.cursor])&&e.length<6;)e.push(n.codePointSource[n.cursor]),n.advanceCodePoint();isWhitespace(n.codePointSource[n.cursor])&&n.advanceCodePoint();const r=parseInt(String.fromCharCode(...e),16);return 0===r?V:(t=r)>=55296&&t<=57343||r>L?V:r}var t;return o}function consumeIdentSequence(e,n){const o=[];for(;;)if(isIdentCodePoint(n.codePointSource[n.cursor]))o.push(n.codePointSource[n.cursor]),n.advanceCodePoint();else{if(!checkIfTwoCodePointsAreAValidEscape(0,n))return o;n.advanceCodePoint(),o.push(consumeEscapedCodePoint(e,n))}}function consumeHashToken(e,o){if(o.advanceCodePoint(),void 0!==o.codePointSource[o.cursor]&&(isIdentCodePoint(o.codePointSource[o.cursor])||checkIfTwoCodePointsAreAValidEscape(0,o))){let t=r.Unrestricted;checkIfThreeCodePointsWouldStartAnIdentSequence(0,o)&&(t=r.ID);const s=consumeIdentSequence(e,o);return[n.TokenType.Hash,o.source.slice(o.representationStart,o.representationEnd+1),o.representationStart,o.representationEnd,{value:String.fromCharCode(...s),type:t}]}return[n.TokenType.Delim,"#",o.representationStart,o.representationEnd,{value:"#"}]}function consumeNumber(e,o){let t=n.NumberType.Integer;for(o.codePointSource[o.cursor]!==x&&o.codePointSource[o.cursor]!==S||o.advanceCodePoint();isDigitCodePoint(o.codePointSource[o.cursor]);)o.advanceCodePoint();if(o.codePointSource[o.cursor]===k&&isDigitCodePoint(o.codePointSource[o.cursor+1]))for(o.advanceCodePoint(2),t=n.NumberType.Number;isDigitCodePoint(o.codePointSource[o.cursor]);)o.advanceCodePoint();if(o.codePointSource[o.cursor]===P||o.codePointSource[o.cursor]===v){if(isDigitCodePoint(o.codePointSource[o.cursor+1]))o.advanceCodePoint(2);else{if(o.codePointSource[o.cursor+1]!==S&&o.codePointSource[o.cursor+1]!==x||!isDigitCodePoint(o.codePointSource[o.cursor+2]))return t;o.advanceCodePoint(3)}for(t=n.NumberType.Number;isDigitCodePoint(o.codePointSource[o.cursor]);)o.advanceCodePoint()}return t}function consumeNumericToken(e,o){const t=consumeNumber(0,o),r=parseFloat(o.source.slice(o.representationStart,o.representationEnd+1));if(checkIfThreeCodePointsWouldStartAnIdentSequence(0,o)){const s=consumeIdentSequence(e,o);return[n.TokenType.Dimension,o.source.slice(o.representationStart,o.representationEnd+1),o.representationStart,o.representationEnd,{value:r,type:t,unit:String.fromCharCode(...s)}]}return o.codePointSource[o.cursor]===W?(o.advanceCodePoint(),[n.TokenType.Percentage,o.source.slice(o.representationStart,o.representationEnd+1),o.representationStart,o.representationEnd,{value:r}]):[n.TokenType.Number,o.source.slice(o.representationStart,o.representationEnd+1),o.representationStart,o.representationEnd,{value:r,type:t}]}function consumeWhiteSpace(e,o){for(;isWhitespace(o.codePointSource[o.cursor]);)o.advanceCodePoint();return[n.TokenType.Whitespace,o.source.slice(o.representationStart,o.representationEnd+1),o.representationStart,o.representationEnd,void 0]}function consumeStringToken(e,o){let t="";const r=o.readCodePoint();for(;;){const s=o.readCodePoint();if(!1===s)return e.onParseError(new ParseError("Unexpected EOF while consuming a string token.",o.representationStart,o.representationEnd,["4.3.5. Consume a string token","Unexpected EOF"])),[n.TokenType.String,o.source.slice(o.representationStart,o.representationEnd+1),o.representationStart,o.representationEnd,{value:t}];if(isNewLine(s))return e.onParseError(new ParseError("Unexpected newline while consuming a string token.",o.representationStart,o.representationEnd,["4.3.5. Consume a string token","Unexpected newline"])),o.unreadCodePoint(),[n.TokenType.BadString,o.source.slice(o.representationStart,o.representationEnd+1),o.representationStart,o.representationEnd,void 0];if(s===r)return[n.TokenType.String,o.source.slice(o.representationStart,o.representationEnd+1),o.representationStart,o.representationEnd,{value:t}];if(s!==U)t+=String.fromCharCode(s);else{if(void 0===o.codePointSource[o.cursor])continue;if(isNewLine(o.codePointSource[o.cursor])){o.advanceCodePoint();continue}t+=String.fromCharCode(consumeEscapedCodePoint(e,o))}}}const j="u".charCodeAt(0),z="U".charCodeAt(0),J="r".charCodeAt(0),K="R".charCodeAt(0),Q="l".charCodeAt(0),G="L".charCodeAt(0);function checkIfCodePointsMatchURLIdent(e,n){return 3===n.length&&((n[0]===j||n[0]===z)&&((n[1]===J||n[1]===K)&&(n[2]===Q||n[2]===G)))}function consumeBadURL(e,n){for(;;){if(void 0===n.codePointSource[n.cursor])return;if(n.codePointSource[n.cursor]===B)return void n.advanceCodePoint();checkIfTwoCodePointsAreAValidEscape(0,n)?(n.advanceCodePoint(),consumeEscapedCodePoint(e,n)):n.advanceCodePoint()}}function consumeUrlToken(e,o){consumeWhiteSpace(0,o);let t="";for(;;){if(void 0===o.codePointSource[o.cursor])return e.onParseError(new ParseError("Unexpected EOF while consuming a url token.",o.representationStart,o.representationEnd,["4.3.6. Consume a url token","Unexpected EOF"])),[n.TokenType.URL,o.source.slice(o.representationStart,o.representationEnd+1),o.representationStart,o.representationEnd,{value:t}];if(o.codePointSource[o.cursor]===B)return o.advanceCodePoint(),[n.TokenType.URL,o.source.slice(o.representationStart,o.representationEnd+1),o.representationStart,o.representationEnd,{value:t}];if(isWhitespace(o.codePointSource[o.cursor]))return consumeWhiteSpace(0,o),void 0===o.codePointSource[o.cursor]?(e.onParseError(new ParseError("Unexpected EOF while consuming a url token.",o.representationStart,o.representationEnd,["4.3.6. Consume a url token","Consume as much whitespace as possible","Unexpected EOF"])),[n.TokenType.URL,o.source.slice(o.representationStart,o.representationEnd+1),o.representationStart,o.representationEnd,{value:t}]):o.codePointSource[o.cursor]===B?(o.advanceCodePoint(),[n.TokenType.URL,o.source.slice(o.representationStart,o.representationEnd+1),o.representationStart,o.representationEnd,{value:t}]):(consumeBadURL(e,o),[n.TokenType.BadURL,o.source.slice(o.representationStart,o.representationEnd+1),o.representationStart,o.representationEnd,void 0]);if(o.codePointSource[o.cursor]===D||o.codePointSource[o.cursor]===i||o.codePointSource[o.cursor]===g||((r=o.codePointSource[o.cursor])===I||r===f||b<=r&&r<=c||M<=r&&r<=y))return consumeBadURL(e,o),e.onParseError(new ParseError("Unexpected character while consuming a url token.",o.representationStart,o.representationEnd,["4.3.6. Consume a url token","Unexpected U+0022 QUOTATION MARK (\"), U+0027 APOSTROPHE ('), U+0028 LEFT PARENTHESIS (() or non-printable code point"])),[n.TokenType.BadURL,o.source.slice(o.representationStart,o.representationEnd+1),o.representationStart,o.representationEnd,void 0];if(o.codePointSource[o.cursor]===U){if(checkIfTwoCodePointsAreAValidEscape(0,o)){o.advanceCodePoint(),t+=String.fromCharCode(consumeEscapedCodePoint(e,o));continue}return consumeBadURL(e,o),e.onParseError(new ParseError("Invalid escape sequence while consuming a url token.",o.representationStart,o.representationEnd,["4.3.6. Consume a url token","U+005C REVERSE SOLIDUS (\\)","The input stream does not start with a valid escape sequence"])),[n.TokenType.BadURL,o.source.slice(o.representationStart,o.representationEnd+1),o.representationStart,o.representationEnd,void 0]}t+=String.fromCharCode(o.codePointSource[o.cursor]),o.advanceCodePoint()}var r}function consumeIdentLikeToken(e,o){const t=consumeIdentSequence(e,o);if(o.codePointSource[o.cursor]!==g)return[n.TokenType.Ident,o.source.slice(o.representationStart,o.representationEnd+1),o.representationStart,o.representationEnd,{value:String.fromCharCode(...t)}];if(checkIfCodePointsMatchURLIdent(0,t)){o.advanceCodePoint();let r=0;for(;;){const e=isWhitespace(o.codePointSource[o.cursor]),s=isWhitespace(o.codePointSource[o.cursor+1]);if(e&&s){r+=1,o.advanceCodePoint(1);continue}const a=e?o.codePointSource[o.cursor+1]:o.codePointSource[o.cursor];if(a===D||a===i)return r>0&&o.unreadCodePoint(r),[n.TokenType.Function,o.source.slice(o.representationStart,o.representationEnd+1),o.representationStart,o.representationEnd,{value:String.fromCharCode(...t)}];break}return consumeUrlToken(e,o)}return o.advanceCodePoint(),[n.TokenType.Function,o.source.slice(o.representationStart,o.representationEnd+1),o.representationStart,o.representationEnd,{value:String.fromCharCode(...t)}]}function tokenizer(e,o){const t=e.css.valueOf(),r=new Reader(t),s={onParseError:(null==o?void 0:o.onParseError)??(()=>{})};return{nextToken:function nextToken(){if(r.representationStart=r.cursor,r.representationEnd=-1,checkIfTwoCodePointsStartAComment(0,r))return consumeComment(s,r);const e=r.codePointSource[r.cursor];if(void 0===e)return[n.TokenType.EOF,"",-1,-1,void 0];if(isIdentStartCodePoint(e))return consumeIdentLikeToken(s,r);if(isDigitCodePoint(e))return consumeNumericToken(s,r);switch(e){case l:return r.advanceCodePoint(),[n.TokenType.Comma,",",r.representationStart,r.representationEnd,void 0];case p:return r.advanceCodePoint(),[n.TokenType.Colon,":",r.representationStart,r.representationEnd,void 0];case _:return r.advanceCodePoint(),[n.TokenType.Semicolon,";",r.representationStart,r.representationEnd,void 0];case g:return r.advanceCodePoint(),[n.TokenType.OpenParen,"(",r.representationStart,r.representationEnd,void 0];case B:return r.advanceCodePoint(),[n.TokenType.CloseParen,")",r.representationStart,r.representationEnd,void 0];case w:return r.advanceCodePoint(),[n.TokenType.OpenSquare,"[",r.representationStart,r.representationEnd,void 0];case q:return r.advanceCodePoint(),[n.TokenType.CloseSquare,"]",r.representationStart,r.representationEnd,void 0];case E:return r.advanceCodePoint(),[n.TokenType.OpenCurly,"{",r.representationStart,r.representationEnd,void 0];case R:return r.advanceCodePoint(),[n.TokenType.CloseCurly,"}",r.representationStart,r.representationEnd,void 0];case i:case D:return consumeStringToken(s,r);case A:return consumeHashToken(s,r);case x:case k:return checkIfThreeCodePointsWouldStartANumber(0,r)?consumeNumericToken(s,r):(r.advanceCodePoint(),[n.TokenType.Delim,r.source[r.representationStart],r.representationStart,r.representationEnd,{value:r.source[r.representationStart]}]);case O:case u:case h:case d:case $:return consumeWhiteSpace(0,r);case S:return checkIfThreeCodePointsWouldStartANumber(0,r)?consumeNumericToken(s,r):checkIfThreeCodePointsWouldStartCDC(0,r)?(r.advanceCodePoint(3),[n.TokenType.CDC,"--\x3e",r.representationStart,r.representationEnd,void 0]):checkIfThreeCodePointsWouldStartAnIdentSequence(0,r)?consumeIdentLikeToken(s,r):(r.advanceCodePoint(),[n.TokenType.Delim,"-",r.representationStart,r.representationEnd,{value:"-"}]);case N:return checkIfFourCodePointsWouldStartCDO(0,r)?(r.advanceCodePoint(4),[n.TokenType.CDO,"\x3c!--",r.representationStart,r.representationEnd,void 0]):(r.advanceCodePoint(),[n.TokenType.Delim,"<",r.representationStart,r.representationEnd,{value:"<"}]);case m:if(r.advanceCodePoint(),checkIfThreeCodePointsWouldStartAnIdentSequence(0,r)){const e=consumeIdentSequence(s,r);return[n.TokenType.AtKeyword,r.source.slice(r.representationStart,r.representationEnd+1),r.representationStart,r.representationEnd,{value:String.fromCharCode(...e)}]}return[n.TokenType.Delim,"@",r.representationStart,r.representationEnd,{value:"@"}];case U:return checkIfTwoCodePointsAreAValidEscape(0,r)?consumeIdentLikeToken(s,r):(r.advanceCodePoint(),s.onParseError(new ParseError('Invalid escape sequence after "\\"',r.representationStart,r.representationEnd,["4.3.1. Consume a token","U+005C REVERSE SOLIDUS (\\)","The input stream does not start with a valid escape sequence"])),[n.TokenType.Delim,"\\",r.representationStart,r.representationEnd,{value:"\\"}])}return r.advanceCodePoint(),[n.TokenType.Delim,r.source[r.representationStart],r.representationStart,r.representationEnd,{value:r.source[r.representationStart]}]},endOfFile:function endOfFile(){return void 0===r.codePointSource[r.cursor]}}}n.ParseError=ParseError,n.Reader=Reader,n.cloneTokens=function cloneTokens(e){return"undefined"!=typeof globalThis&&"structuredClone"in globalThis?structuredClone(e):JSON.parse(JSON.stringify(e))},n.isToken=function isToken(e){return!!Array.isArray(e)&&(!(e.length<4)&&(!!s.includes(e[0])&&("string"==typeof e[1]&&("number"==typeof e[2]&&"number"==typeof e[3]))))},n.mirrorVariant=function mirrorVariant(e){switch(e[0]){case n.TokenType.OpenParen:return[n.TokenType.CloseParen,")",-1,-1,void 0];case n.TokenType.CloseParen:return[n.TokenType.OpenParen,"(",-1,-1,void 0];case n.TokenType.OpenCurly:return[n.TokenType.CloseCurly,"}",-1,-1,void 0];case n.TokenType.CloseCurly:return[n.TokenType.OpenCurly,"{",-1,-1,void 0];case n.TokenType.OpenSquare:return[n.TokenType.CloseSquare,"]",-1,-1,void 0];case n.TokenType.CloseSquare:return[n.TokenType.OpenSquare,"[",-1,-1,void 0];default:return null}},n.mirrorVariantType=function mirrorVariantType(e){switch(e){case n.TokenType.OpenParen:return n.TokenType.CloseParen;case n.TokenType.CloseParen:return n.TokenType.OpenParen;case n.TokenType.OpenCurly:return n.TokenType.CloseCurly;case n.TokenType.CloseCurly:return n.TokenType.OpenCurly;case n.TokenType.OpenSquare:return n.TokenType.CloseSquare;case n.TokenType.CloseSquare:return n.TokenType.OpenSquare;default:return null}},n.mutateIdent=function mutateIdent(e,n){let o="";const t=new Array(n.length);for(let e=0;e<n.length;e++)t[e]=n.charCodeAt(e);let r=0;t[0]===S&&t[1]===S?(o="--",r=2):t[0]===S&&t[1]?(o="-",r=2,isIdentStartCodePoint(t[1])?o+=n[1]:o+=`\\${t[1].toString(16)} `):isIdentStartCodePoint(t[0])?(o=n[0],r=1):(o=`\\${t[0].toString(16)} `,r=1);for(let e=r;e<t.length;e++)isIdentCodePoint(t[e])?o+=n[e]:o+=`\\${t[e].toString(16)} `;e[1]=o,e[4].value=n},n.stringify=function stringify(...e){let n="";for(let o=0;o<e.length;o++)n+=e[o][1];return n},n.tokenize=function tokenize(e,n){const o=tokenizer(e,n),t=[];{for(;!o.endOfFile();){const e=o.nextToken();e&&t.push(e)}const e=o.nextToken();e&&t.push(e)}return t},n.tokenizer=tokenizer},353:(e,n,o)=>{var t=o(36),r=o(161);const s=r.parse("csstools-implicit-layer")[0];function collectCascadeLayerOrder(e){const n=new Map,o=new Map,t=[];e.walkAtRules((e=>{var i;if("layer"!==e.name.toLowerCase())return;{let n=e.parent;for(;n;){if("atrule"!==n.type||"layer"!==n.name.toLowerCase()){if(n===e.root())break;return}n=n.parent}}let a;if(e.nodes)a=normalizeLayerName(e.params,1);else{if(!e.params.trim())return;a=e.params}let c=r.parse(a);if(null!=(i=c)&&i.length){{let n=e.parent;for(;n&&"atrule"===n.type&&"layer"===n.name.toLowerCase();){const e=o.get(n);e?(c=c.map((n=>e.concat(n))),n=n.parent):n=n.parent}}if(r.addLayerToModel(t,c),e.nodes){const t=c[0].concat(s);n.set(e,t),o.set(e,c[0])}}}));for(const e of n.values())r.addLayerToModel(t,[e]);const i=new WeakMap;for(const[e,o]of n)i.set(e,t.findIndex((e=>o.equal(e))));return i}function cascadeLayerNumberForNode(e,n){return e.parent&&"atrule"===e.parent.type&&"layer"===e.parent.name.toLowerCase()?n.has(e.parent)?n.get(e.parent):-1:1/0}function normalizeLayerName(e,n){return e.trim()?e:"csstools-anon-layer--"+n++}const i=/(!\s*)?postcss-custom-properties:\s*off\b/i,a=new WeakMap;function isBlockIgnored(e){if(!e||!e.nodes)return!1;if(a.has(e))return a.get(e);const n=e.some((e=>isIgnoreComment(e,i)));return a.set(e,n),n}const c=/(!\s*)?postcss-custom-properties:\s*ignore\s+next\b/i;function isDeclarationIgnored(e){return!!e&&(!!isBlockIgnored(e.parent)||isIgnoreComment(e.prev(),c))}function isIgnoreComment(e,n){return!!e&&"comment"===e.type&&n.test(e.text)}const u=new Set(["layer"]);function isProcessableRule(e){if(!isHtmlRule(e)&&!isRootRule(e))return!1;let n=e.parent;for(;n;){if("atrule"===n.type&&!u.has(n.name.toLowerCase()))return!1;n=n.parent}return!0}const d=/^html$/i,p=/^:root$/i;function isHtmlRule(e){return e.selectors.some((e=>d.test(e)))&&e.nodes&&e.nodes.length}function isRootRule(e){return e.selectors.some((e=>p.test(e)))&&e.nodes&&e.nodes.length}const l=/^var$/i;function isVarFunction(e){return"function"===e.type&&l.test(e.value)&&Object(e.nodes).length>0}function removeCyclicReferences(e,n){const o=new Set;let t=n;for(;e.size>0;)try{toposort(Array.from(e.keys()),t);break}catch(n){if(!n._graphNode)throw n;e.delete(n._graphNode),o.add(n._graphNode),t=t.filter((e=>-1===e.indexOf(n._graphNode)))}return o}function toposort(e,n){let o=e.length;const t=new Array(o),r={};let s=o;const i=makeOutgoingEdges(n),a=makeNodesHash(e);for(;s--;)r[s]||visit(e[s],s,new Set);return t;function visit(e,n,s){if(s.has(e)){const n=new Error("Cyclic dependency"+JSON.stringify(e));throw n._graphNode=e,n}if(!a.has(e))return;if(r[n])return;r[n]=!0;let c=i.get(e)||new Set;if(c=Array.from(c),n=c.length){s.add(e);do{const e=c[--n];visit(e,a.get(e),s)}while(n);s.delete(e)}t[--o]=e}}function makeOutgoingEdges(e){const n=new Map;for(let o=0,t=e.length;o<t;o++){const t=e[o];n.has(t[0])||n.set(t[0],new Set),n.has(t[1])||n.set(t[1],new Set),n.get(t[0]).add(t[1])}return n}function makeNodesHash(e){const n=new Map;for(let o=0,t=e.length;o<t;o++)n.set(e[o],o);return n}function getCustomPropertiesFromRoot(e){const n=new Map,o=new Map,r=new Map,s=new Map,i=new Map,a=collectCascadeLayerOrder(e);e.walkRules((e=>{isProcessableRule(e)&&(isBlockIgnored(e)||(isHtmlRule(e)?e.each((e=>{if("decl"!==e.type)return;if(!e.variable||isDeclarationIgnored(e))return;if("initial"===e.value.toLowerCase().trim())return;const o=cascadeLayerNumberForNode(e,a),t=s.get(e.prop)??-1;o&&o>=t&&(s.set(e.prop,o),n.set(e.prop,e.value))})):isRootRule(e)&&e.each((e=>{if("decl"!==e.type)return;if(!e.variable||isDeclarationIgnored(e))return;if("initial"===e.value.toLowerCase().trim())return;const n=cascadeLayerNumberForNode(e,a),t=i.get(e.prop)??-1;n&&n>=t&&(i.set(e.prop,n),o.set(e.prop,e.value))}))))}));for(const[e,o]of n.entries())r.set(e,o);for(const[e,n]of o.entries())r.set(e,n);const c=[],u=new Map;for(const[e,n]of r.entries()){const o=t(n);t.walk(o.nodes,(n=>{if(isVarFunction(n)){const[o]=n.nodes.filter((e=>"word"===e.type));c.push([o.value,e])}})),u.set(e,t(n))}return removeCyclicReferences(u,c),u}function transformValueAST(e,n){if(e.nodes&&e.nodes.length){const o=new Map;e.nodes.forEach((n=>{o.set(n,e)})),t.walk(e.nodes,(e=>{"nodes"in e&&e.nodes.length&&e.nodes.forEach((n=>{o.set(n,e)}))})),t.walk(e.nodes,(e=>{if(!isVarFunction(e))return;const[r,...s]=e.nodes.filter((e=>"div"!==e.type)),{value:i}=r,a=o.get(e);if(!a)return;const c=a.nodes.indexOf(e);if(-1===c)return;let u=!1;s&&t.walk(s,(e=>{if(isVarFunction(e)){const[o]=e.nodes.filter((e=>"word"===e.type));if(n.has(o.value))return;return u=!0,!1}}));let d=[];if(n.has(i)){var p;d=(null==(p=n.get(i))?void 0:p.nodes)??[]}else{if(!s.length||u)return;d=e.nodes.slice(e.nodes.indexOf(s[0]))}d.length?(a.nodes.splice(c,1,...d),a.nodes.forEach((e=>o.set(e,a)))):(a.nodes.splice(c,1,{type:"comment",value:"",sourceIndex:e.sourceIndex,sourceEndIndex:e.sourceEndIndex}),a.nodes.forEach((e=>o.set(e,a))))}),!0)}return e.toString()}var transformProperties=(e,n,o)=>{if(isTransformableDecl(e)&&!isDeclarationIgnored(e)){const i=e.value;let a=transformValueAST(t(i),n);const c=new Set;for(;a.includes("--")&&a.toLowerCase().includes("var(")&&!c.has(a);){c.add(a);a=transformValueAST(t(a),n)}if(a!==i){if(parentHasExactFallback(e,a))return void(o.preserve||e.remove());if(o.preserve){var r;const n=e.cloneBefore({value:a});hasTrailingComment(n)&&null!=(r=n.raws)&&r.value&&(n.raws.value.value=n.value.replace(m,"$1"),n.raws.value.raw=n.raws.value.value+n.raws.value.raw.replace(m,"$2"))}else{var s;e.value=a,hasTrailingComment(e)&&null!=(s=e.raws)&&s.value&&(e.raws.value.value=e.value.replace(m,"$1"),e.raws.value.raw=e.raws.value.value+e.raws.value.raw.replace(m,"$2"))}}}};const isTransformableDecl=e=>!e.variable&&e.value.includes("--")&&e.value.toLowerCase().includes("var("),hasTrailingComment=e=>{var n,o;return"value"in Object(Object(e.raws).value)&&"raw"in((null==(n=e.raws)?void 0:n.value)??{})&&m.test((null==(o=e.raws.value)?void 0:o.raw)??"")},m=/^([\W\w]+)(\s*\/\*[\W\w]+?\*\/)$/;function parentHasExactFallback(e,n){if(!e||!e.parent)return!1;let o=!1;const t=e.parent.index(e);return e.parent.each(((r,s)=>r!==e&&(!(s>=t)&&void("decl"===r.type&&r.prop.toLowerCase()===e.prop.toLowerCase()&&r.value===n&&(o=!0))))),o}const creator=e=>{const n=!("preserve"in Object(e))||Boolean(null==e?void 0:e.preserve);if("importFrom"in Object(e))throw new Error('[postcss-custom-properties] "importFrom" is no longer supported');if("exportTo"in Object(e))throw new Error('[postcss-custom-properties] "exportTo" is no longer supported');return{postcssPlugin:"postcss-custom-properties",prepare:()=>{let e=new Map;return{Once:n=>{e=getCustomPropertiesFromRoot(n)},Declaration:o=>{let r=e;if(n&&o.parent){let n=!1;o.parent.each((s=>{o!==s&&"decl"===s.type&&s.variable&&!isDeclarationIgnored(s)&&(n||(r=new Map(e),n=!0),"initial"!==s.value.toLowerCase().trim()?r.set(s.prop,t(s.value)):r.delete(s.prop))}))}transformProperties(o,r,{preserve:n})}}}}};creator.postcss=!0,e.exports=creator}};var n={};function __nccwpck_require__(o){var t=n[o];if(t!==undefined){return t.exports}var r=n[o]={exports:{}};var s=true;try{e[o](r,r.exports,__nccwpck_require__);s=false}finally{if(s)delete n[o]}return r.exports}if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var o=__nccwpck_require__(353);module.exports=o})();