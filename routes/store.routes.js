const router = require("express").Router();
const isTokenValid = require("../middlewares/auth.middlewares");
const uploader = require("../middlewares/cloudinary.config");
const Store = require("../models/Store.model");
const Product = require("../models/Product.model");
const Order = require("../models/Order.model");
const Review = require("../models/Review.model");

// GET /api/store para obtener todas las tiendas.
router.get("/", async (req, res, next) => {
  try {
    const stores = await Store.find();
    res.json(stores);
  } catch (error) {
    next(error);
  }
});

// POST /api/store/create to create a new store.
router.post("/create", isTokenValid, async (req, res, next) => {
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

// GET /api/store/:userId/list para obtener las tiendas de un usuario específico.
router.get("/:userId/list", async (req, res, next) => {
  try {
    const stores = await Store.find({ owner: req.params.userId });
    res.json(stores);
  } catch (error) {
    next(error);
  }
});

// GET /api/store/:storeId to get the information of a store.
router.get("/:storeId/details", async (req, res, next) => {
  try {
    const response = await Store.findById(req.params.storeId);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /api/store/:storeId to edit a store.
router.put("/:storeId/edit", isTokenValid, async (req, res, next) => {
  const { name, description, address, category, refundPolicy } = req.body;
  const { storeId } = req.params;

  try {
    // Verificar si el usuario tiene permisos para editar la tienda
    const store = await Store.findById(storeId);
    if (!store || store.owner.toString() !== req.payload._id) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para editar esta tienda" });
    }

    const response = await Store.findByIdAndUpdate(storeId, {
      name,
      description,
      address,
      category,
      refundPolicy,
    });
    res.json("Store updated successfully");
  } catch (error) {
    next(error);
  }
});

// DELETE /api/store/:storeId to delete a store
router.delete("/:storeId/delete", isTokenValid, async (req, res, next) => {
  try {
    // Verificar si el usuario tiene permisos para eliminar la tienda
    const store = await Store.findById(req.params.storeId);
    if (!store || store.owner.toString() !== req.payload._id) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para eliminar esta tienda" });
    }

    await Store.findByIdAndDelete(req.params.storeId);
    res.json("Store deleted");
  } catch (error) {
    next(error);
  }
});

// POST /api/store/:storeId/products to add a product to a store.
router.post("/:storeId/product", isTokenValid, async (req, res, next) => {
  const { name, description, price, category, stock } = req.body;
  const storeId = req.params.storeId;
  const ownerId = req.payload._id;

  try {
    // Verificar si el usuario tiene permisos para añadir un producto a la tienda
    const store = await Store.findById(storeId);
    if (!store || store.owner.toString() !== ownerId) {
      return res.status(403).json({
        message: "No tienes permiso para añadir un producto a esta tienda",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      store: storeId,
      ownerId,
    });

    // Añadir el ID del producto a la lista de productos de la tienda
    await Store.findByIdAndUpdate(storeId, {
      $push: { products: product._id },
    });

    res.json(product);
  } catch (error) {
    next(error);
  }
});

// GET /api/store/:storeId/products to get a list of products in a specific store.
router.get("/:storeId/products", async (req, res, next) => {
  try {
    const response = await Store.findById(req.params.storeId).populate(
      "products"
    );

    if (!response) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    res.json(response.products);
  } catch (error) {
    next(error);
  }
});

// GET /api/store/:storeId/products/:productId to get a specific product in a specific store.
router.get("/:storeId/products/:productId", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
});

// PUT /api/store/:storeId/products/:productId to edit the information of a product in a store.
router.put(
  "/:storeId/products/:productId",
  isTokenValid,
  async (req, res, next) => {
    try {
      const { name, description, price, category, stock } = req.body;
      const { storeId, productId } = req.params;

      // Verificar si el usuario tiene permisos para editar el producto
      const store = await Store.findById(storeId);
      if (!store || store.owner.toString() !== req.payload._id) {
        return res
          .status(403)
          .json({ message: "No tienes permiso para editar este producto" });
      }

      // Actualizar el producto
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
          name,
          description,
          price,
          category,
          stock,
        },
        { new: true } // Para obtener el producto actualizado
      );

      if (!updatedProduct) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      res.json(updatedProduct);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH "/api/store/:storeId/products/:productId/image" para añadir imagenes al producto
router.patch(
  "/:storeId/products/:productId/image",
  isTokenValid,
  uploader.array("images"),
  async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      res
        .status(400)
        .json({ errorMessage: "No se han proporcionado imágenes" });
      return;
    }

    try {
      const product = await Product.findById(req.params.productId);
      if (!product) {
        res.status(404).json({ errorMessage: "Producto no encontrado" });
        return;
      }

      const newImages = req.files.map((file) => file.path); //
      product.images = product.images.concat(newImages); //
      await product.save();

      res.json({ imageUrls: newImages });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE "/api/store/:storeId/products/:productId/image" para eliminar imagen del perfil
router.delete(
  "/:storeId/products/:productId/image",
  isTokenValid,
  async (req, res, next) => {
    const imageToDeletePath = req.body.imagePath;

    if (!imageToDeletePath) {
      res.status(400).json({
        errorMessage: "No se ha proporcionado la ruta de la imagen a eliminar",
      });
      return;
    }

    try {
      const product = await Product.findById(req.params.productId);
      if (!product) {
        res.status(404).json({ errorMessage: "Producto no encontrado" });
        return;
      }

      // Encuentra el índice de la imagen a eliminar en el array de imágenes del producto
      const index = product.images.findIndex(
        (image) => image === imageToDeletePath
      );
      if (index === -1) {
        res.status(404).json({
          errorMessage: "La imagen seleccionada no existe en el producto",
        });
        return;
      }

      // Elimina la imagen del array de imágenes del producto
      product.images.splice(index, 1);
      await product.save();

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/store/:storeId/products/:productId to delete a product from a store.
router.delete(
  "/:storeId/products/:productId",
  isTokenValid,
  async (req, res, next) => {
    try {
      const { storeId, productId } = req.params;

      // Verificar si el usuario tiene permisos para eliminar el producto
      const store = await Store.findById(storeId);
      if (!store || store.owner.toString() !== req.payload._id) {
        return res
          .status(403)
          .json({ message: "No tienes permiso para eliminar este producto" });
      }

      // Eliminar el producto
      const deletedProduct = await Product.findByIdAndDelete(productId);

      // Actualizar la lista de productos en la tienda
      await Store.findByIdAndUpdate(storeId, {
        $pull: { products: productId },
      });

      if (!deletedProduct) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      res.json({ message: "Producto eliminado correctamente" });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/products/:productId/reviews to get a list of reviews for a specific product.
router.get("/:storeId/reviews", async (req, res, next) => {
  try {
    // Busca todas las revisiones que están asociadas con el producto específico
    const reviews = await Review.find({
      product: req.params.productId,
    }).populate("user", "username");

    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

router.post("/:storeId/review", isTokenValid, async (req, res, next) => {
  const { rating, comment } = req.body;
  const storeId = req.params.storeId;
  const userId = req.payload._id;

  try {
    // Verifica si el usuario ha comprado algo de la tienda
    const order = await Order.findOne({
      user: userId,
      stores: storeId,
    });

    if (!order) {
      return res.status(403).json({
        message: "You can only review stores you have purchased from.",
      });
    }

    // Si el usuario ha comprado algo de la tienda, procede a añadir la reseña
    const review = await Review.create({
      user: userId,
      store: storeId,
      rating,
      comment,
      reviewType: "store", // Añadir el campo reviewType
    });

    await Store.findByIdAndUpdate(storeId, {
      $push: { reviews: review._id },
    });

    // Obtiene la tienda actualizada
    const updatedStore = await Store.findById(storeId);

    res.status(201).json({
      message: "Review added successfully.",
      review,
      updatedStore,
    });
  } catch (error) {
    next(error);
  }
});

router.delete(
  "/:storeId/reviews/:reviewId",
  isTokenValid,
  async (req, res, next) => {
    const { productId, reviewId } = req.params;
    const userId = req.payload._id;

    try {
      // Verifica si la reseña pertenece al usuario actual
      const review = await Review.findOne({ _id: reviewId, user: userId });

      if (!review) {
        return res.status(404).json({
          message:
            "Review not found or user does not have permission to delete it.",
        });
      }

      // Elimina la reseña
      await Review.findByIdAndDelete(reviewId);

      // Elimina la referencia de la reseña del producto
      await Product.findByIdAndUpdate(productId, {
        $pull: { reviews: reviewId },
      });

      // Obtiene el producto actualizado
      const updatedProduct = await Product.findById(productId);

      res.json({ message: "Review deleted successfully.", updatedProduct });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
