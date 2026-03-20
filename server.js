const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Order = require("./models/Order");
const User = require("./models/User");

const app = express();

/* ---------- Middleware ---------- */

app.use(cors());
app.use(express.json());

/* ---------- MongoDB Connection ---------- */

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb+srv://sourav801600_db_user:Cc5CRknoqFueF05D@myservise.91oxfrm.mongodb.net/?appName=myservise";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

/* ---------- Test Route ---------- */

app.get("/", (req, res) => {
  res.send("API Running");
});

/* ---------- Save Order ---------- */

app.post("/order-service", async (req, res) => {
  try {
    const order = new Order({
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address,
      service: req.body.service,
      price: req.body.price,
    });

    await order.save();

    res.json({
      success: true,
      message: "Order placed successfully",
    });
  } catch (error) {
    console.log("Order Save Error:", error);

    res.status(500).json({
      success: false,
      message: "Order failed",
    });
  }
});

/* ---------- Get All Orders ---------- */

app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.log("Fetch Orders Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
});

/* ---------- User Registration ---------- */

app.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      phone,
      password,
      address: address || "",
    });

    await user.save();

    res.json({
      success: true,
      message: "User registered successfully",
      userId: user._id,
    });
  } catch (error) {
    console.log("Registration Error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});

/* ---------- User Login ---------- */

app.post("/login", async (req, res) => {
  console.log("Login request received:", req.body);

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    console.log("Looking for user:", email);

    // Find user by email and include password field
    const user = await User.findOne({ email }).select("+password");
    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      console.log("User not found");
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password (simple comparison - in production use bcrypt)
    if (user.password !== password) {
      console.log("Password mismatch");
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    console.log("Login successful for user:", user.name);

    res.json({
      success: true,
      message: "Login successful",
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    console.log("Login Error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});


app.get("/api/user", (req, res) => {
  const id = req.params.id;

  // TEMP TEST DATA
  res.json({
    name: "Sourav",
    email: "sourav@gmail.com",
    id: id
  });
});

/* ---------- Start Server ---------- */

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});