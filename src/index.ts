import { ulid } from 'ulid';

type ModelPK<PK extends string> = {
	[key in PK]: string
};

export function validateHasId<T>(item: T, pk: string) {
	if (typeof (item as any)[pk] === 'undefined') {
		throw new Error(`${item} does not have the expected PK: (${pk}).`);
	}
}

export class Collection<
	PK extends string = 'id',
	T extends ModelPK<PK> = ModelPK<PK> & Record<string, any>
> {
	validate: (item: T, pk: PK) => any;
	pk: PK;
	private items: T[];
	// indexes: Collection<T>[];

	constructor({
		validate = validateHasId,
		pk = 'id' as PK,
		items = []
	}: (Partial<Collection<PK, T>> & { items?: T[] }) = {}) {
		this.validate = validate;
		this.pk = pk;
		this.items = items;
	}

	async get(pk: PK) {

	}

	async put(item: Omit<T, PK> & Partial<ModelPK<PK>>): Promise<T> {
		const itemCopy = {...item} as ModelPK<PK>;

		const pk = itemCopy[this.pk];
		if (!itemCopy[this.pk]) {
			itemCopy[this.pk] = ulid();
		}

		return itemCopy as T;
	}

}