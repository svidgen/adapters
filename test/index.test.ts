import { Collection } from '../src';

describe('Collection', () => {
	test('can be constructed empty with no specific PK', () => {
		const c = new Collection();
		expect(c.pk).toEqual('id');
	});

	test('can be constructed with a specific PK', () => {
		const c = new Collection({pk: 'notId'});
		expect(c.pk).toEqual('notId');
	});

	test('can be constructed with type', () => {
		type Model = {
			id: string;
			name: string;
		}
		const c = new Collection<"id", Model>();
		expect(c.pk).toEqual('id');
	});

	test('can be constructed with a validator', () => {
		type Model = {
			id: string;
			name: string;
		}
		const c = new Collection({
			validate: (item: Model, pk = 'id') => {}
		});
		expect(c.pk).toEqual('id');
	});

	test('can be constructed with a validator and pk', () => {
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


	test('can be constructed with an empty array', () => {
		const c = new Collection({items: []});
		expect(c.pk).toEqual('id');
	});
});