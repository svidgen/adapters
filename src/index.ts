import { ulid } from 'ulid';

type JoinOptions<FROM, TO> = {
	from?: keyof FROM;
	to?: keyof TO;
	as?: string;
	name? string;
};

export function validateHasId<T>(item: T, pk: keyof T) {
	if (typeof (item as any)[pk] === 'undefined') {
		throw new Error(`${item} does not have the expected PK: (${pk}).`);
	}
}

export class Collection<T = Record<string, JSON>> {
	name: string;
	validate: (item: T, pk: keyof T) => any;
	pk: keyof T;

	// TODO: replace with b-tree(s)
	private items = new Map<string, T>();

	constructor({
		name = ulid(),
		keygen = ulid,
		validate = validateHasId,
		pk = 'id',
		items = []
		join,
		from,
		to,
		as,
		recurse
	}: (Partial<Collection<T>> & { items?: T[] }) = {}) {
		this.validate = validate;
		this.pk = pk;
		this.put(items);
		this.from = from;
		this.to = to;
		this.joinAs = as;
		this.recurse = recurse || (items === join);
		this.joinedTo = this.recurse ? this : join;
		this.joinedAsParent = this.pk === this.from || !this.from;
		this.joinedAsChild = this.pk !== this.from;
		this.joinedToMany = this.joinedTo && (this.joinedTo.pk !== this.to);
	}

	[Symbol.asyncIterator]() {
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
					done: true,
					value: null 
				};
			},
		};
	}

	async get(pk: T[typeof this.pk]) {
		return this.items.get(pk);
	}

	async put(items: T | T[]): Promise<T[]> {
		const saved: T[] = [];

		for (const item of items) {
			const itemCopy = {...item} as T;

			const pk = itemCopy[this.pk];
			if (!itemCopy[this.pk]) {
				itemCopy[this.pk] = ulid() as typeof item[this.pk];
			}

			this.items.set(itemCopy[this.pk], itemCopy);
			saved.push(itemCopy);
		}

		return saved;
	}

	join<TO>(
		to: Collection<TO>,
		{from, to, as, name}: JoinOptions<T, TO>
	) {
		return new Collection<T & TO>({
			pk: this.pk,
			items: this,
			name: name || `${this.name}_to_${table.name}`,
			join: table,
			as: as || 'join',
			from: from || this.pk,
			to: to || table.pk
		});
	}
}
