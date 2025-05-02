/**
 * Type representing a constructor function that can be either concrete or abstract
 */
type Constructor =
	| (new (
			...parameters: any[]
	  ) => any)
	| (abstract new (
			...parameters: any[]
	  ) => any);

export const mixOf = Symbol("mixOf");

/**
 * Type representing the static values of a type T
 */
type StaticValues<T> = {
	[K in keyof T]: T[K];
};

/**
 * Utility type that converts a union type to an intersection type
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
	k: infer I,
) => void
	? I
	: never;

/**
 * Converts a tuple of types to their intersection
 */
type TupleToIntersection<T extends any[]> = UnionToIntersection<T[number]>;

/**
 * Gets the static values of a tuple of constructors
 */
type StaticValuesOf<T extends Array<any>> = TupleToIntersection<{
	[K in keyof T]: StaticValues<T[K]>;
}>;

/**
 * Creates a new class that mixes multiple constructors together
 * @param firstConstructor - The base constructor to extend
 * @param constructors - Additional constructors to mix in
 * @returns A new constructor that combines all input constructors
 */
export function Mix<Constructors extends Array<Constructor>>(
	...constructors: Constructors
): (new (
	...parameters: {
		[K in keyof Constructors]: ConstructorParameters<Constructors[K]>;
	}
) => TupleToIntersection<{
	[K in keyof Constructors]: InstanceType<Constructors[K]>;
}>) &
	StaticValuesOf<Constructors> {
	const firstConstructor = constructors[0];

	if (!firstConstructor) {
		return class {} as any;
	}

	if (constructors.length === 1) {
		return firstConstructor as any;
	}

	// biome-ignore lint/style/noNonNullAssertion: We checked the length of the array the line before
	const lastConstructor = constructors.at(-1)!;

	/* ---------------------- 1. Build the prototype chain ---------------------- */
	const clone = clonePrototypeDeep(firstConstructor.prototype);
	const { prototype } = clone;
	let { lastPrototype } = clone;

	for (const nextConstructor of constructors.slice(1)) {
		Object.setPrototypeOf(
			lastPrototype,
			clonePrototypeDeep(nextConstructor.prototype).prototype,
		);
		lastPrototype = Object.getPrototypeOf(lastPrototype);
	}
	Object.setPrototypeOf(lastPrototype, lastConstructor.prototype);

	/* ------ 2. Create the constructor that compose all other constructors ----- */
	const create: any = class extends firstConstructor {
		static [mixOf] = constructors;

		constructor(...parameters: any[]) {
			super(...parameters[0]);

			constructors.slice(1).forEach((nextConstructor, index) => {
				Object.assign(
					this,
					new (nextConstructor as any)(...parameters[index + 1]),
				);
			});
		}
	};

	/* ---------------------- 3. Assign the prototype chain --------------------- */
	Object.setPrototypeOf(create.prototype, prototype);

	/* ----------------------- 4. assign static properties ---------------------- */
	for (const nextConstructor of constructors) {
		Object.assign(create, nextConstructor);
	}

	return create;
}

/**
 * Creates a shallow clone of a prototype object
 * @param prototype - The prototype object to clone
 * @returns A new object with the same properties as the input prototype
 */
function clonePrototype(prototype: any) {
	const clone = Object.create(
		null,
		Object.getOwnPropertyDescriptors(prototype),
	);
	clone.constructor = prototype.constructor;

	const originalInstanceOf = prototype.constructor[Symbol.hasInstance] as
		| ((value: any) => boolean)
		| undefined;

	Object.defineProperty(prototype.constructor, Symbol.hasInstance, {
		value: (instance: any) => {
			return originalInstanceOf?.(instance) || hasPrototype(instance, clone);
		},
		enumerable: false,
		configurable: true,
		writable: true,
	});

	return clone;
}

/**
 * Checks if an instance has a specific prototype in its prototype chain
 * @param instance - The instance to check
 * @param prototype - The prototype to look for
 * @returns True if the prototype is found in the instance's prototype chain
 */
function hasPrototype(instance: any, prototype: any) {
	let currentInstancePrototype = Object.getPrototypeOf(instance);

	while (currentInstancePrototype) {
		if (currentInstancePrototype === prototype) {
			return true;
		}
		currentInstancePrototype = Object.getPrototypeOf(currentInstancePrototype);
	}

	return false;
}

/**
 * Creates a deep clone of a prototype object, including its entire prototype chain
 * @param prototype - The prototype object to clone
 * @returns An object containing the cloned prototype and its last prototype in the chain
 */
function clonePrototypeDeep(prototype: object) {
	const clone = clonePrototype(prototype);
	let lastPrototype = clone;
	let nextPrototype = Object.getPrototypeOf(prototype);
	while (nextPrototype && nextPrototype !== Object.prototype) {
		const nextPrototypeClone = clonePrototype(nextPrototype);
		Object.setPrototypeOf(lastPrototype, nextPrototypeClone);
		nextPrototype = Object.getPrototypeOf(nextPrototype);
		lastPrototype = nextPrototypeClone;
	}
	return { prototype: clone, lastPrototype };
}
