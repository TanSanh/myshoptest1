const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

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

module.exports = authenticateToken;
