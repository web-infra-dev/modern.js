/* @modern-js-rsc-metadata
{"directive":"client","exportNames":[{"exportName":"ClassA","id":"tests/fixture/client-components-cjs/input.jsx#ClassA"},{"exportName":"ComponentA","id":"tests/fixture/client-components-cjs/input.jsx#ComponentA"},{"exportName":"MemoizedComponentA","id":"tests/fixture/client-components-cjs/input.jsx#MemoizedComponentA"},{"exportName":"ComponentB","id":"tests/fixture/client-components-cjs/input.jsx#ComponentB"},{"exportName":"foo","id":"tests/fixture/client-components-cjs/input.jsx#foo"},{"exportName":"ComponentD","id":"tests/fixture/client-components-cjs/input.jsx#ComponentD"},{"exportName":"bar","id":"tests/fixture/client-components-cjs/input.jsx#bar"},{"exportName":"ComponentE","id":"tests/fixture/client-components-cjs/input.jsx#ComponentE"},{"exportName":"ComponentF","id":"tests/fixture/client-components-cjs/input.jsx#ComponentF"}]}*/
"use client";
import { registerClientReference } from "@modern-js/runtime/rsc/server";
function createClientReferenceProxy(exportName) {
    const filename = "tests/fixture/client-components-cjs/input.jsx";
    return ()=>{
        throw new Error(`Attempted to call ${exportName}() from the server of ${filename} but ${exportName} is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.`);
    };
}
export const ClassA = registerClientReference(createClientReferenceProxy("ClassA"), "tests/fixture/client-components-cjs/input.jsx#ClassA", "ClassA");
export const ComponentA = registerClientReference(createClientReferenceProxy("ComponentA"), "tests/fixture/client-components-cjs/input.jsx#ComponentA", "ComponentA");
export const MemoizedComponentA = registerClientReference(createClientReferenceProxy("MemoizedComponentA"), "tests/fixture/client-components-cjs/input.jsx#MemoizedComponentA", "MemoizedComponentA");
export const ComponentB = registerClientReference(createClientReferenceProxy("ComponentB"), "tests/fixture/client-components-cjs/input.jsx#ComponentB", "ComponentB");
export const foo = registerClientReference(createClientReferenceProxy("foo"), "tests/fixture/client-components-cjs/input.jsx#foo", "foo");
export const ComponentD = registerClientReference(createClientReferenceProxy("ComponentD"), "tests/fixture/client-components-cjs/input.jsx#ComponentD", "ComponentD");
export const bar = registerClientReference(createClientReferenceProxy("bar"), "tests/fixture/client-components-cjs/input.jsx#bar", "bar");
export const ComponentE = registerClientReference(createClientReferenceProxy("ComponentE"), "tests/fixture/client-components-cjs/input.jsx#ComponentE", "ComponentE");
export const ComponentF = registerClientReference(createClientReferenceProxy("ComponentF"), "tests/fixture/client-components-cjs/input.jsx#ComponentF", "ComponentF");

