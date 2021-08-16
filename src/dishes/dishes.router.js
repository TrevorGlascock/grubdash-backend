const router = require("express").Router();
const controller = require("./dishes.controller");
const methodNotAllowed = require("../errors/methodNotAllowed");

router
  .route("/:dishId")
  .get(controller.read) // Read one specific dish
  .put(controller.update) // Update one specific dish
  .all(methodNotAllowed); // All else not allowed

router
  .route("/")
  .get(controller.list) // List all dishes
  .post(controller.create) // Create one specific dish
  .all(methodNotAllowed); // All else not allowed

module.exports = router;
