const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, password, phone } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error("Email không hợp lệ");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("Email đã được sử dụng");
  }

  try {
    const user = await User.create({
      fullname,
      email,
      password,
      phone,
    });

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công!",
    });
  } catch (error) {
    res.status(500);
    throw new Error("Lỗi khi tạo tài khoản: " + error.message);
  }
});

// Đăng nhập người dùng
exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Vui lòng nhập đầy đủ email và mật khẩu!");
  }

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401);
    throw new Error("Email hoặc mật khẩu không đúng!");
  }

  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.status(200).json({
    message: "Đăng nhập thành công!",
    token,
    user: {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phone: user.phone,
    },
  });
});

// Lấy thông tin người dùng hiện tại
exports.getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error("ID người dùng không hợp lệ!");
  }

  const user = await User.findById(userId).select("-password");
  if (!user) {
    res.status(404);
    throw new Error("Không tìm thấy người dùng!");
  }
  res.status(200).json({
    message: "Lấy thông tin người dùng hiện tại thành công!",
    user,
  });
});
