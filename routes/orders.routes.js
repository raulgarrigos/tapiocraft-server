const router = require("express").Router();
const isTokenValid = require("../middlewares/auth.middlewares");
const Order = require("../models/Order.model");
const Product = require("../models/Product.model");
const Store = require("../models/Store.model");

// GET /api/orders/userId to get a list of orders placed by the current user.
router.get("/:userId", isTokenValid, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.params.userId });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:userId/:orderID to get the information of a specific order.
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

// PUT /api/orders/:userId/:orderId (optional) to cancel or modify an order.
router.put("/:userId/:orderId", isTokenValid, async (req, res, next) => {
  try {
    const response = await Order.findByIdAndUpdate(req.params.orderId, {
      status: "cancelled",
    });

    // Devolver los productos al stock de las tiendas
    for (const item of response.products) {
      const product = await Product.findById(item.product);

      // Verificar si el producto existe
      if (product) {
        // Incrementar el stock del producto en la tienda correspondiente
        const store = await Store.findById(product.store);
        if (store) {
          store.stock += item.quantity;
          await store.save();
        }
      }
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
});
module.exports = router;
