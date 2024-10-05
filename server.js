const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const getAllPizzaController = require('./controller/getAllPizza/getAllPizza');
const createPizzaController = require('./controller/createPizza/createPizza');
const PizzaRestaurant = require('./service/pizza/pizza.service');

const app = express();
const port = 8080;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST']
  })
);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
const pizzaRestaurant = new PizzaRestaurant(io);

// creating route for placeholder data and create API for pizza
app.get('/all', getAllPizzaController);

// route to create pizza order
app.post('/pizza', (res, req) =>
  createPizzaController(res, req, pizzaRestaurant)
);

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
