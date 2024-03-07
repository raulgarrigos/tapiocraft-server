const router = require("express").Router();

// GET /api/orders/user to get a list of orders placed by the current user.
// GET /api/orders/:orderID to get the information of a specific order.
// PUT /api/orders/:orderID (optional) to cancel or modify an order.
module.exports = router;
