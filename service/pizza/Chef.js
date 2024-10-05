const Staff = require('./Staff');

class Chef extends Staff {
  constructor(id) {
    super(id);
  }
}

module.exports = Chef;
