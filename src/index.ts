import { ulid } from 'ulid';

// reference:
// https://www.typescriptlang.org/play?target=99&noStrictGenericChecks=true#code/C4TwDgpgBA6glsAFgeTMOB7AdgQwDYBicEeAJgM4A8AKlBAB7ARYVQBKEAxhgE6mXlgPOFgDmAGig4sIAHySiJVgyYtyUANYQQGAGZRqsqAF4oyALYIaC4mXJGAZFAAKOHunyVncThutRFO1lZAG4AWAAoUEgoAGVEHEhkXRojUwsrakksCAA3CB5QyMjOPBxydWQoAG9IgEhuLEEeAFdOYF4ACnq6sBaAIzwfKDhSAC4oLBbzfoLxHr7B4dxzCAnmkQl6gEoagF9IvfCIyOjoWlMAYWxmto6eVx4cVaYeKjO9MyKTiN0WrHamCwUHMOC0AH1Rp1drUInUeBBgC0eMDOjkAO5QAAiOCY0IAdKJEdQ4KtobsANRQACyuMQ+N0eAwXVpSHxTxYGHM0KgACooABGAAMIu2xwOP1K5XUWNilHqtBUzFYHG4fAEQk2kmkchM7C4vH4GzE2pksnqkmcAGlwdQAJrOACidEYyvUWh0+guUAA5KMfZEjLD4RAcKRsHgQFAwBoJtbbQ7HccQ2GI1GEBBzOpTNU9lJ1KrDTQANrx+1OgC6kniiQgyVS33qjVu7S6wbq5gwpBI8zhvQ0er9pB9+ZcNvLjvqewm7c73bwAH4JrQAD5QNEQTGdfE7tyicgTHW7YxGajbXt1ftLscJp1TvW5mE9JBwcj4mN6mPJiX1InAToxsupbjomFbbBMNZJCkhhQGu-zdroIgQKQNQ9AiSIolAL5vhmWbFjGFbfsUcJ9P+uETPASCoOg2D4IEFD+GWiayE+fbNsAIxMOYlGINaD7Fth74aBWEyghCULnlAO74rheblAYyZ1IJuHkMWuE8daAmIK+QkVhWerqQgvFWkREQ-hEAD0FlQM2GB4BA+JMqInTIPiHSxJqYjkscJQ3Bxejgsg4L9CAkIoaYGLYrEnTVHOJATMgexipEAVBSFYWEoinQCgATAAzMlESpcFoWjO+LT-tUowTAALAArHV2TPGsUAAETogkTD5DwrVJccxXpWVpExSsLXtZ1eQFL1hW+U0-m6IFJXgqNeqRbKMVxXgCWSIBbWjdN-ULWloWjZl-6tTg-ScK1M0ROxUABbEAASACCTpLaMq2blFG1dvFNQ4BMrWtZI-QTEKkjVVAQp7ElxFWVh4DnHqHz6BQxY+jGPqEZECNnAYOV6sgAlI586OYxo2M45Z1n40x72xNQL3UAAkpcRPFq1oytYRQA

type ShapeOf<T> = Pick<T, keyof T>;
type KeyTypes = number | string;
type KeyValuePair<K extends KeyTypes, V> = [K, V];
type SuccessResponse<K extends KeyTypes> = KeyValuePair<K, boolean>;

export type Scalar<T> = T extends Array<infer InnerType> ? InnerType : T;
export type AnyCollection = Collection<any, any, any, any>;
export type SimpleTypes = number | string | boolean;

export type CollectionType<T extends AnyCollection> = T extends Collection<infer IT, any, any, any> ? IT: never;
export type CollectionPK<T extends AnyCollection> = T extends Collection<any, infer PK, any, any> ? PK : never;
export type CollectionJoinType<T extends AnyCollection> = T extends Collection<any, any, infer JoinType, any> ? JoinType : never;
export type CollectionJoinAs<T extends AnyCollection> = T extends Collection<any, any, any, infer JoinAs> ? JoinAs : never;
export type CollectionTypeFields<T extends AnyCollection> = keyof CollectionType<T> | CollectionJoinAs<T>;

