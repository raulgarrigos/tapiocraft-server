const isTokenValid = require("../middlewares/auth.middlewares");
const User = require("../models/User.model");

const router = require("express").Router();

// GET /api/profile/:userId to get the current user's profile information.
router.get("/:userId", isTokenValid, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    console.log(user);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// PUT /api/profile/:userId to update the current user's profile information.
router.put("/", isTokenValid, async (req, res, next) => {
  const { firstName, lastName, address, dateOfBirth, phoneNumber } = req.body;

  try {
    await User.findByIdAndUpdate(req.payload._id, {
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

module.exports = router;
