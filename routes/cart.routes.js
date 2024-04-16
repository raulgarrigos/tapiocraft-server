const isTokenValid = require("../middlewares/auth.middlewares");
const Product = require("../models/Product.model");

const router = require("express").Router();

// GET /api/cart to get the information of the current user's cart.
router.get("/", isTokenValid, async (req, res, next) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    next(error);
  }
});
// POST /api/cart/products/:productId to add a product to the cart.
// DELETE /api/cart/products/:productId to remove a product from the cart.

module.exports = router;