// keyof T, but without treating `never` like `any`.
export type KeysOf<T> = T extends never ? never : keyof T;

// passes string literal unions though; but blocks the general string type.
export type StringUnion<T> = string extends T ? never : T;

export type CollectionReturnType<T extends AnyCollection> = CombinedType<
	CollectionType<T>,
	CollectionJoinType<T>,
	CollectionJoinAs<T>
>;

export type CombinedType<
	T extends any,
	JoinType extends AnyCollection = never,
	JoinAs extends string = never
> = {
	// AnyCollection -> Collection<any, any, any, any> ... so, we need to ensure
	// we only enumerate and branch on JoinAs matches when JoinAs is a particular string.
	[K in StringUnion<JoinAs> | keyof T]:
		K extends StringUnion<JoinAs> ? CollectionReturnType<JoinType> :
		K extends keyof T ? T[K] :
		never
	;
}

type WithOptionalFields<T extends Record<string, any>, Fields extends keyof T> = Omit<T, Fields> & Partial<Pick<T, Fields>>;

type WithFieldsRemapped<T, KEYS extends string, TO_TYPE> = {
	[K in keyof T]: K extends KEYS ? TO_TYPE : T[K];
} & {
	[K in Exclude<KEYS, keyof T>]: TO_TYPE;
};

type JoinOptions<FROM, TO, FK extends keyof FROM, TO_ID extends KeysOf<TO>, AS extends string> = {
	from?: FK;
	to?: TO_ID;
	as?: AS;
	name?: string;
};

type RecursivePartial<T> = {
	[K in keyof T]+?: T[K] extends Object ? RecursivePartial<T[K]> : T[K];
};

export type CollectionOptions<T extends Record<string, any>, JoinType = never> = Partial<Collection<T>> & {
	items?: T[];
	as?: string;
	join?: JoinType extends Record<string, any> ? Collection<JoinType> : undefined;
};

interface Storage<PK_TYPE extends string | number, T> {
	get(key: PK_TYPE): Promise<T | undefined>;
	set(key: PK_TYPE, value: T): Promise<boolean>;
	set(items: KeyValuePair<PK_TYPE, T>[]): Promise<SuccessResponse<PK_TYPE>[]>;
	find(predicate: RecursivePartial<T>): AsyncGenerator<T>;
	// where(predicate: Partial<T>): Storage<PK_TYPE, T>;
	[Symbol.asyncIterator](): AsyncIterator<T | undefined>;
}

export function validateHasId<T>(item: T, pk: string) {
	if (typeof (item as any)[pk] === 'undefined') {
		throw new Error(`${item} does not have the expected PK: (${pk}).`);
	}
}

export class SaveError<T> extends Error {
	constructor(
		public readonly saved: T[],
		public readonly failed: T[],
		public readonly reason?: any
	) {
		super("Error saving items!" + (reason ? ` (${reason})` : ''));
	}
}

export class MapAdapter<PK_TYPE extends KeyTypes, T> implements Storage<PK_TYPE, T> {
	items = new Map<PK_TYPE, T>();
	private indexes = new Map<string, MapAdapter<string, T>>();

	constructor({index = []}: {index?: string[][]} = {}) {
		for (const idx of index) {
			this.indexes.set(JSON.stringify(idx), new MapAdapter<string, T>());
		}
	}

