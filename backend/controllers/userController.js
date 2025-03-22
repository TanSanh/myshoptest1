const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const crypto = require("crypto");
const { sendVerificationEmail } = require("./emailController");

// đăng ký người dùng
exports.registerUser = asyncHandler(async (req, res) => {
  try {
    const { fullname, email, password, phone } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Email không hợp lệ"
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "Email đã được sử dụng"
      });
    }

    // Tạo token xác nhận
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // hết hạn sau 24 giờ

    const user = await User.create({
      fullname,
      email,
      password,
      phone,
      isVerified: false,
      verificationToken,
      verificationTokenExpires
    });

    // Gửi email xác nhận
    try {
      await sendVerificationEmail(email, verificationToken);
      res.status(201).json({
        success: true,
        message: "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.",
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Vẫn tạo tài khoản, nhưng báo lỗi không gửi được email
      res.status(201).json({
        success: true,
        message: "Đăng ký thành công, nhưng không thể gửi email xác nhận. Vui lòng liên hệ hỗ trợ."
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo tài khoản: " + error.message
    });
  }
});

// Xác nhận email
exports.verifyEmail = asyncHandler(async (req, res) => {
  try {
    const { token } = req.params;
    
    // Tìm user với token xác nhận
    const user = await User.findOne({ 
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn"
      });
    }

    // Cập nhật trạng thái xác nhận
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    // Nếu API được gọi trực tiếp, trả về JSON
    if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
      return res.status(200).json({
        success: true,
        message: "Xác nhận email thành công! Bạn có thể đăng nhập ngay bây giờ."
      });
    }

    // Chuyển hướng đến trang thành công nếu được gọi từ trình duyệt
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/verification-success`);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xác nhận email: " + error.message
    });
  }
});

// Đăng nhập người dùng
exports.loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ email và mật khẩu!"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng!"
      });
    }

    // Kiểm tra xác nhận email
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản chưa được xác nhận. Vui lòng kiểm tra email và xác nhận tài khoản."
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng!"
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: "1h" }
    );

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công!",
      token,
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi đăng nhập: " + error.message
    });
  }
});

// Gửi lại email xác nhận
exports.resendVerificationEmail = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp địa chỉ email"
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản với email này"
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Tài khoản này đã được xác nhận"
      });
    }

    // Tạo token xác nhận mới
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    // Gửi email xác nhận
    await sendVerificationEmail(email, verificationToken);

    res.status(200).json({
      success: true,
      message: "Email xác nhận đã được gửi lại. Vui lòng kiểm tra hộp thư đến."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi gửi lại email xác nhận: " + error.message
    });
  }
});

// Lấy thông tin người dùng hiện tại
exports.getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.status(200).json(user);
});
