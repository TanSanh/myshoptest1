const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// GET /products
router.get("/", productController.getAllProducts);

// GET /products/:id
router.get("/:id", productController.getProductById);
// POST /products
router.post("/", productController.createProduct);
// PUT /products/:id
router.put("/:id", productController.updateProduct);
// DELETE /products/:id
router.delete("/:id", productController.deleteProduct);
// PUT /products/:id/sold
router.put("/:id/updateSold", productController.updateSold);

module.exports = router;
