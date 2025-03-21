const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");


// Middleware xác thực token
const authenticateToken = async (req, res, next) => {
  try {
    // Lấy token từ header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Kiểm tra token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Không có token, yêu cầu đăng nhập!",
      });
    }

    // Xác thực token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "shop_secret_key"
    );

    // Xử lý trường hợp admin hardcoded
    if (decoded.userId === "admin-user" && decoded.role === "admin") {
      req.user = {
        _id: "admin-user",
        role: "admin"
      };
      return next();
    }

    // Lấy thông tin người dùng từ token
    const user = await User.findById(decoded.userId || decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Người dùng không tồn tại!",
      });
    }

    // Lưu thông tin người dùng vào request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ!",
      });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token đã hết hạn!",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Lỗi xác thực: " + error.message,
      });
    }
  }
};

// Middleware kiểm tra quyền admin
const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Bạn không có quyền truy cập tính năng này!",
    });
  }
};

// Middleware kiểm tra quyền admin (tương thích ngược)
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Bạn không có quyền truy cập tính năng này!",
    });
  }
};

// Middleware xác thực (tương thích ngược)
const auth = async (req, res, next) => {
  await authenticateToken(req, res, next);
};

module.exports = { authenticateToken, authorizeAdmin, auth, isAdmin };
