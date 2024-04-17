const router = require("express").Router();

router.get("/", (req, res, next) => {
  res.json("All good in here");
});

const authRouter = require("./auth.routes");
router.use("/auth", authRouter);

const profileRouter = require("./profile.routes");
router.use("/profile", profileRouter);

const productRouter = require("./products.routes");
router.use("/products", productRouter);

const storeRouter = require("./store.routes");
router.use("/store", storeRouter);

const cartRouter = require("./cart.routes");
router.use("/cart", cartRouter);

const orderRouter = require("./orders.routes");
router.use("/order", orderRouter);

const paymentRouter = require("./payment.routes");
router.use("/payment", paymentRouter);

const reviewRouter = require("./reviews.routes");
router.use("/review", reviewRouter);

const commentRouter = require("./comments.routes");
router.use("/comment", commentRouter);

module.exports = router;
