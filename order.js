class Order {
  constructor(id, items, total, status = 'Pending', userId = null, createdAt = null) {
    this.id = id;
    this.items = items;
    this.total = total;
    this.status = status;
    this.userId = userId;
    this.createdAt = createdAt || new Date().toISOString();
  }
}

class OrderRepository {
  async saveOrder(order) {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: order.items, total: order.total, userId: order.userId })
    });
    if (!res.ok) throw new Error('Failed to save order');
    const data = await res.json();
    return data.order;
  }

  async getAllOrders() {
    let userId = null;
    try {
      const saved = localStorage.getItem('chokosferaUser');
      if (saved) userId = JSON.parse(saved).id;
    } catch (e) {}
    const url = userId ? `/api/orders?userId=${userId}` : '/api/orders';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return await res.json();
  }

  async cancelOrder(orderId) {
    const res = await fetch(`/api/orders/${orderId}/cancel`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to cancel order');
    return await res.json();
  }
}

class OrderService {
  constructor(repository) {
    this.repository = repository;
    this.cart = [];
  }

  addToCart(item) {
    this.cart.push(item);
  }

  calculateTotal() {
    return this.cart.reduce((total, item) => total + item.price, 0);
  }

  async placeOrder(userId = null) {
    if (this.cart.length === 0) throw new Error("Cart is empty");
    const total = this.calculateTotal();
    const order = new Order(null, [...this.cart], total, 'Pending', userId);
    const saved = await this.repository.saveOrder(order);
    this.cart = [];
    return saved;
  }

  async cancelOrder(orderId) {
    return await this.repository.cancelOrder(orderId);
  }

  async viewOrders() {
    return await this.repository.getAllOrders();
  }
}

class OrderController {
  constructor(service) {
    this.service = service;
  }

  addToCart(item) {
    this.service.addToCart(item);
    this.renderCart();
  }

  calculateTotal() {
    return this.service.calculateTotal();
  }

  async placeOrder() {
    try {
      let userId = null;
      try {
        const saved = localStorage.getItem('chokosferaUser');
        if (saved) userId = JSON.parse(saved).id;
      } catch (e) {}
      await this.service.placeOrder(userId);
      alert('Order placed successfully!');
      this.renderCart();
      await this.viewOrders();
    } catch (error) {
      alert('Failed to place order: ' + error.message);
    }
  }

  async cancelOrder(orderId) {
    try {
      await this.service.cancelOrder(orderId);
      await this.viewOrders();
    } catch (error) {
      alert('Failed to cancel order: ' + error.message);
    }
  }

  async viewOrders() {
    const orders = await this.service.viewOrders();
    this.renderOrders(orders);
  }

  renderCart() {
    const cartContainer = document.getElementById('cartContainer');
    if (!cartContainer) return;
    cartContainer.innerHTML = '';
    this.service.cart.forEach(item => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerText = `${item.name} - ${item.price.toFixed(2)} KM`;
      cartContainer.appendChild(div);
    });
    const totalDiv = document.getElementById('cartTotal');
    if (totalDiv) totalDiv.innerText = `Total: ${this.calculateTotal().toFixed(2)} KM`;
  }

  renderOrders(orders) {
    const ordersContainer = document.getElementById('ordersContainer');
    if (!ordersContainer) return;
    ordersContainer.innerHTML = '';
    if (orders.length === 0) {
      ordersContainer.innerHTML = '<p>No orders placed yet.</p>';
      return;
    }
    [...orders].reverse().forEach(order => {
      const div = document.createElement('div');
      div.className = 'order-card';
      const isPending = order.status === 'Pending';
      const itemsList = order.items.map(i => i.name).join(', ');
      div.innerHTML = `
        <h3>Order #${order.id.slice(-6)}</h3>
        <p><strong>Items:</strong> ${itemsList}</p>
        <p><strong>Total:</strong> ${order.total.toFixed(2)} KM</p>
        <p><strong>Status:</strong> <span style="color: ${order.status === 'Cancelled' ? 'red' : 'green'}">${order.status}</span></p>
        ${isPending ? `<button class="btn btn-cancel" onclick="appController.cancelOrder('${order.id}')">Cancel Order</button>` : ''}
      `;
      ordersContainer.appendChild(div);
    });
  }
}

const repository = new OrderRepository();
const service = new OrderService(repository);
const appController = new OrderController(service);