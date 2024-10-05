class Staff {
    constructor(id) {
      this.id = id;
      this.isBusy = false;
    }
  
    performTask(duration, taskDescription) {
      this.isBusy = true;
      console.log(`${this.constructor.name} ${this.id} started ${taskDescription}`);
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log(`${this.constructor.name} ${this.id} finished ${taskDescription}`);
          this.isBusy = false;
          resolve();
        }, duration);
      });
    }
  
    getId() {
      return this.id;
    }
  
    getIsBusy() {
      return this.isBusy;
    }
  }
  
  module.exports = Staff;
  