const router = require("express").Router();
const isTokenValid = require("../middlewares/auth.middlewares");
const Product = require("../models/Product.model");
const Order = require("../models/Order.model");
const Review = require("../models/Review.model");

// GET /api/products to get a list of all available products.
router.get("/", async (req, res, next) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:productId/reviews to get a list of reviews for a specific product.
router.get("/:productId/reviews", async (req, res, next) => {
  try {
    const reviews = await Product.find({ reviews: req.params.productId });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

// POST /api/products/:productId/reviews to add a review to a product.
router.post("/:productId/review", isTokenValid, async (req, res, next) => {
  const { rating, comment } = req.body;
  const productId = req.params.productId;
  const userId = req.payload._id;

  try {
    // Verifica si el usuario ha comprado el producto
    const order = await Order.findOne({ userId, products: productId });

    if (!order) {
      return res
        .status(403)
        .json({ message: "You can only review products you have purchased." });
    }

    // Si el usuario ha comprado el producto, puedes proceder a añadir la reseña

    const review = await Review.create({
      userId,
      productId,
      rating,
      comment,
    });

    await Product.findByIdAndUpdate(productId, {
      $push: { reviews: review._id },
    });

    res.status(201).json({ message: "Review added successfully.", review });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:productId to get the information of a specific product.

// GET /api/products/filter (optional) to filter products by different criteria.
// GET /api/products/search (optional) to search for products by name or description.
module.exports = router;
