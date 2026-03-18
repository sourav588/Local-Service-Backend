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
  process.env.MONGODB_URI ||
  "mongodb+srv://sourav801600_db_user:g0Szose7aCEilTYm@cluster0.ame8bcn.mongodb.net/localServiceDB";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log("MongoDB Error ❌:", err));

/* ---------- Health Check ---------- */
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

/* ---------- ORDER API ---------- */

// create order
app.post("/api/order", async (req, res) => {
  try {
    const { name, phone, address, service, price } = req.body;

    if (!name || !phone || !service) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const order = new Order({
      name,
      phone,
      address,
      service,
      price,
    });

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

// get all orders
app.get("/api/orders", async (req, res) => {
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

/* ---------- USER API ---------- */

// register
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

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

// login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

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

/* ---------- Start Server ---------- */
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});