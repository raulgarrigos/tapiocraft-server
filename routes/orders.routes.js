const router = require("express").Router();
const isTokenValid = require("../middlewares/auth.middlewares");
const Order = require("../models/Order.model");
const Product = require("../models/Product.model");
const Store = require("../models/Store.model");

// GET /api/orders/userId to get a list of orders placed by the current user.
router.get("/:userId/list", isTokenValid, async (req, res, next) => {
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
    const orderId = req.params.orderId;

    // Actualizar el estado del pedido y obtener el documento actualizado
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: "cancelled" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    // Verificar si order.products está vacío
    console.log("Productos del pedido:", order.products);

    // Devolver los productos al stock de las tiendas
    for (const item of order.products) {
      const productId = item.product;
      const quantityReturned = item.quantity;

      // Obtener el producto
      const product = await Product.findById(productId);

      // Verificar si Product.findById() está devolviendo los productos correctamente
      console.log("Producto encontrado:", product);

      if (!product) {
        // Manejar el caso en que el producto no se encuentra
        console.log(`Producto con ID ${productId} no encontrado`);
        continue;
      }

      // Incrementar el stock del producto
      product.stock += quantityReturned;

      try {
        // Guardar los cambios en la tienda
        await product.save();
        console.log("Stock actualizado: ", product);
      } catch (error) {
        console.log(
          "Error al guardar los cambios en la tienda:",
          error.message
        );
      }
    }

    // Enviar la respuesta con el pedido actualizado
    res.json(order);
  } catch (error) {
    // Manejar errores
    next(error);
  }
});

module.exports = router;
