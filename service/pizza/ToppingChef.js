const Chef = require('./Chef');

class ToppingChef extends Chef {
  constructor(id) {
    super(id);
    this.maxToppings = 2;
  }

  addToppings(toppingCount) {
    return this.performTask(4000 * toppingCount, 'adding toppings');
  }
}

module.exports = ToppingChef;
