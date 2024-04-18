const router = require("express").Router();
const isTokenValid = require("../middlewares/auth.middlewares");
const Order = require("../models/Order.model");
const Cart = require("../models/Cart.model");

// POST /api/orders to place an order for the products in the cart.
router.post("/", isTokenValid, async (req, res, next) => {
  try {
    const userId = req.payload.userId;
    const { shippingAddress, paymentMethod } = req.body;

    // Buscar el carrito del usuario en la base de datos
    const userCart = await Cart.findOne({ user: userId });

    if (!userCart || userCart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Obtener los productos del carrito
    const productsInCart = userCart.items;

    // Calcular el precio total del pedido
    let orderPrice = 0;
    for (const item of productsInCart) {
      orderPrice += item.product.price * item.quantity;
    }

    // Obtener las tiendas de los productos del carrito
    const storesIds = [
      ...new Set(productsInCart.map((item) => item.product.store)),
    ];

    // Crear la orden
    const newOrder = await Order.create({
      user: userId,
      stores: storesIds,
      shippingAddress,
      products: productsInCart,
      orderPrice,
      paymentMethod,
    });

    // Limpiar el carrito del usuario
    await userCart.remove();

    res.status(201).json({ message: "Order created successfully", newOrder });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
