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

global.document = {
  getElementById: jest.fn(() => null)
};

const {
  OrderService,
  OrderController
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

test('should not remove item when index is invalid', () => {
  const mockRepository = {};
  const service = new OrderService(mockRepository);

  service.cart = [
    { name: 'Cake', price: 20 }
  ];

  service.removeFromCart(99);

  expect(service.cart.length).toBe(1);
});
test('should place order successfully', async () => {
  const mockRepository = {
    saveOrder: jest.fn().mockResolvedValue({
      id: 1,
      total: 50
    })
  };

  const service = new OrderService(mockRepository);

  service.cart = [
    { name: 'Cake', price: 50 }
  ];

  const result = await service.placeOrder();

  expect(result.id).toBe(1);
  expect(service.cart.length).toBe(0);
});

test('should throw error when placing order with empty cart', async () => {
  const mockRepository = {};

  const service = new OrderService(mockRepository);

  await expect(
    service.placeOrder()
  ).rejects.toThrow('Cart is empty');
});

test('should return all orders from repository', async () => {
  const mockRepository = {
    getAllOrders: jest.fn().mockResolvedValue([
      { id: 1, total: 20 },
      { id: 2, total: 40 }
    ])
  };

  const service = new OrderService(mockRepository);

  const orders = await service.viewOrders();

  expect(orders.length).toBe(2);
  expect(orders[0].id).toBe(1);
  expect(orders[1].id).toBe(2);
});

test('should cancel order successfully', async () => {
  const mockRepository = {
    cancelOrder: jest.fn().mockResolvedValue({
      success: true
    })
  };

  const service = new OrderService(mockRepository);

  const result = await service.cancelOrder(1);

  expect(result.success).toBe(true);
});

test('should load cart from localStorage', () => {
  localStorage.getItem.mockReturnValue(
    JSON.stringify([
      { name: 'Cake', price: 20 }
    ])
  );

  const service = new OrderService({});

  expect(service.cart.length).toBe(1);
  expect(service.cart[0].name).toBe('Cake');
});

test('should return empty cart when localStorage contains invalid data', () => {
  localStorage.getItem.mockImplementation(() => {
    throw new Error();
  });

  const service = new OrderService({});

  expect(service.cart).toEqual([]);
});

test('should multiply price by quantity when amount is greater than one', () => {
  const service = new OrderService({});

  service.addToCart({
    name: 'Cake',
    price: 10,
    amount: 3
  });

  expect(service.cart[0].price).toBe(30);
});

test('should not remove item when index is negative', () => {
  const service = new OrderService({});

  service.cart = [
    { name: 'Cake', price: 10 }
  ];

  service.removeFromCart(-1);

  expect(service.cart.length).toBe(1);
});

test('should clear cart after successful order placement', async () => {
  const mockRepository = {
    saveOrder: jest.fn().mockResolvedValue({ id: 1 })
  };

  const service = new OrderService(mockRepository);

  service.cart = [
    { name: 'Box', price: 20 }
  ];

  await service.placeOrder();

  expect(service.cart.length).toBe(0);
});

test('should call repository when viewing orders', async () => {
  const mockRepository = {
    getAllOrders: jest.fn().mockResolvedValue([])
  };

  const service = new OrderService(mockRepository);

  await service.viewOrders();

  expect(mockRepository.getAllOrders).toHaveBeenCalled();
});

test('should call repository when cancelling order', async () => {
  const mockRepository = {
    cancelOrder: jest.fn().mockResolvedValue({})
  };

  const service = new OrderService(mockRepository);

  await service.cancelOrder(123);

  expect(mockRepository.cancelOrder).toHaveBeenCalledWith(123);
});

test('should return empty cart when localStorage is empty', () => {
  localStorage.getItem.mockReturnValue(null);

  const service = new OrderService({});

  expect(service.cart).toEqual([]);
});

test('should keep original price when amount equals one', () => {
  const service = new OrderService({});

  service.addToCart({
    name: 'Cake',
    price: 15,
    amount: 1
  });

  expect(service.cart[0].price).toBe(15);
});

test('should calculate custom order total correctly', () => {

  const mockService = {};

  const controller = new OrderController(mockService);

  controller.customOrderCounts = {
    donuts: 4,
    popsicles: 4,
    heartPopsicles: 0,
    chocoStrawberries: 0,
    chocoDates: 0,
    smashCake: 0
  };

  expect(
    controller.calculateCustomOrderTotal()
  ).toBe(17);

});

test('should return guest when no user is stored in localStorage', () => {
  localStorage.getItem.mockReturnValue(null);

  const controller = new OrderController({});

  expect(controller.getCurrentUserKey()).toBe('guest');
});

test('should return user id from localStorage', () => {
  localStorage.getItem.mockReturnValue(
    JSON.stringify({ id: 'user-123' })
  );

  const controller = new OrderController({});

  expect(controller.getCurrentUserKey()).toBe('user-123');
});

test('should generate next custom order label for guest user', () => {
  localStorage.getItem.mockReturnValue(null);
  localStorage.setItem = jest.fn();

  const controller = new OrderController({});

  const label = controller.getNextCustomOrderLabel();

  expect(label).toBe('Custom order #1');
  expect(localStorage.setItem).toHaveBeenCalledWith(
    'chokosferaCustomOrderCounter_guest',
    '1'
  );
});

test('should return existing custom order label when active draft exists', () => {
  const controller = new OrderController({});

  controller.activeCustomOrderDraft = {
    label: 'Custom order #5'
  };

  expect(controller.getNextCustomOrderLabel()).toBe('Custom order #5');
});

test('should calculate smash cake custom order total', () => {
  const controller = new OrderController({});

  controller.customOrderCounts = {
    donuts: 0,
    popsicles: 0,
    heartPopsicles: 0,
    chocoStrawberries: 0,
    chocoDates: 0,
    smashCake: 1
  };

  expect(controller.calculateCustomOrderTotal()).toBe(40);
});

test('should calculate mixed custom order total correctly', () => {
  const controller = new OrderController({});

  controller.customOrderCounts = {
    donuts: 8,
    popsicles: 0,
    heartPopsicles: 4,
    chocoStrawberries: 5,
    chocoDates: 5,
    smashCake: 1
  };

  expect(controller.calculateCustomOrderTotal()).toBe(71);
});

test('should reset custom order counts and clear active draft', () => {
  const controller = new OrderController({});

  controller.syncCustomOrderUI = jest.fn();

  controller.customOrderCounts = {
    donuts: 4,
    popsicles: 4,
    heartPopsicles: 4,
    chocoStrawberries: 5,
    chocoDates: 5,
    smashCake: 1
  };

  controller.activeCustomOrderDraft = {
    label: 'Custom order #1'
  };

  controller.resetCustomOrder();

  expect(controller.customOrderCounts).toEqual({
    donuts: 0,
    popsicles: 0,
    heartPopsicles: 0,
    chocoStrawberries: 0,
    chocoDates: 0,
    smashCake: 0
  });

  expect(controller.activeCustomOrderDraft).toBe(null);
  expect(controller.syncCustomOrderUI).toHaveBeenCalled();
});
test('should return 0 when no custom order items are selected', () => {
  const controller = new OrderController({});

  controller.customOrderCounts = {
    donuts: 0,
    popsicles: 0,
    heartPopsicles: 0,
    chocoStrawberries: 0,
    chocoDates: 0,
    smashCake: 0
  };

  expect(controller.calculateCustomOrderTotal()).toBe(0);
});
test('should return guest when stored user data is invalid', () => {
  localStorage.getItem.mockReturnValue('invalid-json');

  const controller = new OrderController({});

  expect(controller.getCurrentUserKey()).toBe('guest');
});
test('should update custom order price display', () => {
  const controller = new OrderController({});

  controller.customOrderPriceValue = {
    textContent: ''
  };

  controller.customOrderCounts = {
    donuts: 4,
    popsicles: 0,
    heartPopsicles: 0,
    chocoStrawberries: 0,
    chocoDates: 0,
    smashCake: 0
  };

  controller.updateCustomOrderPriceDisplay();

  expect(controller.customOrderPriceValue.textContent).toBe('5.00 KM');
});

test('should not render custom order summary when summary element is missing', () => {
  const controller = new OrderController({});

  controller.customOrderSummary = null;

  expect(() => {
    controller.renderCustomOrderSummary();
  }).not.toThrow();
});
test('should render selected custom order items in summary', () => {
  const summaryElement = {
    innerHTML: '',
    textContent: '',
    appendedChildren: [],
    appendChild: jest.fn(function (child) {
      this.appendedChildren.push(child);
    })
  };

  global.document.createElement = jest.fn(() => ({
    className: '',
    innerHTML: '',
    querySelector: jest.fn(() => ({
      addEventListener: jest.fn()
    }))
  }));

  const controller = new OrderController({});

  controller.customOrderSummary = summaryElement;

  controller.customOrderCounts = {
    donuts: 4,
    popsicles: 0,
    heartPopsicles: 0,
    chocoStrawberries: 0,
    chocoDates: 0,
    smashCake: 0
  };

  controller.renderCustomOrderSummary();

  expect(summaryElement.appendChild).toHaveBeenCalled();
});

test('should show empty message when no custom order items are selected', () => {
  const summaryElement = {
    innerHTML: '',
    textContent: ''
  };

  const controller = new OrderController({});

  controller.customOrderSummary = summaryElement;

  controller.customOrderCounts = {
    donuts: 0,
    popsicles: 0,
    heartPopsicles: 0,
    chocoStrawberries: 0,
    chocoDates: 0,
    smashCake: 0
  };

  controller.renderCustomOrderSummary();

  expect(summaryElement.textContent).toBe('No items selected yet.');
});

test('should prevent adding custom order when no items are selected', () => {
  global.alert = jest.fn();

  const mockService = {
    addToCart: jest.fn()
  };

  const controller = new OrderController(mockService);

  controller.customOrderCounts = {
    donuts: 0,
    popsicles: 0,
    heartPopsicles: 0,
    chocoStrawberries: 0,
    chocoDates: 0,
    smashCake: 0
  };

  controller.addCustomOrder();

  expect(global.alert).toHaveBeenCalledWith(
    'Select at least one item to add to the cart.'
  );
  expect(mockService.addToCart).not.toHaveBeenCalled();
});

test('should add valid custom order to cart', () => {
  const mockService = {
    addToCart: jest.fn()
  };

  const controller = new OrderController(mockService);

  controller.renderCart = jest.fn();
  controller.resetCustomOrder = jest.fn();
  controller.getNextCustomOrderLabel = jest.fn(() => 'Custom order #1');

  controller.customOrderCounts = {
    donuts: 4,
    popsicles: 0,
    heartPopsicles: 0,
    chocoStrawberries: 0,
    chocoDates: 0,
    smashCake: 0
  };

  controller.addCustomOrder();

  expect(mockService.addToCart).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'Custom order #1',
      price: 5,
      amount: 1
    })
  );

  expect(controller.renderCart).toHaveBeenCalled();
  expect(controller.resetCustomOrder).toHaveBeenCalled();
});
test('should render empty cart message and total', () => {
  const cartContainer = {
    innerHTML: '',
    appendChild: jest.fn()
  };

  const totalDiv = {
    innerText: ''
  };

  global.document.getElementById = jest.fn((id) => {
    if (id === 'cartContainer') return cartContainer;
    if (id === 'cartTotal') return totalDiv;
    return null;
  });

  const controller = new OrderController({
    cart: []
  });

  controller.calculateTotal = jest.fn(() => 0);

  controller.renderCart();

  expect(cartContainer.innerHTML).toBe(
    '<p style="color: #999;">Cart is empty.</p>'
  );
  expect(totalDiv.innerText).toBe('Total: 0.00 KM');
});

