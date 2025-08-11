import { describe, expect, test } from "bun:test";
import { Mix } from "../library/index";
import { reuse } from "../library/reuse";

describe("Minimix", () => {
	// Basic mixin functionality
	class Foo {
		constructor(public name = "foo") {}

		makeFoo() {
			return "foo";
		}
	}

	class Bar {
		makeBar() {
			return "bar";
		}
	}

	class Baz {
		makeBaz() {
			return "baz";
		}
	}

	class FooBar extends Mix(Foo, Bar) {
		constructor() {
			super([], []);
		}

		public makeFooBar() {
			return this.makeFoo() + this.makeBar();
		}
	}

	// Primitive type mixing test
	class CustomArray extends Mix(Array<number>, Foo) {
		constructor(...values: number[]) {
			super(values, []);
		}

		public makeCustomArray() {
			return this.makeFoo();
		}
	}

	// Static property inheritance test
	class WithStatic {
		static staticValue = "static";
	}

	class MixedWithStatic extends Mix(WithStatic, Foo) {}

	class FooBarBaz extends Mix(Foo, Bar, Baz) {
		constructor() {
			super([], [], []);
		}

		makeFooBarBaz() {
			return this.makeFoo() + this.makeBar() + this.makeBaz();
		}
	}

	test("Basic mixin functionality", () => {
		const fooBar = new FooBar();

		expect(fooBar.makeFooBar()).toBe("foobar");
		expect(fooBar instanceof Foo).toBe(true);
		expect(fooBar instanceof Bar).toBe(true);
		expect(fooBar instanceof FooBar).toBe(true);
	});

	// Constructor parameters test
	class FooWithParams {
		constructor(public foo: string) {}
	}

	class BarWithParams {
		constructor(public bar: string) {}
	}

	class FooBarWithParams extends Mix(FooWithParams, BarWithParams) {
		constructor() {
			super(
				["foo"], // Foo constructor parameters
				["bar"], // Bar constructor parameters
			);
		}
	}

	// Generic classes test
	class GenericFoo<T> {
		constructor(public foo: T) {}

		public fooMethod(input: T): T {
			return input;
		}
	}

	class GenericBar<T> {
		public barMethod(input: T): T {
			return input;
		}
	}

	const GenericFooBarFactory = <T1, T2>() =>
		reuse(
			GenericFooBarFactory,
			class GenericFooBar extends Mix(GenericFoo<T1>, GenericBar<T2>) {
				constructor(t1: T1) {
					super([t1], []);
				}
				fooBarMethod(input: T1, input2: T2): [T1, T2] {
					return [this.fooMethod(input), this.barMethod(input2)];
				}
			},
		);

	// Abstract class test
	abstract class AbstractFoo {
		abstract makeAbstractFoo(): string;
		makeConcreteFoo() {
			return "concrete foo";
		}
	}

	class ConcreteBar {
		makeBar() {
			return "bar";
		}
	}

	class MixedAbstract extends Mix(AbstractFoo, ConcreteBar) {
		constructor() {
			super([], []);
		}

		makeAbstractFoo() {
			return "abstract foo";
		}
	}

	test("Constructor parameters", () => {
		const fooBarWithParams = new FooBarWithParams();
		expect(fooBarWithParams.foo).toBe("foo");
		expect(fooBarWithParams.bar).toBe("bar");
	});

	test("Generic classes", () => {
		const genericFooBar = new (GenericFooBarFactory<string, number>())("test");
		const [str, num] = genericFooBar.fooBarMethod("test", 42);
		expect(GenericFooBarFactory<string, number>()).toBe(
			GenericFooBarFactory<string, number>(),
		);
		expect(str).toBe("test");
		expect(num).toBe(42);
	});

	test("Array mixing", () => {
		const customArray = new CustomArray(1, 2, 3);
		expect(Array.isArray(customArray)).toBe(true);
		expect(customArray.length).toBe(3);
		expect(customArray[0]).toEqual(1);
		expect(customArray[1]).toEqual(2);
		expect(customArray[2]).toEqual(3);
		customArray.push(4);
		expect(customArray.length).toBe(4);
		expect(customArray[3]).toEqual(4);
		expect(customArray.makeCustomArray()).toBe("foo");
		const clonedArray = customArray.slice(1, 2);
		expect(clonedArray).toBeInstanceOf(CustomArray);
	});

	test("Abstract class", () => {
		const mixedAbstract = new MixedAbstract();
		expect(mixedAbstract.makeAbstractFoo()).toBe("abstract foo");
		expect(mixedAbstract.makeConcreteFoo()).toBe("concrete foo");
		expect(mixedAbstract.makeBar()).toBe("bar");
	});

	test("Static property inheritance", () => {
		expect(MixedWithStatic.staticValue).toBe("static");
	});

	test("Multiple inheritance", () => {
		const fooBarBaz = new FooBarBaz();
		expect(fooBarBaz.makeFooBarBaz()).toBe("foobarbaz");
	});
});
