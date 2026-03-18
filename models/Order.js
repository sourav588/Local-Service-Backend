const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({

  name: String,
  phone: String,
  address: String,
  service: String,
  price: Number,

  paymentStatus: {
    type: String,
    default: "pending"
  },

  orderStatus: {
    type: String,
    default: "waiting"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Order", OrderSchema);