const EventEmitter = require('events');
const Order = require('./Order');
const DoughChef = require('./DoughChef');
const ToppingChef = require('./ToppingChef');
const Waiter = require('./Waiter');
const Oven = require('./Oven');

const status = {
  PENDING: 'PENDING',
  DOUGH_PENDING: 'DOUGH_PENDING',
  DOUGH_PROGRESS: 'DOUGH_PROGRESS',
  DOUGH_COMPLETED: 'DOUGH_COMPLETED',
  TOPPINGS_PENDING: 'TOPPINGS_PENDING',
  TOPPINGS_PROGRESS: 'TOPPINGS_PROGRESS',
  TOPPINGS_COMPLETED: 'TOPPINGS_COMPLETED',
  BAKING_PENDING: 'BAKING_PENDING',
  BAKING_PROGRESS: 'BAKING_PROGRESS',
  BAKING_COMPLETED: 'BAKING_COMPLETED',
  SERVING_PENDING: 'SERVING_PENDING',
  SERVING_PROGRESS: 'SERVING_PROGRESS',
  SERVING_COMPLETED: 'SERVING_COMPLETED',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR'
};

class PizzaRestaurant extends EventEmitter {
  constructor(io) {
    super();
    this.io = io;
    this.orderQueue = [];
    this.ordersInProgress = {};
    this.doughChefs = [new DoughChef(1), new DoughChef(2)];
    this.toppingChefs = [
      new ToppingChef(1),
      new ToppingChef(2),
      new ToppingChef(3)
    ];
    this.waiters = [new Waiter(1), new Waiter(2)];
    this.oven = new Oven();
    this.currentOrderId = 1;

    this.on('newOrder', this.processOrders.bind(this));
  }

  addOrder(orderData) {
    const order = new Order({ ...orderData });
    this.orderQueue.push(order);
    this.ordersInProgress[order.id] = order;
    console.log(`Order ${order.id} added to the queue`);
    this.emit('newOrder');
    this.io.emit('orderCreated', { id: order.id, status: order.status });
    return order.id;
  }

  getCurrentOrder() {
    return this.orderQueue;
  }

  async processOrders() {
    while (this.orderQueue.length > 0) {
      const order = this.orderQueue.shift();
      await this.processOrder(order);
    }
  }

  emitOrderData(order) {
    this.io.emit('orderStatus', {
      ...order,
      id: order.id,
      status: order.status
    });
  }

  async processOrder(order) {
    try {
      order.status = status.DOUGH_PENDING;
      this.emitOrderData(order);
      const doughChef = await this.getAvailableDoughChef();
      order.status = status.DOUGH_PROGRESS;
      this.emitOrderData(order);
      await doughChef.prepareDough();
      order.status = status.DOUGH_COMPLETED;
      this.emitOrderData(order);

      order.status = status.TOPPINGS_PENDING;
      this.emitOrderData(order);
      // Process toppings in batches of up to 2
      const getAllToppingChefs = [];
      while (order.toppings.length > 0) {
        const toppingCount = Math.min(2, order.toppings.length);
        const toppingsToProcess = order.toppings.splice(0, toppingCount);

        const toppingChef = await this.getAvailableToppingChef(toppingCount);
        order.status = status.TOPPINGS_PROGRESS;
        this.emitOrderData(order);
        toppingChef.isBusy = true;
        getAllToppingChefs.push(toppingChef.addToppings.bind(toppingChef, 2));
      }
      await Promise.all(getAllToppingChefs.map((fn) => fn()));
      order.status = status.TOPPINGS_COMPLETED;
      this.emitOrderData(order);

      order.status = status.BAKING_PENDING;
      this.emitOrderData(order);
      await this.getAvailableOven();
      order.status = status.BAKING_PROGRESS;
      this.emitOrderData(order);
      await this.oven.bakePizza(order);
      order.status = status.BAKING_COMPLETED;
      this.emitOrderData(order);

      order.status = status.SERVING_PENDING;
      this.emitOrderData(order);
      const waiter = await this.getAvailableWaiter();
      order.status = status.SERVING_PROGRESS;
      this.emitOrderData(order);
      await waiter.servePizza();

      order.status = status.COMPLETED;
      this.emitOrderData(order);
      console.log(`Order ${order.id} completed!`);
      delete this.ordersInProgress[order.id];
    } catch (error) {
      console.error(`Error processing order ${order.id}:`, error);
      order.status = status.ERROR;
      this.emitOrderData(order);
    }
  }

  getAvailableDoughChef() {
    return new Promise((resolve) => {
      const checkAvailability = () => {
        const availableChef = this.doughChefs.find((chef) => !chef.getIsBusy());
        if (availableChef) {
          resolve(availableChef);
        } else {
          setTimeout(checkAvailability, 500);
        }
      };
      checkAvailability();
    });
  }

  getAvailableToppingChef() {
    return new Promise((resolve) => {
      const checkAvailability = () => {
        const availableChef = this.toppingChefs.find(
          (chef) => !chef.getIsBusy()
        );
        if (availableChef) {
          resolve(availableChef);
        } else {
          setTimeout(checkAvailability, 500);
        }
      };
      checkAvailability();
    });
  }

  getAvailableOven() {
    return new Promise((resolve) => {
      const checkAvailability = () => {
        if (!this.oven.getIsBusy()) {
          resolve();
        } else {
          setTimeout(checkAvailability, 500);
        }
      };
      checkAvailability();
    });
  }

  getAvailableWaiter() {
    return new Promise((resolve) => {
      const checkAvailability = () => {
        const availableWaiter = this.waiters.find(
          (waiter) => !waiter.getIsBusy()
        );
        if (availableWaiter) {
          resolve(availableWaiter);
        } else {
          setTimeout(checkAvailability, 500);
        }
      };
      checkAvailability();
    });
  }
}

module.exports = PizzaRestaurant;
