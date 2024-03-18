const router = require("express").Router();
const isTokenValid = require("../middlewares/auth.middlewares");
const Store = require("../models/Store.model");

// POST /api/store to create a new store.
router.post("/", isTokenValid, async (req, res, next) => {
  const { name, description, category } = req.body;

  try {
    const response = await Store.create({
      name,
      description,
      owner: req.payload._id,
      category,
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/store/:storeId to get the information of a store.
router.get("/:storeId", isTokenValid, async (req, res, next) => {
  try {
    const response = await Store.findOne({
      _id: req.params.storeId,
      owner: req.payload._id,
    });
    console.log(response);
    res.json(response);
  } catch (error) {
    next(error);
  }
});
// PUT /api/store/:storeId to edit a store.
router.put("/:storeId", isTokenValid, async (req, res, next) => {
  const { name, description, address, category, refundPolicy } = req.body;
  const { storeId } = req.params;

  try {
    const response = await Store.findByIdAndUpdate(storeId, {
      name,
      description,
      address,
      category,
      refundPolicy,
    });
    console.log(response);
    res.json("Store updated successfully");
  } catch (error) {
    next(error);
  }
});

// DELETE /api/store/:storeId to delete a store
router.delete("/:storeId", isTokenValid, async (req, res, next) => {
  try {
    await Store.findByIdAndDelete(req.params.storeId);
    res.json("Store deleted");
  } catch (error) {
    next(error);
  }
});

// POST /api/store/:storeId/products to add a product to a store.
// GET /api/store/:storeId/products to get a list of products in a specific store.
// PUT /api/store/:storeId/products/:productId to edit the information of a product in a store.
// DELETE /api/store/:storeId/products/:productId to delete a product from a store.
module.exports = router;
