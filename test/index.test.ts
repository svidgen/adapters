import { Index, Model, ModelConstructor } from '../src';

describe('Collection', () => {
	test('can be constructed empty', () => {
		new Collection({model: GenericModel});
	});

	test('can be constructed with an empty array', () => {
		const c = new Collection({items: []});
	});
});