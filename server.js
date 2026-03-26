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

/* ---------- MongoDB Connection (FIXED DB NAME) ---------- */
const MONGO_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://sourav801600_db_user:Cc5CRknoqFueF05D@myservise.91oxfrm.mongodb.net/localServiceDB";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    console.log("🌍 DATABASE NAME:", mongoose.connection.name);
  })
  .catch((err) => {
    console.log("❌ MongoDB Error:", err);
    process.exit(1);
  });

/* ---------- ROOT ---------- */
app.get("/", (req, res) => {
  res.json({ message: "API Running" });
});

/* ---------- REGISTER ---------- */
app.post("/register", async (req, res) => {
  try {
    let { name, email, phone, password, address } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    email = email.trim().toLowerCase();

    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(400).json({ success: false, message: "Email already exists" });
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
      userId: user._id,
    });
  } catch (err) {
    console.log("❌ Register Error:", err);
    res.status(500).json({ success: false });
  }
});

/* ---------- LOGIN ---------- */
app.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid password" });
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
        phone: user.phone,
      },
    });
  } catch (err) {
    console.log("❌ Login Error:", err);
    res.status(500).json({ success: false });
  }
});

/* ---------- PLACE ORDER (STRICT SAVE CHECK) ---------- */
app.post("/order-service", async (req, res) => {
  try {
    let { userId, name, phone, address, service, price } = req.body;

    console.log("📥 ORDER BODY:", req.body);

    if (!userId || !name || !address || !service) {
      return res.status(400).json({
        success: false,
        message: "Missing fields",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("❌ INVALID USER ID:", userId);
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    const order = new Order({
      userId: new mongoose.Types.ObjectId(userId),
      name,
      phone,
      address,
      service,
      price: price || 0,
    });

    console.log("🟡 BEFORE SAVE");

    const savedOrder = await order.save();

    if (!savedOrder || !savedOrder._id) {
      console.log("❌ SAVE FAILED");
      return res.status(500).json({
        success: false,
        message: "Order not saved",
      });
    }

    console.log("🟢 SAVED ORDER:", savedOrder);
    console.log("🟢 SAVED IN DB:", mongoose.connection.name);

    res.json({
      success: true,
      message: "Order placed successfully",
      order: savedOrder,
    });
  } catch (error) {
    console.log("❌ ORDER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ---------- GET USER ORDERS ---------- */
app.get("/get-orders/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    console.log("📤 FETCH USER ID:", userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    const orders = await Order.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).sort({ createdAt: -1 });

    console.log("📦 FOUND ORDERS:", orders.length);
    console.log("📦 FROM DB:", mongoose.connection.name);

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.log("❌ GET ORDERS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ---------- DEBUG ROUTE (VERY IMPORTANT) ---------- */
app.get("/debug-db", async (req, res) => {
  try {
    const dbName = mongoose.connection.name;
    const orders = await Order.find();

    console.log("🌍 CURRENT DB:", dbName);
    console.log("📦 TOTAL ORDERS:", orders.length);

    res.json({
      db: dbName,
      totalOrders: orders.length,
      orders,
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

/* ---------- START SERVER ---------- */
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
