const router = require("express").Router();
const controller = require("./orders.controller");
const methodNotAllowed = require("../errors/methodNotAllowed");

router
  .route("/:orderId")
  .get(controller.read) // Read one specific order
  .put(controller.update) // Update one specific order
  .delete(controller.delete) // Delete one specific order
  .all(methodNotAllowed); // All else not allowed

router
  .route("/")
  .get(controller.list) // List all orders
  .post(controller.create) // Create a new order
  .all(methodNotAllowed); // All else not allowed

module.exports = router;
