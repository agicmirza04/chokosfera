global.window = {
  location: {
    hostname: 'localhost',
    port: '3000'
  }
};

global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn()
};

global.document = {};

const {
  OrderService
} = require('../order.js');

describe('OrderService - calculateTotal()', () => {

  test('should calculate total price of multiple cart items', () => {

    const mockRepository = {};
    const service = new OrderService(mockRepository);

    service.cart = [
      { name: 'Smaller Box', price: 20 },
      { name: 'Bigger Box', price: 40 },
      { name: 'Mix Box', price: 50 }
    ];

    const result = service.calculateTotal();

    expect(result).toBe(110);

  });

  test('should return 0 when cart is empty', () => {

    const mockRepository = {};
    const service = new OrderService(mockRepository);

    service.cart = [];

    const result = service.calculateTotal();

    expect(result).toBe(0);

  });

});
test('should add item to cart', () => {

  const mockRepository = {};
  const service = new OrderService(mockRepository);

  service.cart = [];

  service.addToCart({
    name: 'Chocolate Box',
    price: 20,
    amount: 1
  });

  expect(service.cart.length).toBe(1);
  expect(service.cart[0].name).toBe('Chocolate Box');
  expect(service.cart[0].price).toBe(20);

});

test('should remove item from cart', () => {

  const mockRepository = {};
  const service = new OrderService(mockRepository);

  service.cart = [
    { name: 'Box 1', price: 20 },
    { name: 'Box 2', price: 30 }
  ];

  service.removeFromCart(0);

  expect(service.cart.length).toBe(1);
  expect(service.cart[0].name).toBe('Box 2');

});
