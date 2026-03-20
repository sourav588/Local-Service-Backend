const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Order = require("./models/Order");
const User = require("./models/User");

const app = express();

/* ---------- Middleware ---------- */
app.use(cors());
app.use(express.json());

/* ---------- MongoDB Connection ---------- */
const MONGO_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://sourav801600_db_user:Cc5CRknoqFueF05D@myservise.91oxfrm.mongodb.net/?appName=myservise";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.log("❌ MongoDB Error:", err);
    process.exit(1);
  });

/* ---------- Test Route ---------- */
app.get("/", (req, res) => {
  res.json({ message: "API Running" }); // ✅ always JSON
});

/* ---------- Save Order ---------- */
app.post("/order-service", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();

    res.json({
      success: true,
      message: "Order placed successfully",
    });
  } catch (error) {
    console.log("Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Order failed",
    });
  }
});

/* ---------- Get Orders ---------- */
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

/* ---------- Register ---------- */
app.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      address: address || "",
    });

    await user.save();

    res.json({
      success: true,
      message: "User registered successfully",
      userId: user._id,
    });
  } catch (err) {
    console.log("Register Error:", err);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});

/* ---------- Login ---------- */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email & password required",
      });
    }

    const user = await User.findOne({ email });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.log("Login Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ---------- Get User by ID ---------- */
app.get("/api/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.log("User Fetch Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ---------- Start Server ---------- */
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});