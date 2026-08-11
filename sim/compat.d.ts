// PXT's simulator shim analyzer uses its bundled TypeScript 2.6 compiler and
// library, where Promise is declared only as a type. The browser runtime and
// the target's TypeScript 4.8 compiler both provide the value.
declare const Promise: PromiseConstructor;
