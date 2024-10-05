const pizzaController = (req, res, pizzaService) => {
  try {
    const {
      pizza_name = 'Custom Pizza',
      toppings,
      base = 'Thin Crust',
      rating = 3.0,
      table_number = 1
    } = req.body;
    if (!toppings || !Array.isArray(toppings) || toppings.length === 0) {
      return res
        .status(400)
        .json({ error: { message: 'Toppings are required.' } });
    }
    const newPizza = {
      table_number,
      pizza_name,
      toppings,
      rating,
      base,
      status: 'Pending',
      id: crypto.randomUUID()
    };

    // in-memory db
    pizzaService.addOrder(newPizza);
    return res.status(201).json({
      message: 'Pizza created successfully',
      data: { ...newPizza }
    });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { message: 'Toppings are required.' } });
  }
};

module.exports = pizzaController;
