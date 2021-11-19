import { ulid } from 'ulid';

export class Model {
	public id: string;

	constructor(init: JSON) {
		Object.assign(this, init);
		this.id = (this as any).id || ulid();
	}
}

export type ModelConstructor<T extends Model> = new (init: JSON) => T;

export type CollectionInitializer<T extends Model> = {
	model: ModelConstructor<T>;
	items?: T[];
	indexes?: string;
}

export class Index<T extends Model> implements CollectionInitializer<T> {
	// @ts-ignore
	// it actually *is* set during construction with Object.assign();
	public model: ModelConstructor<T>;

	constructor(init: CollectionInitializer<T>) {
		Object.assign(this, init);
	}
}