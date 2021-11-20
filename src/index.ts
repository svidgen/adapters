import { ulid } from 'ulid';

export function validateHasId<T>(item: T, pk: string) {
	if (typeof (item as any)[pk] === 'undefined') {
		throw new Error(`${item} does not have the expected PK: (${pk}).`);
	}
}

export class Collection<
	PK extends string = 'id',
	T extends {[key in PK]: any} = {[key in PK]: any} & Record<string, any>
> {
	validate: (item: T, pk: PK) => any;
	pk: PK;
	items: T[];
	// indexes: Collection<T>[];

	constructor({
		validate = validateHasId,
		pk = 'id' as PK,
		items = []
	}: Partial<Collection<PK, T>> = {}) {
		this.validate = validate;
		this.pk = pk;
		this.items = items as T[];
	}
}