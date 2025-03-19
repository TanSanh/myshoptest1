const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");

exports.getAllProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find();
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
});

exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json(product);
});

exports.createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    image,
    images,
    type,
    brand,
    colors,
    sizes,
    stock,
  } = req.body;

  if (!name || !price || stock === undefined) {
    res.status(400);
    throw new Error("Name, price, and stock are required");
  }

  const newProduct = new Product({
    name,
    description,
    price,
    image,
    images,
    type,
    brand,
    colors,
    sizes,
    stock,
    sold: 0,
  });

  await newProduct.save();
  res.status(201).json({
    message: "Product created successfully",
    product: newProduct,
  });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const {
    name,
    description,
    price,
    image,
    images,
    type,
    brand,
    colors,
    sizes,
    stock,
    sold,
  } = req.body;

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      name,
      description,
      price,
      image,
      images,
      type,
      brand,
      colors,
      sizes,
      stock,
      sold,
    },
    { new: true }
  );

  if (!updatedProduct) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json({
    message: "Product updated successfully",
    product: updatedProduct,
  });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const deletedProduct = await Product.findByIdAndDelete(productId);

  if (!deletedProduct) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.status(200).json({ message: "Product deleted successfully" });
});

exports.updateSold = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const { quantitySold } = req.body;

  if (!quantitySold || quantitySold <= 0) {
    res.status(400);
    throw new Error("Quantity sold must be greater than 0");
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (product.stock < quantitySold) {
    res.status(400);
    throw new Error(
      `Không đủ hàng trong kho. Số lượng còn lại: ${product.stock}`
    );
  }

  product.sold += quantitySold;
  product.stock -= quantitySold;
  await product.save();

  res.status(200).json({
    message: "Product sold quantity updated successfully",
    product,
  });
});
