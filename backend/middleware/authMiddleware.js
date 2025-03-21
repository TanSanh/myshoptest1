const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");


// Middleware xác thực token
const authenticateToken = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    res.status(401);
    throw new Error("Không có token hoặc token không hợp lệ!");
  }

  token = authHeader.split(" ")[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Người dùng không có quyền truy cập!");
  }
});

//Middleware xác thực người dùng
// Kiểm tra và giải mã JWT token từ Authorization header
const auth = async (req, res, next) => {
  try {
    // Lấy token từ header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy token xác thực",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      );

      // Xử lý trường hợp đặc biệt - admin hardcoded
      if (decoded.userId === "admin-user" && decoded.role === "admin") {
        // Đặt thông tin admin vào request
        req.token = token;
        req.user = {
          id: "admin-user",
          username: "admin",
          email: "admin@example.com",
          role: "admin",
        };
        return next();
      }

      // Tìm user trong database
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Người dùng không tồn tại",
        });
      }

      // Thêm thông tin user vào request
      req.token = token;
      req.user = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi xác thực",
    });
  }
};

module.exports = {
  auth,
  authenticateToken
};
