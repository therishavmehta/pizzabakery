const express = require('express')
const app = express()

const getAllPizzaController = require('./controller/getAllPizza/getAllPizza')
const port = 8080

// creating route for placeholder data and create API for pizza
app.get('/all', getAllPizzaController)

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
