const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const cartController = require("../controllers/cartController");
const paymentHistoryController = require("../controllers/paymentHistoryController");
const { authenticateToken } = require("../middleware/authMiddleware");

// ===== AUTH ROUTES =====

// Route đăng ký
router.post("/register", userController.registerUser);

// Route đăng nhập
router.post("/login", userController.loginUser);

// Route lấy thông tin người dùng hiện tại
router.get("/me", authenticateToken, userController.getCurrentUser);

// ===== USER RELATED ROUTES =====

// Cart routes
router.get("/cart", authenticateToken, cartController.getCart);
router.post("/cart/add", authenticateToken, cartController.addToCart);
router.put("/cart", authenticateToken, cartController.updateCart);
router.delete("/cart/:variantId", authenticateToken, cartController.removeFromCart);
router.delete("/cart", authenticateToken, cartController.clearCart);

// Payment history routes
router.get("/payment-history", authenticateToken, paymentHistoryController.getPaymentHistory);
router.post("/orders", authenticateToken, paymentHistoryController.addOrder);

module.exports = router;
