const Staff = require('./Staff');

class Waiter extends Staff {
  constructor(id) {
    super(id);
  }

  servePizza() {
    return this.performTask(5000, 'serving pizza'); // 5 seconds
  }
}

module.exports = Waiter;
