const router = require("express").Router();
const isTokenValid = require("../middlewares/auth.middlewares");
const Cart = require("../models/Cart.moddel");
const Product = require("../models/Product.model");

// GET /api/cart to get the information of the current user's cart.
router.get("/", isTokenValid, async (req, res, next) => {
  try {
    // Obtener el ID del usuario del token de autenticación
    const userId = req.payload.userId;

    // Buscar el carrito del usuario actual en la base de datos
    const userCart = await Cart.findOne({ user: userId }).populate(
      "items.product"
    );

    // Verificar si se encontró el carrito del usuario
    if (!userCart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Devolver los detalles del carrito como respuesta
    res.status(200).json({ cart: userCart });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// POST /api/cart/products/:productId to add a product to the cart.
router.post("/products/:productId", isTokenValid, async (req, res, next) => {
  try {
    // Obtener el ID del usuario del token de autenticación
    const userId = req.payload.userId;
    const productId = req.params.productId;

    // Buscar el carrito del usuario actual en la base de datos
    let userCart = await Cart.findOne({ user: userId });

    // Si no existe el carrito, crear uno nuevo
    if (!userCart) {
      userCart = new Cart({ user: userId, items: [] });
    }

    // Verificar si el producto ya está en el carrito
    const existingItem = userCart.items.find(
      (item) => item.product.toString() === productId
    );

    // Verificar si hay suficiente stock del producto
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.stock < 1) {
      return res.status(400).json({ message: "Product out of stock" });
    }

    // Si el producto ya está en el carrito, incrementar la cantidad
    if (existingItem) {
      existingItem.quantity++;
    } else {
      // Si el producto no está en el carrito, añadirlo
      userCart.items.push({ product: productId });
    }

    // Decrementar el stock del producto en 1
    product.stock--;
    await product.save();

    // Guardar el carrito actualizado en la base de datos
    await userCart.save();

    // Devolver una respuesta exitosa
    res.status(200).json({ message: "Product added to cart successfully" });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// DELETE /api/cart/products/:productId to remove a product from the cart.
router.delete("/products/:productId", isTokenValid, async (req, res, next) => {
  try {
    const userId = req.payload.userId;
    const productId = req.params.productId;

    let userCart = await Cart.findOne({ user: userId });

    if (!userCart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const index = userCart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (index === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Guardar la cantidad del producto antes de eliminarlo del carrito
    const quantity = userCart.items[index].quantity;

    // Eliminar el producto del carrito
    if (quantity > 1) {
      userCart.items[index].quantity--;
    } else {
      userCart.items.splice(index, 1);
    }

    // Guardar el carrito actualizado en la base de datos
    await userCart.save();

    // Recuperar el producto de la base de datos
    const product = await Product.findById(productId);

    // Incrementar el stock del producto eliminado del carrito
    if (product) {
      product.stock++; // Incrementar el stock
      await product.save(); // Guardar el producto actualizado
    }

    res.status(200).json({ message: "Product removed from cart successfully" });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