test('should render empty order history message', () => {
  const ordersContainer = {
    innerHTML: '',
    appendChild: jest.fn()
  };

  global.document.getElementById = jest.fn((id) => {
    if (id === 'ordersContainer') return ordersContainer;
    return null;
  });

  const controller = new OrderController({});

  controller.renderOrders([]);

  expect(ordersContainer.innerHTML).toBe('<p>No orders placed yet.</p>');
});

test('should restore custom order from cart item', () => {
  const mockService = {
    cart: [
      {
        name: 'Custom order #1',
        customOrderData: {
          counts: {
            donuts: 4,
            popsicles: 4,
            heartPopsicles: 0,
            chocoStrawberries: 0,
            chocoDates: 0,
            smashCake: 0
          },
          notes: 'Birthday design'
        }
      }
    ],
    removeFromCart: jest.fn()
  };

  global.document.getElementById = jest.fn((id) => {
    if (id === 'designNotes') {
      return { value: '' };
    }
    return null;
  });

  const controller = new OrderController(mockService);
  controller.syncCustomOrderUI = jest.fn();

  controller.restoreCustomOrder(0);

  expect(controller.customOrderCounts.donuts).toBe(4);
  expect(controller.customOrderCounts.popsicles).toBe(4);
  expect(controller.activeCustomOrderDraft.label).toBe('Custom order #1');
  expect(mockService.removeFromCart).toHaveBeenCalledWith(0);
  expect(controller.syncCustomOrderUI).toHaveBeenCalled();
});
test('should not restore custom order when cart item has no custom data', () => {
  const mockService = {
    cart: [
      {
        name: 'Smaller Box',
        price: 20
      }
    ],
    removeFromCart: jest.fn()
  };

  const controller = new OrderController(mockService);
  controller.syncCustomOrderUI = jest.fn();

  controller.restoreCustomOrder(0);

  expect(mockService.removeFromCart).not.toHaveBeenCalled();
  expect(controller.syncCustomOrderUI).not.toHaveBeenCalled();
});

test('should render populated order history with pending order', () => {
  const ordersContainer = {
    innerHTML: '',
    appendChild: jest.fn()
  };

  global.document.getElementById = jest.fn((id) => {
    if (id === 'ordersContainer') return ordersContainer;
    return null;
  });

  global.document.createElement = jest.fn(() => ({
    className: '',
    innerHTML: ''
  }));

  const controller = new OrderController({});

  controller.renderOrders([
    {
      id: 'order123456',
      orderDate: '2026-06-01',
      items: [
        { name: 'Smaller Box' },
        { name: 'Choco Dates' }
      ],
      total: 40,
      status: 'Pending'
    }
  ]);

  expect(ordersContainer.appendChild).toHaveBeenCalled();
});