	async set(key: PK_TYPE, value: T): Promise<boolean>;
	async set(items: KeyValuePair<PK_TYPE, T>[]): Promise<SuccessResponse<PK_TYPE>[]>;
	async set(itemsOrKey: KeyValuePair<PK_TYPE, T>[] | PK_TYPE, value?: T) {
		if (itemsOrKey instanceof Array) {
			const set_promises = itemsOrKey.map(async ([key, value]) => [
				key, await this.set(key, value)
			] as SuccessResponse<PK_TYPE>);
			return Promise.all(set_promises);
		} else if (value) {
			if(this.items.set(itemsOrKey, value)) {
				await this.index(value);
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

	private async index(item: T) {
		for await (const idx_name of this.indexes.keys()) {
			const fields = JSON.parse(idx_name);
			const indexKey = fields.map((f: any) => (item as any)[f]).join() as string;
			this.indexes.get(idx_name)!.set(indexKey, item);
		}
	}

	async get(key: PK_TYPE) {
		return this.items.get(key);
	}

	async * find(predicate: RecursivePartial<T> = {}) {
		for await (const item of this) {
			if (item && Object.entries(predicate).every(([k,v]) => (item as any)[k] === v)) {
				yield item;
			}
		}
	}

	async * keys() {
		yield* Array.from(this.items.keys()).sort();
	}

	// can we use a generator here?
	// https://tinyurl.com/async-iterator-with-generator
	async * [Symbol.asyncIterator]() {
		const keys = Array.from(this.items.keys()).sort();
		for (const key of keys) {
			yield this.items.get(key);
		}
	}
}

export class Collection<
	T extends Record<string, any> = Record<string, any>,
	PK extends keyof T = 'id',
	JoinCollection extends AnyCollection = never,
	JoinAs extends string = never
> implements Storage<T[PK], CombinedType<T, JoinCollection, JoinAs>> {
	readonly name: string;
	readonly pk: PK;

	keygen: () => T[PK];

	joinedTo?: AnyCollection;
	from?: keyof T;
	to?: KeysOf<CollectionType<JoinCollection>>;
	joinAs?: JoinAs;
	recurse: boolean = true;
	joinedAsChild?: boolean;
	joinedAsParent?: boolean;
	joinedToMany?: boolean;

	private items: Storage<T[PK], T>;
	conditions: RecursivePartial<T>;

	constructor({
		name = `unknown_${ulid()}`,
		model,
		keygen = ulid as T[PK],
		pk = 'id' as PK,
		items = new MapAdapter<T[PK], T>(),
		conditions = {},
		join,
		from,
		to,
		as,
		recurse
	}: {
		name?: string;
		model?: T | (new (...args: any) => T);
		keygen?: () => T[PK];
		pk?: PK;
		items?: Storage<T[PK], T>;
		conditions?: RecursivePartial<T>,
		join?: AnyCollection;
		from?: keyof T;
		to?: KeysOf<CollectionType<JoinCollection>>;
		as?: JoinAs;
		recurse?: boolean;
	} = {}) {
		this.name = name;
		this.keygen = keygen;
		this.pk = pk;
		this.items = items;
		this.conditions = conditions;
		this.from = from;
		this.to = to;
		this.joinAs = as;
		this.recurse = recurse || (this === join as any);
		this.joinedTo = this.recurse ? this : join as any;
		this.joinedAsParent = this.pk === this.from || !this.from;
		this.joinedAsChild = this.pk !== this.from;
		this.joinedToMany = this.joinedTo && (this.joinedTo.pk !== this.to);
	}

	private withId(item: WithOptionalFields<T, PK>): ShapeOf<T> {
		if (!item[this.pk]) {
			item[this.pk] = this.keygen();
		}
		return item as T;
	}

	// can we use a generator here?
	// https://tinyurl.com/async-iterator-with-generator
	async * [Symbol.asyncIterator]() {
		yield* this.find(this.conditions);
		// for await (const item of this.items) {
		// 	yield item ? this.bless({...item}) : undefined;
		// }
	}

	async toArray({max = Number.MAX_SAFE_INTEGER}: {max?: number} = {}) {
		const items = [];
		for await (const item of this) {
			if (items.length >= max) break;
			items.push(item);
		}
		return items;
	}

	async get(key: T[PK]): Promise<CombinedType<T, JoinCollection, JoinAs>> {
		return this.bless({...(await this.items.get(key))} as ShapeOf<T>);
	}

	async set(key: T[PK], value: T): Promise<boolean>;
	async set(items: KeyValuePair<T[PK], T>[]): Promise<SuccessResponse<T[PK]>[]>;
	async set(itemsOrKey: KeyValuePair<T[PK], T>[] | T[PK], value?: T) {
		if (value) {
			return this.items.set(itemsOrKey as T[PK], value);
		} else {
			return this.items.set(itemsOrKey);
		}
	}

	async put(item: WithOptionalFields<T, PK>, failEarly?: true): Promise<ShapeOf<T>>;
	async put(items: WithOptionalFields<T, PK>[], failEarly?: true): Promise<ShapeOf<T>[]>;
	async put(itemOrItems: WithOptionalFields<T, PK>[] | WithOptionalFields<T, PK>, failEarly?: true): Promise<ShapeOf<T> | ShapeOf<T>[]> {
		if (itemOrItems instanceof Array) {
			const saved: ShapeOf<T>[] = [];
			const failed: ShapeOf<T>[] = [];

			let error: any = null;

			for (const _item of itemOrItems) {
				const item = this.withId(_item);
				try {
					await this.set(item[this.pk], item);
					saved.push(item);
				} catch (e) {
					failed.push(item);
					if (failEarly) {
						throw new SaveError(saved, failed, e);
					} else {
						error = e;
					}
				}
			};

			if (error) {
				throw new SaveError(saved, failed, error);
			}

			return saved;
		} else {
			return (await this.put([itemOrItems])).pop()!;
		}
	}

	async * find(predicate: RecursivePartial<CombinedType<T, JoinCollection, JoinAs>>) {
		// eventually, we want this to filter in 3 passes:
		// 1. server-fiterable predicates
		// 2. client-side, left-hand filterable predicates
		// 3. post-join, right-hand filterable predicates

		// also ... this needs to return an iterable and handle
		// paging behind the scenes to prevent unnecessary scans
		// and transfer for remote data sources, like dynamo or s3

		// TODO:
		// cost() functions.
		// compare costs and query by lowest cost first.

		// const join_predicate = this.joinAs ? predicate[this.joinAs] as RecursivePartial<JoinType> : undefined;

		const self_predicate = {...predicate} as Partial<T>;
		if (this.joinAs) {
			delete self_predicate[this.joinAs];
		}

		for await (const item of this.items.find(self_predicate)) {
			const blessed_item = await this.bless({...item});
			if (await this.matches(blessed_item, predicate)) {
				yield blessed_item;
			}
		}
	}

	// where(predicate: RecursivePartial<T>) {
	// 	return new Collection<T, PK, JoinType, JoinPK>({
	// 		pk: this.pk,
	// 		items: this,
	// 		conditions: {...this.conditions, predicate}
	// 	});
	// }

	private async matches(item: any, predicate: any): Promise<boolean> {
		for (const [k, v] of Object.entries(predicate)) {
			if (typeof v === 'object' && v !== null) {
				if (!await this.matches(await item[k], v)) {
					return false;
				}
			} else {
				if ((await item[k]) != v) {
					return false;
				}
			}
		}
		return true;
	}

	private async bless(item: ShapeOf<T>) {
		if (this.joinedTo && this.to && this.from && this.joinAs && item[this.from]) {
			const query = { [this.to]: item[this.from] } as Partial<CollectionReturnType<JoinCollection>>;
			const joinedItems = [];
			for await (const joinedItem of this.joinedTo.find(query)) {
				joinedItems.push(joinedItem);
				if (this.joinedToMany) {
					(item as any)[this.joinAs] = joinedItems;
				} else {
					(item as any)[this.joinAs] = joinedItems.pop();
				}
			}
		}
		return item;
	};

	public join<
		TO_COLLECTION extends AnyCollection,
		FK extends keyof T,
		TO_ID extends KeysOf<CollectionType<TO_COLLECTION>>,
		AS extends string
	>(
		table: TO_COLLECTION,
		{
			from,
			to,
			as,
			name = `${this.name}_to_${table.name}`
		}: JoinOptions<T, CollectionType<TO_COLLECTION>, FK, TO_ID, AS>
	) {
		return new Collection<CombinedType<T, JoinCollection, JoinAs>, PK, TO_COLLECTION, AS>({
			pk: this.pk,
			items: this,
			join: table,
			name, as, from, to
		});
	}
}