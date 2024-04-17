const router = require("express").Router();
const Product = require("../models/Product.model");

// GET /api/products to get a list of all available products.
router.get("/", async (req, res, next) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// // GET /api/products/:productId to get the information of a specific product.
// router.get("/:productId", async (req, res, next) => {
//   try {
//     const response = await Product.findOne({
//       _id: req.params.productId,
//     });
//     console.log(`Product found`, response);
//     res.json(response);
//   } catch (error) {
//     next(error);
//   }
// });

// GET /api/products/filter (optional) to filter products by different criteria.
// GET /api/products/search (optional) to search for products by name or description.
module.exports = router;
