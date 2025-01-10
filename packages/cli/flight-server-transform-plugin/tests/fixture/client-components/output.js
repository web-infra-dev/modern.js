/* @modern-js-rsc-metadata
{"directive":"client","exportNames":[{"exportName":"ClassA","id":"tests/fixture/client-components/input.tsx#ClassA"},{"exportName":"ComponentA","id":"tests/fixture/client-components/input.tsx#ComponentA"},{"exportName":"MemoizedComponentA","id":"tests/fixture/client-components/input.tsx#MemoizedComponentA"},{"exportName":"ComponentB","id":"tests/fixture/client-components/input.tsx#ComponentB"},{"exportName":"foo","id":"tests/fixture/client-components/input.tsx#foo"},{"exportName":"ComponentC","id":"tests/fixture/client-components/input.tsx#ComponentC"},{"exportName":"ComponentD","id":"tests/fixture/client-components/input.tsx#ComponentD"},{"exportName":"bar","id":"tests/fixture/client-components/input.tsx#bar"},{"exportName":"ComponentE","id":"tests/fixture/client-components/input.tsx#ComponentE"},{"exportName":"ComponentF","id":"tests/fixture/client-components/input.tsx#ComponentF"},{"exportName":"default","id":"tests/fixture/client-components/input.tsx#default"}]}*/
"use client";
import { registerClientReference } from "@modern-js/runtime/rsc/server";
function createClientReferenceProxy(exportName) {
    const filename = "tests/fixture/client-components/input.tsx";
    return ()=>{
        throw new Error(`Attempted to call ${exportName}() from the server of ${filename} but ${exportName} is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.`);
    };
}
export const ClassA = registerClientReference(createClientReferenceProxy("ClassA"), "tests/fixture/client-components/input.tsx#ClassA", "ClassA");
export const ComponentA = registerClientReference(createClientReferenceProxy("ComponentA"), "tests/fixture/client-components/input.tsx#ComponentA", "ComponentA");
export const MemoizedComponentA = registerClientReference(createClientReferenceProxy("MemoizedComponentA"), "tests/fixture/client-components/input.tsx#MemoizedComponentA", "MemoizedComponentA");
export const ComponentB = registerClientReference(createClientReferenceProxy("ComponentB"), "tests/fixture/client-components/input.tsx#ComponentB", "ComponentB");
export const foo = registerClientReference(createClientReferenceProxy("foo"), "tests/fixture/client-components/input.tsx#foo", "foo");
export const ComponentC = registerClientReference(createClientReferenceProxy("ComponentC"), "tests/fixture/client-components/input.tsx#ComponentC", "ComponentC");
export const ComponentD = registerClientReference(createClientReferenceProxy("ComponentD"), "tests/fixture/client-components/input.tsx#ComponentD", "ComponentD");
export const bar = registerClientReference(createClientReferenceProxy("bar"), "tests/fixture/client-components/input.tsx#bar", "bar");
export const ComponentE = registerClientReference(createClientReferenceProxy("ComponentE"), "tests/fixture/client-components/input.tsx#ComponentE", "ComponentE");
export const ComponentF = registerClientReference(createClientReferenceProxy("ComponentF"), "tests/fixture/client-components/input.tsx#ComponentF", "ComponentF");
export default registerClientReference(createClientReferenceProxy("default"), "tests/fixture/client-components/input.tsx#default", "default");
