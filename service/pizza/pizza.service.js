const { EventEmitter } = require('events');
const Order = require('./Order');
const DoughChef = require('./DoughChef');
const ToppingChef = require('./ToppingChef');
const Waiter = require('./Waiter');
const Oven = require('./Oven');
const { MongoClient } = require('mongodb');

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

    // MongoDB Setup
    this.mongoClient = new MongoClient(
      process.env.MONGO_URL || 'mongodb://localhost:27017'
    );
    this.db = null;
    this.initDB();

    this.on('newOrder', this.processOrders.bind(this));
  }

  async initDB() {
    try {
      await this.mongoClient.connect();
      this.db = this.mongoClient.db(process.env.DB_NAME);
      console.log('Connected to MongoDB');
      //   this.db
      //     .collection('completedOrders')
      //     .deleteMany({ status: status.COMPLETED });
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  }

  addOrder(orderData) {
    const order = new Order({ ...orderData });
    this.orderQueue.push(order);
    this.ordersInProgress[order.id] = order;
    console.log(`Order ${order.id} added to the queue`);
    this.emit('newOrder');
    this.saveDataToDb(order);
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
    order.timeline[order.status] = new Date().toISOString();
    this.updateDataToDb({
      status: order.status,
      timeline: order.timeline,
      id: order._id
    });
    this.io.emit('orderStatus', {
      ...order,
      id: order.id,
      status: order.status
    });
  }

  async processOrder(order) {
    try {
      //dough progress
      order.status = status.DOUGH_PENDING;
      this.emitOrderData(order);
      const doughChef = await this.getAvailableDoughChef();
      order.status = status.DOUGH_PROGRESS;
      this.emitOrderData(order);
      await doughChef.prepareDough();
      order.status = status.DOUGH_COMPLETED;
      this.emitOrderData(order);

      //topping progress
      order.status = status.TOPPINGS_PENDING;
      this.emitOrderData(order);
      let getAllToppingChefs = [];
      while (order.toppings.length > 0) {
        const toppingCount = Math.min(2, order.toppings.length);
        let toppingChef =
          await this.getAvailableToppingChef(getAllToppingChefs);
        if (!toppingChef && getAllToppingChefs.length > 0) {
          await Promise.all(getAllToppingChefs.map((fn) => fn()));
          getAllToppingChefs = [];
        } else if (toppingChef) {
          toppingChef.isBusy = true;
          const toppingsToProcess = order.toppings.splice(0, toppingCount);
          order.status = status.TOPPINGS_PROGRESS;
          this.emitOrderData(order);
          getAllToppingChefs.push(toppingChef.addToppings.bind(toppingChef, 2));
        }
      }
      await Promise.all(getAllToppingChefs.map((fn) => fn()));
      this.toppingChefs.forEach((chef) => (chef.isBusy = false));
      order.status = status.TOPPINGS_COMPLETED;
      this.emitOrderData(order);

      //baking progress
      order.status = status.BAKING_PENDING;
      this.emitOrderData(order);
      await this.getAvailableOven();
      order.status = status.BAKING_PROGRESS;
      this.emitOrderData(order);
      await this.oven.bakePizza(order);
      order.status = status.BAKING_COMPLETED;
      this.emitOrderData(order);

      // serving progress
      order.status = status.SERVING_PENDING;
      this.emitOrderData(order);
      const waiter = await this.getAvailableWaiter();
      order.status = status.SERVING_PROGRESS;
      this.emitOrderData(order);
      await waiter.servePizza();
      order.status = status.SERVING_COMPLETED;
      this.emitOrderData(order);

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

  async getCompletedOrders() {
    try {
      const completedOrdersCollection = this.db.collection('completedOrders');
      const completedOrders = await completedOrdersCollection
        .find({})
        .sort({ 'timeline.PENDING': -1 })
        .toArray();
      return completedOrders;
    } catch (error) {
      console.error('Error fetching completed orders:', error);
      return [];
    }
  }

  async deleteOrder(order) {
    try {
      const collection = this.db.collection('completedOrders');
      const res = await collection.deleteOne({ _id: order._id });
      return res;
    } catch (e) {}
  }

  async saveDataToDb(order) {
    try {
      const completedOrdersCollection = this.db.collection('completedOrders');
      await completedOrdersCollection.insertOne(order);
      console.log(`Order ${order.id} saved to MongoDB`);
    } catch (error) {
      console.error('Error saving completed order:', error);
    }
  }

  async updateDataToDb({ status, timeline, id }) {
    try {
      const completedOrdersCollection = this.db.collection('completedOrders');
      await completedOrdersCollection.updateOne(
        { _id: id },
        { $set: { timeline, status } },
        { upsert: false }
      );
    } catch (error) {
      console.error('Error saving completed order:', error);
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

  getAvailableToppingChef(currentChefs) {
    return new Promise((resolve) => {
      const checkAvailability = () => {
        const availableChef = this.toppingChefs.find((chef) => {
          if (!chef.getIsBusy()) {
            chef.isBusy = true;
            return true;
          }
        });
        if (availableChef) {
          resolve(availableChef);
        } else if (currentChefs.length > 0) {
          resolve(false);
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
