const Orders = require('../models/Order.model');

const previousOrdersController = async (req, res, pizzaRestaurant) => {
  try {
    const orders = await pizzaRestaurant.getCompletedOrders();
    res.status(200).json(orders);
  } catch {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

module.exports = previousOrdersController;
