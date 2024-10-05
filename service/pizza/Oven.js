class Oven {
    constructor() {
      this.isBusy = false;
    }
  
    bakePizza() {
      this.isBusy = true;
      console.log('Oven started baking pizza');
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('Oven finished baking pizza');
          this.isBusy = false;
          resolve();
        }, 10000);
      });
    }
  
    getIsBusy() {
      return this.isBusy;
    }
  }
  
  module.exports = Oven;
  