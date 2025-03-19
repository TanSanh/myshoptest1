const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    image: { type: String },
    images: [String],
    type: { type: String },
    brand: { type: String },
    colors: [String],
    sizes: [String],
    stock: { type: Number, required: true, default: 0 },
    sold: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
