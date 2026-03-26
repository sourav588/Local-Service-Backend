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
  res.json({ message: "API Running 🚀" });
});

/* ---------- REGISTER ---------- */
app.post("/register", async (req, res) => {
  try {
    let { name, email, phone, password, address } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    email = email.trim().toLowerCase();

    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name: name.trim(),
      email,
      phone: phone.trim(),
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
      return res.status(401).json({
        success: false,
        message: "Invalid email",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
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
        phone: user.phone,
      },
    });
  } catch (err) {
    console.log("❌ Login Error:", err);
    res.status(500).json({ success: false });
  }
});

/* ---------- PLACE ORDER (FIXED) ---------- */
app.post("/order-service", async (req, res) => {
  try {
    console.log("🔥 FULL BODY:", req.body);

    let { userId, name, phone, address, service, price } = req.body;

    /* ---------- VALIDATION ---------- */
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is REQUIRED ❌",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId ❌",
      });
    }

    /* 🔥 CONVERT STRING → ObjectId */
    const objectUserId = new mongoose.Types.ObjectId(userId);

    console.log("✅ CONVERTED USER ID:", objectUserId);

    const order = new Order({
      userId: objectUserId,
      name: name?.trim() || "Unknown",
      phone: phone?.trim() || "0000000000",
      address: address?.trim(),
      service: service?.trim(),
      price: Number(price) || 0,
    });

    await order.save();

    console.log("✅ SAVED ORDER:", order);

    res.json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.log("❌ ORDER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Order failed",
    });
  }
});

/* ---------- GET USER ORDERS (FIXED) ---------- */
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

    const objectUserId = new mongoose.Types.ObjectId(userId);

    const orders = await Order.find({
      userId: objectUserId,
    }).sort({ createdAt: -1 });

    console.log("📦 FOUND ORDERS:", orders.length);

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

/* ---------- DEBUG ROUTE ---------- */
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
