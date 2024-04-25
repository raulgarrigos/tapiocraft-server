const router = require("express").Router();
const User = require("../models/User.model");
const isTokenValid = require("../middlewares/auth.middlewares");
const uploader = require("../middlewares/cloudinary.config");

// GET /api/profile/:userId to get the current user's profile information.
router.get("/:userId/details", isTokenValid, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// PUT /api/profile/:userId to update the current user's profile information.
router.put("/:userId/update", isTokenValid, async (req, res, next) => {
  const { firstName, lastName, address, dateOfBirth, phoneNumber } = req.body;

  const { userId } = req.params;

  try {
    await User.findByIdAndUpdate(userId, {
      firstName,
      lastName,
      address,
      dateOfBirth,
      phoneNumber,
    });
    res.json("Profile updated");
  } catch (error) {
    next(error);
  }
});

// POST "/api/profile/image" para acceder a cloudinary y actualizar la imagen de perfil
router.post(
  "/image",
  isTokenValid,
  uploader.single("image"),
  (req, res, next) => {
    if (!req.file) {
      res
        .status(400)
        .json({ errorMessage: "Ha habido un error con la imagen" });
      return;
    }
    res.json({ imageUrl: req.file.path });
  }
);

// PATCH "/api/profile/image" para actualizar imagen del perfil
router.patch(
  "/image",
  isTokenValid,
  uploader.single("image"),
  async (req, res, next) => {
    if (!req.file) {
      res
        .status(400)
        .json({ errorMessage: "Ha habido un error con la imagen" });
      return;
    }

    try {
      await User.findByIdAndUpdate(req.payload._id, {
        profilePicture: req.file.path,
      });
      res.json({ imageUrl: req.file.path });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
