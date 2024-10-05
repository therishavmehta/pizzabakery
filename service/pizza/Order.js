class Order {
  constructor({
    id,
    toppings,
    pizza_name,
    base,
    rating,
    table_number,
    status,
    start_time
  }) {
    this.id = id;
    this.toppings = toppings;
    this.status = status;
    this.pizza_name = pizza_name;
    this.base = base;
    this.rating = rating;
    this.table_number = table_number;
    this.timeline = {
      PENDING: start_time,
      DOUGH_PENDING: 0,
      DOUGH_PROGRESS: 0,
      DOUGH_COMPLETED: 0,
      TOPPINGS_PENDING: 0,
      TOPPINGS_PROGRESS: 0,
      TOPPINGS_COMPLETED: 0,
      BAKING_PENDING: 0,
      BAKING_PROGRESS: 0,
      BAKING_COMPLETED: 0,
      SERVING_PENDING: 0,
      SERVING_PROGRESS: 0,
      SERVING_COMPLETED: 0,
      COMPLETED: 0
    };
  }
}

module.exports = Order;
