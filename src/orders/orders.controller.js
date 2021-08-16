const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

/************************** Middleware Functions **************************/
// Any request with a body needs to have valid data
function hasDataFields(req, res, next) {
  const { data } = req.body; // grab the data from request body

  // body.data MUST have deliverTo, mobileNumber, and dishes properties
  const requiredFields = ["deliverTo", "mobileNumber", "dishes"];
  for (const field of requiredFields)
    if (!data || !data[field])
      return next({
        status: 400,
        message:
          field === dishes
            ? `Order must include a ${field}`
            : `Order must include a dish`, //Message has to be dish singular, not plural like in template
      });

  const { deliverTo, mobileNumber, status, dishes } = data;
  res.locals.newDish = { deliverTo, mobileNumber, status, dishes };
  return next();
}

// Any order request with a body needs to have valid dishes array
function validateDishes(req, res, next) {
  const { dishes } = res.locals.newDish;

  // dishes MUST be an array that is not empty
  if (!Array.isArray(dishes) || !dishes.length)
    return next({
      status: 400,
      message: `Order must include at least one dish`,
    });

  // Each dish in dishes needs to have a quantity and it must be a positive integer
  dishes.forEach(({ quantity }, index) => {
    if (!quantity || quantity < 0 || !Number.isInteger(quantity))
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
  });

  return next();
}

// Any request made on /:orderId needs to have a valid orderId
function orderExists(req, res, next) {
  const orderId = req.params.orderId; // grab the orderId from the request parameters
  const foundOrder = orders.find((order) => order.id === orderId); // find an order that matches the retrieved id

  // if there is no match, throw a 400 error
  if (!foundOrder)
    return next({ status: 404, message: `orderId ${orderId} does not exist` });
  // else it does exist and we can save the foundOrder to res.locals
  res.locals.foundOrder = foundOrder;
  return next();
}

// Update requests need to ensure ids are not altered
function bodyIdMatches(req, res, next) {
  //If the request body specifies an id, it must match the id in the request url
  const bodyId = res.locals.newOrder.id;
  const routeId = res.locals.foundOrder.id;
  if (bodyId && bodyId !== routeId)
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${bodyId}, Route: ${routeId}`,
    });
  return next();
}

// Has a clause for updating orders, and adding new ones ensuring the status property is valid
function validateStatus(req, res, next) {
  // if the new status is empty or undefinded then it is invalid
  if (!res.locals.newOrder.status)
    return next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });

  // if the existing status is delivered, then it cannot be changed
  if (res.locals.foundOrder.status === "delivered")
    return next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });

  // Otherwise, status is good to go
  next();
}

function checkPending(req, res, next) {
  // Cannot delete orders unless they are still pending
  if (res.locals.foundOrder.status !== "pending")
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
    });
  next();
}

/********************************* L-CRUD *********************************/
function list(req, res) {
  // List all of the order objects as JSON
  res.json({ data: orders });
}

function create(req, res) {
  // Adds a unique ID to the new order object
  res.locals.newOrder = { id: nextId(), ...res.locals.newOrder };

  // Adds the newOrder object to the array of orders, and sends 201 response with the new object as JSON
  dishes.push(res.locals.newOrder);
  res.status(201).json({ data: res.locals.newOrder });
}

function read(req, res) {
  // Read the found dish object as JSON
  res.json({ data: res.locals.foundOrder });
}

function update(req, res) {
  // Overwrite the foundOrder's data with the newOrder's data
  res.locals.foundOrder = { ...res.locals.foundOrder, ...res.locals.newOrder };
  res.json({ data: res.locals.foundOrder });
}

function destroy(req, res) {
  // Find the index of the foundOrder within the orders array and remove it
  const index = orders.indexOf(res.locals.foundOrder);
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list: [list],
  create: [hasDataFields, validateDishes, validateStatus, create],
  read: [orderExists, read],
  update: [
    orderExists,
    hasDataFields,
    validateDishes,
    bodyIdMatches,
    validateStatus,
    update,
  ],
  delete: [orderExists, checkPending, destroy],
};
