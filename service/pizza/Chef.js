const Staff = require('./staff');

class Chef extends Staff {
  constructor(id) {
    super(id);
  }
}

module.exports = Chef;
