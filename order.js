// order.js

class Order {
  constructor(id, items, total, status = 'Pending', userId = null) {
    this.id = id;
    this.items = items;
    this.total = total;
    this.status = status;
    this.userId = userId;
    this.createdAt = new Date();
  }
}

class OrderRepository {
  constructor() {
    this.storageKey = 'chokosferaOrders';
  }

  saveOrder(order) {
    const orders = this.getAllOrders();
    orders.push(order);
    localStorage.setItem(this.storageKey, JSON.stringify(orders));
  }

  getAllOrders() {
    const orders = localStorage.getItem(this.storageKey);
    return orders ? JSON.parse(orders) : [];
  }

  updateOrder(updatedOrder) {
    let orders = this.getAllOrders();
    orders = orders.map(order => order.id === updatedOrder.id ? updatedOrder : order);
    localStorage.setItem(this.storageKey, JSON.stringify(orders));
  }

  deleteOrder(orderId) {
    let orders = this.getAllOrders();
    orders = orders.filter(order => order.id !== orderId);
    localStorage.setItem(this.storageKey, JSON.stringify(orders));
  }
}

class OrderService {
  constructor(repository) {
    this.repository = repository;
    this.cart = [];
    this.points = 0; // Simple points tracking
  }

  // Related methods
  addToCart(item) {
    this.cart.push(item);
    console.log(`${item.name} added to cart.`);
  }

  calculateTotal() {
    return this.cart.reduce((total, item) => total + item.price, 0);
  }

  addPoints(amount) {
    // 1 point per 10 currency units, for example
    this.points += Math.floor(amount / 10);
    console.log(`Added points. Total points: ${this.points}`);
  }

  redeemPoints(pointsToRedeem) {
    if (this.points >= pointsToRedeem) {
      this.points -= pointsToRedeem;
      console.log(`Redeemed ${pointsToRedeem} points.`);
      return true;
    }
    console.log('Not enough points.');
    return false;
  }

  // Core Order methods
  placeOrder(userId = null) {
    if (this.cart.length === 0) {
      throw new Error("Cart is empty");
    }

    const total = this.calculateTotal();
    const newOrder = new Order(Date.now().toString(), [...this.cart], total, 'Pending', userId);
    
    this.repository.saveOrder(newOrder);
    this.addPoints(total);
    
    // Clear cart after placing order
    this.cart = [];
    return newOrder;
  }

  cancelOrder(orderId) {
    const orders = this.repository.getAllOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'Cancelled';
      this.repository.updateOrder(order);
      console.log(`Order ${orderId} cancelled.`);
    } else {
      throw new Error("Order not found");
    }
  }

  viewOrders() {
    return this.repository.getAllOrders();
  }

  updateOrderStatus(orderId, newStatus) {
    const orders = this.repository.getAllOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      this.repository.updateOrder(order);
      console.log(`Order ${orderId} status updated to ${newStatus}.`);
    } else {
      throw new Error("Order not found");
    }
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
    const total = this.service.calculateTotal();
    console.log(`Current cart total: ${total}`);
    return total;
  }

  placeOrder() {
    try {
      let userId = null;
      try {
        const saved = localStorage.getItem('chokosferaUser');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.id) userId = parsed.id;
        }
      } catch (e) {
        console.warn('Could not read saved user', e);
      }

      const order = this.service.placeOrder(userId);
      console.log('Order placed successfully:', order);
      this.viewOrders();
      this.renderCart(); // Clear cart display
    } catch (error) {
      alert('Failed to place order: ' + error.message);
      console.error('Failed to place order:', error.message);
    }
  }

  cancelOrder(orderId) {
    try {
      this.service.cancelOrder(orderId);
      this.viewOrders();
    } catch (error) {
      console.error(error.message);
    }
  }

  viewOrders() {
    const orders = this.service.viewOrders();
    console.log("All Orders:", orders);
    this.renderOrders(orders);
  }

  updateOrderStatus(orderId, status) {
    try {
      this.service.updateOrderStatus(orderId, status);
      this.viewOrders();
    } catch (error) {
      console.error(error.message);
    }
  }

  addPoints(amount) {
    this.service.addPoints(amount);
  }

  redeemPoints(points) {
    this.service.redeemPoints(points);
  }

  // UI rendering methods
  renderCart() {
    const cartContainer = document.getElementById('cartContainer');
    if (!cartContainer) return;

    cartContainer.innerHTML = '';
    this.service.cart.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerText = `${item.name} - ${item.price.toFixed(2)} KM`;
      cartContainer.appendChild(div);
    });

    const totalDiv = document.getElementById('cartTotal');
    if (totalDiv) {
      totalDiv.innerText = `Total: ${this.calculateTotal().toFixed(2)} KM`;
    }
  }

  renderOrders(orders) {
    const ordersContainer = document.getElementById('ordersContainer');
    if (!ordersContainer) return;

    ordersContainer.innerHTML = '';
    
    if (orders.length === 0) {
      ordersContainer.innerHTML = '<p>No orders placed yet.</p>';
      return;
    }

    // Display newest orders first
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

// Initialize the application components
const repository = new OrderRepository();
const service = new OrderService(repository);
const appController = new OrderController(service);