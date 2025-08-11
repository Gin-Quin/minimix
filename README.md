# Minimix

Minimix is the ultimate mixin library for TypeScript, offering a lightweight and powerful solution for class composition. At just 604 bytes gzipped, it provides a feature-rich alternative to existing mixin libraries while maintaining a minimal footprint.

## Features

### Core Features

- 553 bytes of gzipped code with no dependencies
- Native `instanceof` support for mixed classes
- Support for mixing primitive types (Array, Set, Map) while maintaining their original behavior
- Full support for abstract classes
- Static property inheritance
- Support for mixing classes that extend other classes
- Support for mixing already-mixed classes
- Support generic classes using factory functions

### Advantages Over `ts-mixer`

`ts-mixer` is a popular mixin library for TypeScript, but it has some limitations that Minimix addresses:

1. **Unsafe constructor parameters**: `ts-mixer` will pass the same parameters to all mixed constructors, **even if they expect different types of parameters**.
1. **Limit on the number of classes**: `ts-mixer` is limited to mixing 10 classes at a time, while Minimix can mix an arbitrary number of classes
2. **No instanceof support**: `ts-mixer` does not support `instanceof` checks
3. **No Primitive Types**: `ts-mixer` does not support mixing primitive types like `Array` or `Set`

One advantage of `ts-mixer` is that it has better support for decorators.

## Installation

Using the `npm` registry:
```bash
bun add @gin-quin/minimix
```

Using the `jsr` registry:
```bash
bun x jsr add @gin-quin/minimix
```

## Quick Start

```typescript
import { Mix } from '@gin-quin/minimix';

class Foo {
    protected makeFoo() {
        return 'foo';
    }
}

class Bar {
    protected makeBar() {
        return 'bar';
    }
}

class FooBar extends Mix(Foo, Bar) {
    // With minimix, explicit constructor parameters are required
    constructor() {
        super(
            [], // Foo constructor parameters (empty array because Foo has no constructor parameters)
            [], // Bar constructor parameters (empty array because Bar has no constructor parameters)
        );
    }

    makeFooBar() {
        return this.makeFoo() + this.makeBar();
    }
}

const fooBar = new FooBar();
console.log(fooBar.makeFooBar());  // "foobar"

console.log(fooBar instanceof Foo); // true
console.log(fooBar instanceof Bar); // true
console.log(fooBar instanceof FooBar); // true
```

## Advanced Usage

### Mixing Constructors

```typescript
class Foo {
    constructor(foo: string) {}
}

class Bar {
    constructor(bar: number) {}
}

class FooBar extends Mix(Foo, Bar) {
    constructor() {
        super(
          ['foo'], // Foo constructor parameters
          [42], // Bar constructor parameters
        );
    }
}
```


### Mixing Primitive Types

`minimix` allows you to mix primitive types like `Array` or `Set` while maintaining their original behavior.

For this, make sure the primitive type should be passed as the first argument to the `Mix` function.

```typescript
class CustomArray extends Mix(Array<number>, SomeClass) {
    // The result is a regular array with additional functionality
    constructor(...values: Array<number>) {
        super(
            values, // Array constructor parameters
            [], // SomeClass constructor parameters
        );
    }
}

const customArray = new CustomArray();
console.log(customArray); // [1, 2, 3]
```

⚠️ If possible, the extended class should have the same constructor signature as the primitive type! Otherwise, it can cause issues, when using methods like `slice`, that call the constructor expecting the wrong arguments.

There are two ways to avoid this:

1. Make sure the extended class has the same constructor signature as the primitive type.
2. Overwrite all methods that call the constructor, like `slice`.

### Mixing Generic Classes

Mixing generic classes is made extremely hard by TypeScript. One of the workarounds is to use a **factory**, i.e. a function that returns a class:

```typescript
import { Mix } from '@gin-quin/minimix';

class Foo<T> {
    fooMethod(input: T): T {
        return input;
    }
}

class Bar<T> {
    barMethod(input: T): T {
        return input;
    }
}

// ❌ This does not work:

class FooBar<T1, T2> extends Mix(Foo<T1>, Bar<T2>) {
    fooBarMethod(input1: T1, input2: T2) {
        return [this.fooMethod(input1), this.barMethod(input2)];
    }
}

// ✅ This works:

const FooBarFactory = <T1, T2>() => class FooBar extends Mix(Foo<T1>, Bar<T2>) {
    fooBarMethod(input1: T1, input2: T2) {
        return [this.fooMethod(input1), this.barMethod(input2)];
    }
}
```

This has two drawbacks:

1. a new class is created for each call,
2. you have to call the factory function to get the class, which hurts the developer experience.

To solve the first issue, we can use the `reuse` utility function, that will memoize the class:

```typescript
import { reuse } from '@gin-quin/minimix/reuse';

// memoize the class while allowing generic types
const FooBarFactory = <T1, T2>() => reuse(
    FooBarFactory,
    class FooBar extends Mix(Foo<T1>, Bar<T2>) {
        fooBarMethod(input1: T1, input2: T2) {
            return [this.fooMethod(input1), this.barMethod(input2)];
        }
    }
);
```

Then, to enhance the developer experience, you can create a type and a function constructor:

```typescript
type FooBar<T1, T2> = InstanceType<ReturnType<typeof FooBarFactory<T1, T2>>>;

const createFooBar = <T1, T2>(t1: T1, t2: T2): FooBar<T1, T2> => {
    const FooBar = FooBarFactory<T1, T2>();
    return new FooBar([t1], [t2]);
};

// The user can now use the constructor function to create a new instance
const fooBar = createFooBar<string, number>("foo", 42);
```

## Using decorators in mixins

Minimix does not currently support decorators that rely on the final "this" object. This is a known limitation, but the same solution as implemented in ts-mixer could be added. Pull requests are welcome for implementing decorator support.
