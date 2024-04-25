const router = require("express").Router();
const isTokenValid = require("../middlewares/auth.middlewares");
const Order = require("../models/Order.model");
const Cart = require("../models/Cart.model");
const Product = require("../models/Product.model");

// POST /api/checkout/:cartId to place an order for the products in the cart.
router.post("/:cartId/order", isTokenValid, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { cartId } = req.params;
    const { name, surname, shippingAddress, paymentMethod } = req.body;

    // Buscar el carrito del usuario en la base de datos
    const userCart = await Cart.findOne({ _id: cartId });

    if (!userCart || userCart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Obtener los productos del carrito
    const productsInCart = userCart.items;

    // Calcular el precio total del pedido
    let orderPrice = 0;
    for (const item of productsInCart) {
      // Obtener el precio del producto asociado al item del carrito
      const product = await Product.findById(item.product);
      // Verificar si se encontró el producto
      if (!product) {
        return res.status(400).json({ message: "Product not found" });
      }
      // Calcular el subtotal del item (precio del producto * cantidad)
      const subtotal = product.price * item.quantity;
      // Sumar el subtotal al precio total del pedido
      orderPrice += subtotal;
    }

    // Obtener las tiendas de los productos del carrito
    const storesIds = [
      ...new Set(
        await Promise.all(
          productsInCart.map(async (item) => {
            // Buscar el producto en la base de datos para obtener la tienda
            const product = await Product.findById(item.product);
            // Verificar si se encontró el producto y obtener el ID de la tienda
            if (product && product.store) {
              return product.store.toString(); // Convertir a cadena si es necesario
            }
            return null; // Retornar null si no se encontró el producto o no tiene tienda
          })
        )
      ),
    ].filter((id) => id); // Eliminar valores nulos del array

    // Crear la orden
    const newOrder = await Order.create({
      user: userId,
      name,
      surname,
      stores: storesIds,
      shippingAddress,
      products: productsInCart,
      orderPrice,
      paymentMethod,
    });

    // Limpiar el carrito del usuario
    await Cart.deleteOne({ _id: userCart._id });

    res.status(201).json({ message: "Order created successfully", newOrder });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
