const samplePizza = require('./samplePizza.json');

const pizzaController = (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end(JSON.stringify(samplePizza));
};

module.exports = pizzaController;