import { ulid } from 'ulid';

type JoinOptions<FROM, TO> = {
	from?: string;
	to?: string;
	as?: string;
	name?: string;
};

type CollectionOptions<T extends Record<string, any>, JoinType = never> = Partial<Collection<T>> & {
	items?: T[];
	as?: string;
	join?: JoinType extends Record<string, any> ? Collection<JoinType> : undefined;
};

type Storage<T> = {
	get: (key: string) => Promise<T | undefined>;
	set: (key: string, value: T) => Promise<boolean>;
	find: (predicate: Partial<T>) => AsyncIterator<T>;
	[Symbol.asyncIterator]: () => AsyncIterator<T>;
}

export function validateHasId<T>(item: T, pk: string) {
	if (typeof (item as any)[pk] === 'undefined') {
		throw new Error(`${item} does not have the expected PK: (${pk}).`);
	}
}

export class MapAdapter<T> {
	items = new Map<string, T>();

	async set(key: string, value: T) {
		if(this.items.set(key, value)) {
			return true;
		} else {
			return false;
		}
	}

	async get(key: string) {
		return this.items.get(key);
	}

	async* find(predicate: Partial<T>) {
		const p = predicate || {} as Partial<T>;
		const items = Array.from(this.items.values()).filter(item =>
			Object.entries(p).every(([k,v]) => (item as any)[k] === v)
		);
		yield* items;
	}

	async* keys() {
		yield* Array.from(this.items.keys()).sort();
	}

	// can we use a generator here?
	// https://tinyurl.com/async-iterator-with-generator
	async* [Symbol.asyncIterator]() {
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
}

export class Collection<T extends Record<string, any> = Record<string, any>> {
	name: string;
	keygen: () => string;
	validate: (item: T, pk: string) => any;
	pk: string;

	joinedTo?: Collection;
	from?: string;
	to?: string;
	joinAs?: string;
	recurse: boolean = true;
	joinedAsChild?: boolean;
	joinedAsParent?: boolean;
	joinedToMany?: boolean;

	// TODO: replace with b-tree(s)
	private items: Storage<T> = new MapAdapter<T>();

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
	}: CollectionOptions<T> = {}) {
		this.name = name;
		this.keygen = keygen;
		this.validate = validate;
		this.pk = pk;
		this.put(items);
		this.from = from;
		this.to = to;
		this.joinAs = as;
		this.recurse = recurse || (this === join as any);
		this.joinedTo = this.recurse ? this : join as any;
		this.joinedAsParent = this.pk === this.from || !this.from;
		this.joinedAsChild = this.pk !== this.from;
		this.joinedToMany = this.joinedTo && (this.joinedTo.pk !== this.to);
	}

	// can we use a generator here?
	// https://tinyurl.com/async-iterator-with-generator
	[Symbol.asyncIterator]() {
		const iterator = this.items[Symbol.asyncIterator]();
		return {
			next: async () => {
				const v = await iterator.next();
				if (v) {
					return {
						value: this.ajoin({...v}),
						done: false,
					};
				} else {
					return {
						value: null,
						done: true,
					}
				}
			}
		};
	}

	async get(key: string) {
		return this.ajoin({...(await this.items.get(key))} as T);
	}

	async set(key: string, value: T) {
		return this.items.set(key, value);
	}

	async put(items: T | T[]): Promise<T[]> {
	}

	async find(predicate: Partial<T>) {
		// eventually, we want this to filter in 3 passes:
		// 1. server-fiterable predicates
		// 2. client-side, left-hand filterable predicates
		// 3. post-join, right-hand filterable predicates

		// also ... this needs to return an iterable and handle
		// paging behind the scenes to prevent unnecessary scans
		// and transfer for remote data sources, like dynamo or s3

		let basis;
		if (typeof this.items.find === 'function') {
			basis = await this.items.find(predicate);
		} else {
			let p = predicate || {};
			basis = Object.values(this.items).filter(item =>
				Object.entries(p).every(([k,v]) => item[k] === v)
			);
		}
		
		// TODO: return async iterable
		return Promise.all(basis.map(o => this.ajoin({...o})));
	};

	private async ajoin(item: T | undefined) {
		if (!item) return;
		if (this.joinedTo && this.to && item[this.from!]) {
			const joinedItems = await this.joinedTo.find({[this.to!]: item[this.from!]});
			if (this.joinedToMany) {
				(item as any)[this.joinAs!] = joinedItems;
			} else {
				(item as any)[this.joinAs!] = joinedItems.pop();
			}
		}
		return item;
	};

	join<TO>(
		table: Collection<TO>,
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
