import { Collection } from '../src';

function makeItems<PK extends string = 'id'>(ids: string[], idField: PK = 'id' as PK): ({[key in PK]: any} & {name: string})[] {
	return ids.map(id => ({
		[idField]: id,
		name: id + ' name'
	})) as ({[key in PK]: any} & {name: string})[];
};

describe('Collection', () => {
	describe("can be constructed with", () => {
		test('no specific PK', () => {
			const c = new Collection();
			expect(c.pk).toEqual('id');
		});

		test('a specific PK', () => {
			const c = new Collection({pk: 'notId'});
			expect(c.pk).toEqual('notId');
		});

		test('type', () => {
			type Model = {
				id: string;
				name: string;
			}
			const c = new Collection<"id", Model>();
			expect(c.pk).toEqual('id');
		});

		test('a validator', () => {
			type Model = {
				id: string;
				name: string;
			}
			const c = new Collection({
				validate: (item: Model, pk = 'id') => {}
			});
			expect(c.pk).toEqual('id');
		});

		test('a validator and pk', () => {
			type Model = {
				notId: string;
				name: string;
			}
			const c = new Collection({
				pk: 'notId',
				validate: (item: Model, pk = 'notId') => {}
			});
			expect(c.pk).toEqual('notId');
		});

		test('an empty array', () => {
			const c = new Collection({items: []});
			expect(c.pk).toEqual('id');
		});

		test('array of objects with ids', () => {
			const c = new Collection({items: makeItems(['a','b','c'])});
			expect(c.pk).toEqual('id');
		});

		test('array of objects with ids', () => {
			const c = new Collection({items: makeItems(['a','b','c'], "differentPK"), pk: "differentPK"});
			expect(c.pk).toEqual('differentPK');
		});
	});

	describe('can fetch', () => {
		test('one item by id', async () => {
			const c = new Collection({items: makeItems(['a','b','c'])});
			expect(await c.get('a')).toEqual({
				id: 'a',
				name: 'a name'
			});
		});

		test('all items in PK order as an async iterable', async () => {
			const c = new Collection({items: makeItems(['a','c','b'])});

			const results = [] as any[];
			for await (const item of c) {
				results.push(item);
			}

			expect(results).toEqual([
				{id: 'a', name: 'a name'},
				{id: 'b', name: 'b name'},
				{id: 'c', name: 'c name'},
			]);
		});
	});
});
