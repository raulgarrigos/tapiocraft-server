const router = require("express").Router();
const isTokenValid = require("../middlewares/auth.middlewares");
const Order = require("../models/Order.model");

// GET /api/orders/userId to get a list of orders placed by the current user.
router.get("/:userId", isTokenValid, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.params.userId });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/userId/:orderID to get the information of a specific order.
router.get("/:userId/:orderId", isTokenValid, async (req, res, next) => {
  try {
    const response = await Order.findOne({
      user: req.params.userId,
      _id: req.params.orderId,
    })
      .populate("user")
      .populate("stores")
      .populate("products.product");
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/orders/:orderID (optional) to cancel or modify an order.
module.exports = router;
