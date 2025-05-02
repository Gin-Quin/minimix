const reuseSymbol = Symbol("reuse");

export const reuse = <T>(container: any, value: T): T => {
	if (reuseSymbol in container) {
		return container[reuseSymbol];
	}

	Object.defineProperty(container, reuseSymbol, {
		value,
		writable: false,
		enumerable: false,
		configurable: false,
	});

	return value;
};
