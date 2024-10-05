const { Schema, model } = require('mongoose');

const Order = new Schema({
  id: {
    type: String,
    required: false,
    maxLength: 100
  },
  toppings: {
    type: Array,
    required: true
  },
  pizza_name: {
    type: String,
    required: false
  },
  base: {
    type: String,
    required: false
  },
  rating: {
    type: String,
    required: false
  },
  table_number: {
    type: String,
    required: false
  },
  status: {
    type: String,
    required: false
  }
});

const orderModel = model('Orders', Order);

module.exports = orderModel;
