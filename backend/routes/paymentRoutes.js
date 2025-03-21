const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");

// Giả lập lịch sử thanh toán
let paymentHistory = {};

// Lấy lịch sử thanh toán
router.get("/history", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const history = paymentHistory[userId] || [];
  res.json(history);
});

// Giả lập xử lý thanh toán
router.post("/process", authenticateToken, async (req, res) => {
  try {
    const { cartItems, shippingInfo, paymentMethod } = req.body;

    // Validate dữ liệu
    if (!cartItems || !cartItems.length) {
      return res.status(400).json({
        success: false,
        message: "Giỏ hàng trống",
      });
    }

    if (!shippingInfo || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin giao hàng hoặc phương thức thanh toán",
      });
    }

    // Giả lập xử lý thanh toán thành công
    const order = {
      orderId: Math.random().toString(36).substr(2, 9),
      userId: req.user.id,
      items: cartItems,
      shippingInfo,
      paymentMethod,
      status: "pending",
      total: cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
      createdAt: new Date(),
    };

    res.json({
      success: true,
      message: "Đặt hàng thành công",
      data: order,
    });
  } catch (error) {
    console.error("Lỗi xử lý thanh toán:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xử lý thanh toán",
    });
  }
});

// Kiểm tra trạng thái thanh toán
router.get("/status/:orderId", authenticateToken, (req, res) => {
  try {
    const { orderId } = req.params;

    // Giả lập kiểm tra trạng thái
    const status = Math.random() > 0.5 ? "completed" : "pending";

    res.json({
      success: true,
      data: {
        orderId,
        status,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Lỗi kiểm tra trạng thái thanh toán:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi kiểm tra trạng thái thanh toán",
    });
  }
});

// Hủy thanh toán
router.post("/cancel/:orderId", authenticateToken, (req, res) => {
  try {
    const { orderId } = req.params;

    res.json({
      success: true,
      message: "Hủy thanh toán thành công",
      data: {
        orderId,
        status: "cancelled",
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Lỗi hủy thanh toán:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi hủy thanh toán",
    });
  }
});

module.exports = router;
