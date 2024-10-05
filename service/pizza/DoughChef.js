const Chef = require('./Chef');

class DoughChef extends Chef {
  constructor(id) {
    super(id);
  }

  prepareDough() {
    return this.performTask(7000, 'preparing dough');
  }
}

module.exports = DoughChef;
