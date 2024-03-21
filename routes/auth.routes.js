const User = require("../models/User.model");
const bcrypt = require("bcryptjs");
const router = require("express").Router();
const jwt = require("jsonwebtoken");
const isTokenValid = require("../middlewares/auth.middlewares");

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 3 * 60 * 1000;

let loginAttempts = {};

// POST "/api/auth/register" to create a new user
router.post("/register", async (req, res, next) => {
  const { username, email, password } = req.body;

  // Empty fields validation
  if (!username || !email || !password) {
    res.status(400).json({ errorMessage: "All fields must be filled" });
    return;
  }

  // Secure password validation
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm;
  if (passwordRegex.test(password) === false) {
    res.status(400).json({
      errorMessage:
        "The password is not secure enough. It must be at least 8 characters long, contain uppercase and lowercase letters, and include a number.",
    });
    return;
  }

  // Valid email format validation
  const emailRegex =
    /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/gm;

  if (emailRegex.test(email) === false) {
    res.status(400).json({
      errorMessage: "Invalid email format",
    });
    return;
  }

  // Username validation
  if (username.length < 6 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    res.status(400).json({
      errorMessage:
        "The username must be at least 6 characters long and contain only letters, numbers, and underscores (_).",
      field: "username",
    });
    return;
  }

  try {
    // Check for duplicate username and email
    const foundUser = await User.findOne({ username });
    const foundEmail = await User.findOne({ email });

    if (foundUser) {
      res.status(400).json({
        errorMessage: "This username is already in use.",
        field: "username",
      });
      return;
    }

    if (foundEmail) {
      res.status(400).json({
        errorMessage: "This email is already in use.",
        field: "email",
      });
      return;
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(12);
    const hashPassword = await bcrypt.hash(password, salt);

    const createdUser = await User.create({
      username,
      email,
      password: hashPassword,
    });

    const payload = {
      _id: createdUser._id,
      username: createdUser.username,
      email: createdUser.email,
      role: createdUser.role,
    };

    const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
      expiresIn: "12h",
    });

    res.status(201).json({ authToken });
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(500).json({
      errorMessage: "An error occurred while processing the request.",
    });
  }
});

// ** POST /login **

router.post("/login", async (req, res, next) => {
  const { username, password } = req.body;

  // ** Check for empty fields **

  // Check if both username and password are provided
  if (!username || !password) {
    res.status(400).json({ errorMessage: "All fields must be filled" });
    return;
  }

  try {
    // ** Handle login attempts and lockout **

    // Check if the user has exceeded the maximum login attempts
    if (loginAttempts[username]?.attempts >= MAX_LOGIN_ATTEMPTS) {
      // Calculate time since the last attempt
      const timeSinceLastAttempt =
        Date.now() - loginAttempts[username].lastAttempt;

      // Check if the lockout duration has passed
      if (timeSinceLastAttempt < LOCKOUT_DURATION) {
        // Calculate remaining lockout time
        const timeLeft = LOCKOUT_DURATION - timeSinceLastAttempt;

        // Respond with a 429 Too Many Requests error indicating lockout and remaining time
        return res.status(429).json({
          errorMessage: `Too many login attempts. Please try again after ${Math.floor(
            timeLeft / 60000
          )} minutes and ${((timeLeft % 60000) / 1000).toFixed(0)} seconds.`,
        });
      } else {
        delete loginAttempts[username];
      }
    }

    // ** Find user in the database **

    // Attempt to find the user by username
    const foundUser = await User.findOne({ username });

    // Check if the user was found
    if (!foundUser) {
      // Increment login attempts for the username
      incrementLoginAttempts(username);

      // Calculate remaining login attempts
      const remainingAttempts =
        MAX_LOGIN_ATTEMPTS - (loginAttempts[username]?.attempts || 0);

      const errorMessage =
        remainingAttempts > 0
          ? `Incorrect username. You have ${remainingAttempts} attempt${
              remainingAttempts === 1 ? "" : "s"
            } left.`
          : `Too many login attempts. Please try again after ${Math.floor(
              LOCKOUT_DURATION / 60000
            )} minutes.`;

      return res.status(400).json({ errorMessage });
    }

    // ** Validate password **

    const isPasswordValid = await bcrypt.compare(password, foundUser.password);

    // Check if the password is valid
    if (!isPasswordValid) {
      // Increment login attempts for the username
      incrementLoginAttempts(username);

      // Calculate remaining login attempts
      const remainingAttempts =
        MAX_LOGIN_ATTEMPTS - loginAttempts[username].attempts;

      const attemptsLeftMessage = `You have ${remainingAttempts} attempt${
        remainingAttempts === 1 ? "" : "s"
      } left.`;

      const errorMessage =
        remainingAttempts > 0
          ? `Incorrect password. ${attemptsLeftMessage}`
          : `Too many login attempts. Please try again after ${Math.floor(
              LOCKOUT_DURATION / 60000
            )} minutes.`;

      return res.status(400).json({ errorMessage });
    }

    // ** Login successful **

    const payload = {
      _id: foundUser._id,
      username: foundUser.username,
      email: foundUser.email,
      role: foundUser.role,
    };

    const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
      expiresIn: "12h",
    });

    // Delete login attempts for the successful user
    delete loginAttempts[username];

    res.json({ authToken });
  } catch (error) {
    console.error("Error during login or registration:", error);
    res.status(500).json({
      errorMessage: "An error occurred while processing the request.",
    });
  }
});

function incrementLoginAttempts(username) {
  // Check if the username exists in the loginAttempts object
  if (!loginAttempts[username]) {
    // If not, create a new entry for the username with:
    // - attempts: 1 (initial attempt)
    // - lastAttempt: timestamp of the current attempt (Date.now())
    loginAttempts[username] = {
      attempts: 1,
      lastAttempt: Date.now(),
    };
  } else {
    // If the username already exists, increment the attempt count and update the last attempt timestamp
    loginAttempts[username].attempts++;
    loginAttempts[username].lastAttempt = Date.now();
  }
}

// GET "/api/auth/verify" to inform the front-end whether the user is active and what their status is
router.get("/verify", isTokenValid, (req, res, next) => {
  res.json({ payload: req.payload });
});

module.exports = router;
