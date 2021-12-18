import { ulid } from 'ulid';

type ModelWithPK<PK extends string> = {
	[key in PK]: string
};

export function validateHasId<T>(item: T, pk: string) {
	if (typeof (item as any)[pk] === 'undefined') {
		throw new Error(`${item} does not have the expected PK: (${pk}).`);
	}
}

export class Collection<
	PK extends string = 'id',
	T extends ModelWithPK<PK> = ModelWithPK<PK> & Record<string, any>
> implements AsyncIterable<T> {
	validate: (item: T, pk: PK) => any;
	pk: PK;

	// TODO: replace with b-tree(s)
	private items = new Map<string, T>();

	constructor({
		validate = validateHasId,
		pk = 'id' as PK,
		items = []
	}: (Partial<Collection<PK, T>> & { items?: T[] }) = {}) {
		this.validate = validate;
		this.pk = pk;
		items.forEach(item => this.put(item));
	}

	[Symbol.asyncIterator](): AsyncIterator<T> {
		const keys = Array.from(this.items.keys()).sort();
		let i = 0;
		return {
			next: async () => {
				if (i < keys.length) {
					const result = {
						value: await this.get(keys[i]),
						done: false,
					};
					i++;
					return result;
				}
				return {
					value: undefined,
					done: true,
				};
			},
		};
	}

	async get(pk: string) {
		return this.items.get(pk);
	}

	async put(item: Omit<T, PK> & Partial<ModelWithPK<PK>>): Promise<T> {
		const itemCopy = {...item} as T;

		const pk = itemCopy[this.pk];
		if (!itemCopy[this.pk]) {
			itemCopy[this.pk] = ulid() as T[PK];
		}

		this.items.set(itemCopy[this.pk], itemCopy);

		return itemCopy as T;
	}

}
