const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');

// Giả lập dữ liệu giỏ hàng
let carts = {};

// Lấy giỏ hàng của user
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const cart = carts[userId] || { items: [] };
  res.json(cart);
});

// Thêm sản phẩm vào giỏ hàng
router.post('/add', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, variantId, name, color, size, quantity, price, image } = req.body;

    if (!carts[userId]) {
      carts[userId] = { items: [] };
    }

    // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
    const existingItemIndex = carts[userId].items.findIndex(
      (item) => item.variantId === variantId || item.productId === productId
    );

    if (existingItemIndex !== -1) {
      // Cập nhật số lượng nếu sản phẩm đã tồn tại
      carts[userId].items[existingItemIndex].quantity += quantity;
    } else {
      // Thêm sản phẩm mới
      carts[userId].items.push({
        productId,
        variantId: variantId || `${productId}_${color || "N/A"}_${size || "N/A"}`,
        name,
        color,
        size,
        quantity,
        price,
        image
      });
    }

    res.json({
      success: true,
      message: "Thêm vào giỏ hàng thành công",
      data: carts[userId],
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi khi thêm vào giỏ hàng" 
    });
  }
});

// Cập nhật sản phẩm trong giỏ hàng
router.put('/update', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, variantId, name, color, size, quantity, price, image } = req.body;

    if (!carts[userId]) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy giỏ hàng" 
      });
    }

    // Tìm sản phẩm theo variantId hoặc productId
    const index = carts[userId].items.findIndex(
      (item) => (variantId && item.variantId === variantId) || 
                (!variantId && item.productId === productId)
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm trong giỏ hàng",
      });
    }

    if (quantity <= 0) {
      // Xóa sản phẩm khỏi giỏ hàng
      carts[userId].items.splice(index, 1);
    } else {
      // Cập nhật sản phẩm
      carts[userId].items[index] = {
        productId,
        variantId: variantId || carts[userId].items[index].variantId,
        name: name || carts[userId].items[index].name,
        color: color || carts[userId].items[index].color,
        size: size || carts[userId].items[index].size,
        quantity,
        price: price || carts[userId].items[index].price,
        image: image || carts[userId].items[index].image
      };
    }

    res.json({
      success: true,
      message: "Cập nhật giỏ hàng thành công",
      data: carts[userId],
    });
  } catch (error) {
    console.error("Update cart error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi khi cập nhật giỏ hàng" 
    });
  }
});

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/remove/:variantId', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { variantId } = req.params;

    if (!carts[userId]) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy giỏ hàng" 
      });
    }

    // Lọc ra các sản phẩm không có variantId trùng với tham số
    carts[userId].items = carts[userId].items.filter(
      (item) => item.variantId !== variantId
    );

    res.json({
      success: true,
      message: "Xóa sản phẩm thành công",
      data: carts[userId],
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi khi xóa sản phẩm khỏi giỏ hàng" 
    });
  }
});

// Xóa toàn bộ giỏ hàng
router.delete('/clear', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    carts[userId] = { items: [] };

    res.json({
      success: true,
      message: "Đã xóa toàn bộ sản phẩm trong giỏ hàng",
      data: carts[userId],
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi khi xóa giỏ hàng" 
    });
  }
});

module.exports = router; 