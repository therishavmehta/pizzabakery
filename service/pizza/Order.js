

class Order {
    constructor({id, toppings, pizza_name, base, rating, table_number, status}) {
      this.id = id;
      this.toppings = toppings;
      this.status = status;
      this.pizza_name = pizza_name;
      this.base = base;
      this.rating = rating;
      this.table_number=table_number;
    }
  }
  
  module.exports = Order;
  