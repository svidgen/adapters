import { Collection, QueryType } from '../src';

type Customer = {
	id: number;
	name: string;
}

type Order = {
	id: string;
	customer: number;
	lineItems: string[];
}

function makeItems<PK extends string = 'id'>(ids: string[], idField: PK = 'id' as PK): ({[key in PK]: any} & {name: string})[] {
	return ids.map(id => ({
		[idField]: id,
		name: id + ' name'
	})) as ({[key in PK]: any} & {name: string})[];
};

async function makeCustomerOrderRepos() {
	const customerRepo = new Collection<Customer>();
	const orderRepo = new Collection<Order>();

	let customers = [
		{id: 1, name: "Bob Jones"},
		{id: 2, name: "Rob Ross"},
		{id: 3, name: "Jane Doe"}
	];
	await customerRepo.put(customers);

	let orders = [
		{id: 'ord-100', customer: 1, lineItems: ['a','b','c']},
		{id: 'ord-101', customer: 1, lineItems: ['b','c','d']},
		{id: 'ord-102', customer: 2, lineItems: ['a','2','z']},
		{id: 'ord-103', customer: 2, lineItems: ['x','y','z']},
		{id: 'ord-104', customer: 3, lineItems: ['b','o','p']},
	];
	await orderRepo.put(orders);

	let customerWithOrders = customerRepo.join(
		orderRepo, {from: 'id', to: 'customer', as: 'orders', name: 'customersWithOrders'}
	);
	let ordersWithCustomer = orderRepo.join(
		customerRepo, {from: 'customer', to: 'id', as: 'customer', name: 'ordersWithCustomer'}
	);

	// SCRATCH.
	// type T = QueryType<typeof customerWithOrders>;
	// const q: T = {} as T;
	// q.orders.customer.eq(123);
	// q.and(iq => [iq.name.eq('something'), iq.orders.lineItems.eq('whatever')]);
	// const t = q.not(iq => iq.name.eq('something'));
	// t.execute(ordersWithCustomer);

	return { customerRepo, orderRepo, customerWithOrders, ordersWithCustomer };
}

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
			const c = new Collection<Model>();
			expect(c.pk).toEqual('id');
		});
	});

	describe('can be populated with', () => {
		test('an empty array', () => {
			const c = new Collection();
			expect(c.pk).toEqual('id');
		});

		test('array of objects with ids', async () => {
			const c = new Collection();
			await c.put(makeItems(['a','b','c']));
			expect(c.pk).toEqual('id');
		});

		test('array of objects with ids', async () => {
			const c = new Collection({pk: "differentPK"});
			await c.put(makeItems(['a','b','c'], "differentPK"));
			expect(c.pk).toEqual('differentPK');
		});
	});

	describe('can fetch', () => {
		test('one item by string id', async () => {
			const c = new Collection();
			await c.put(makeItems(['a','b','c']));

			expect(await c.get('a')).toEqual({
				id: 'a',
				name: 'a name'
			});
		});

		test('one item by number id', async () => {
			const customerRepo = new Collection<Customer>();

			let customers = [
				{id: 1, name: "Bob Jones"},
				{id: 2, name: "Rob Ross"},
				{id: 3, name: "Jane Doe"}
			];

			await customerRepo.put(customers);
			const c = await customerRepo.get(2);
			expect(c).toEqual(customers[1]);
		});

		test('all items in PK order as an async iterable', async () => {
			const c = new Collection();
			await c.put(makeItems(['a','c','b']));

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

		test('all items in PK order as an array', async () => {
			const c = new Collection();
			await c.put(makeItems(['a','c','b']));

			const results = await c.toArray();

			expect(results).toEqual([
				{id: 'a', name: 'a name'},
				{id: 'b', name: 'b name'},
				{id: 'c', name: 'c name'},
			]);
		});


		test('items by non-pk field', async () => {
			const c = new Collection();
			await c.put(makeItems(['a','c','b']));

			const results = [] as any[];
			for await (const item of c.find({name: 'b name'})) {
				results.push(item);
			}

			expect(results).toEqual([
				{id: 'b', name: 'b name'}
			]);
		});

		test('items by non-pk field as array', async () => {
			const c = new Collection();
			await c.put(makeItems(['a','c','b']));

			const results = await c.where({name: 'b name'}).toArray();

			expect(results).toEqual([
				{id: 'b', name: 'b name'}
			]);
		});

		// TODO: make it work!
		// test('items by pk field < comparison', async () => {
		// 	const c = new Collection();
		// 	await c.put(makeItems(['a','c','b']));

		// 	const results = await c.where({name: {lt: 'b name' }}).toArray();

		// 	expect(results).toEqual([
		// 		{id: 'a', name: 'a name'}
		// 	]);
		// });
	});

	describe('when joined', () => {

		describe('to another collection', () => {
			test('can be queried by parent ID', async () => {
				const { customerWithOrders } = await makeCustomerOrderRepos();
				expect(await customerWithOrders.get(1)).toEqual({
					id: 1, name:"Bob Jones", orders: [
						{id: "ord-100", customer:1, lineItems: ["a","b","c"]},
						{id: "ord-101", customer:1, lineItems: ["b","c","d"]}
					]
				});
			})

			test('can be queried by child ID', async () => {
				const { ordersWithCustomer } = await makeCustomerOrderRepos();
				expect(await ordersWithCustomer.get('ord-101')).toEqual({
					id: 'ord-101', customer: {id: 1, name: 'Bob Jones'}, lineItems: ['b','c','d']
				});
			})

			test('can be queried by parent field as iterator', async () => {
				const { customerWithOrders } = await makeCustomerOrderRepos();
				expect(await (await customerWithOrders.find({name: "Bob Jones"}).next()).value).toEqual(
					{id: 1, name:"Bob Jones", orders: [
						{id: "ord-100", customer:1, lineItems: ["a","b","c"]},
						{id: "ord-101", customer:1, lineItems: ["b","c","d"]}
					]}
				);
			})

			test('can be queried by child field as iterator', async () => {
				const { ordersWithCustomer } = await makeCustomerOrderRepos();
				let orderResults = [];
				for await (const item of ordersWithCustomer.find({customer: { id: 2 }})) {
					orderResults.push(item);
				}
				expect(orderResults).toEqual([
					{id: "ord-102", customer: {id: 2, name: "Rob Ross"}, lineItems: ["a","2","z"]},
					{id: "ord-103", customer: {id: 2, name: "Rob Ross"}, lineItems: ["x","y","z"]}
				]);
			})

			test('can be queried by parent field as array', async () => {
				const { customerWithOrders } = await makeCustomerOrderRepos();
				expect(await customerWithOrders.where({name: "Bob Jones"}).toArray()).toEqual([
					{id: 1, name:"Bob Jones", orders: [
						{id: "ord-100", customer:1, lineItems: ["a","b","c"]},
						{id: "ord-101", customer:1, lineItems: ["b","c","d"]}
					]}
				]);
			})

			test('can be queried by child field as array', async () => {
				const { ordersWithCustomer } = await makeCustomerOrderRepos();
				let orderResults = await ordersWithCustomer.where({customer: {id: 2}}).toArray();
				expect(orderResults).toEqual([
					{id: "ord-102", customer: {id: 2, name: "Rob Ross"}, lineItems: ["a","2","z"]},
					{id: "ord-103", customer: {id: 2, name: "Rob Ross"}, lineItems: ["x","y","z"]}
				]);
			})
		});

	});
});
