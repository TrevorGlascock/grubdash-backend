const { readSync } = require("fs");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

/************************** Middleware Functions **************************/
function hasDataFields(req, res, next) {
  const data = req.body.data; // grab the data from request body

  // body.data MUST have name, description, price, and image_url properties
  const requiredFields = ["name", "description", "price", "image_url"];
  for (const field of requiredFields)
    if (!data[field])
      return next({
        status: 400,
        message: `Dish must include a ${field}`,
      });

  // Save the new object to res.locals
  const { data: { name, description, price, image_url } = {} } = req.body;
  res.locals.newDish = { name, description, price, image_url };
  return next();
}

function priceIsValid(req, res, next) {
  // Price cannot be less than 0
  if (res.locals.newDish.price < 0)
    return next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
  return next();
}

function dishExists(req, res, next) {
  const dishId = req.params.dishId; // grab the dishId from the request parameters
  const foundDish = dishes.find((dish) => dish.id === dishId); // find a dish that matches the retrieved id

  // if there is no match, throw a 400 error
  if (!foundDish)
    return next({ status: 404, message: `dishId ${dishId} does not exist` });
  // else it does exist and we can save the foundDish to res.locals
  res.locals.foundDish = foundDish;
  return next();
}

/********************************* L-CRUD *********************************/
function list(req, res) {
  // List all of the dish objects as JSON
  res.json({ data: dishes });
}

function create(req, res) {
  // Adds a unique ID to the new dish object
  res.locals.newDish = { id: nextId(), ...res.locals.newDish };

  // Adds the newDish object to the array of dishes, and sends 201 response with the new object as JSON
  dishes.push(res.locals.newDish);
  res.status(201).json({ data: res.locals.newDish });
}

function read(req, res) {
  // Read the found dish object as JSON
  res.json({ data: res.locals.foundDish });
}

function update(req, res) {
  // Overwrite the found dish's data with the newDish's data
  res.locals.foundDish = { ...res.locals.foundDish, ...res.locals.newDish };
  // return the found object as json
  res.json({ data: res.locals.foundDish });
}

module.exports = {
  list: [list],
  create: [hasDataFields, priceIsValid, create],
  read: [dishExists, read],
  update: [dishExists, hasDataFields, priceIsValid, update],
};
