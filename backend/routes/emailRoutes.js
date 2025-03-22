const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();
const path = require("path");
const fs = require("fs");

// Cấu hình SMTP theo mẫu tham khảo thành công
const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  auth: {
    user: "hotansanh0304@gmail.com",
    pass: "uyuyiejavnnxvwwx",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Kiểm tra kết nối
transporter.verify(function (error, success) {
  if (error) {
    console.log("Lỗi kết nối đến server email:", error);
  }
});

// API endpoint để gửi email
router.post("/send", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Kiểm tra dữ liệu
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin",
      });
    }

    // Cấu hình email
    const mailOptions = {
      from: "hotansanh0304@gmail.com",
      to: "hotansanh0304@gmail.com",
      subject: `Tin nhắn mới từ ${name}`,
      text: `Bạn có tin nhắn mới từ: ${name} (${email})
      
Nội dung: ${message}`,
      html: `
        <h3>Bạn có tin nhắn mới từ website bán đồ nội thất</h3>
        <p><strong>Tên:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Nội dung:</strong></p>
        <p>${message}</p>
      `,
    };

    // Gửi email
    await transporter.sendMail(mailOptions);

    // Phản hồi thành công
    res.status(200).json({
      success: true,
      message: "Email đã được gửi thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi gửi email",
      error: error.message,
    });
  }
});

// API endpoint để xử lý đăng ký nhận tin
router.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body;

    // Kiểm tra dữ liệu
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập địa chỉ email",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Địa chỉ email không hợp lệ",
      });
    }

    // Cấu hình email
    const mailOptions = {
      from: "hotansanh0304@gmail.com",
      to: "hotansanh0304@gmail.com",
      subject: "Có người đăng ký nhận tin mới",
      text: `Một người dùng đã đăng ký nhận tin từ website:
      
Email: ${email}
Nội dung: Tôi cần hỗ trợ`,
      html: `
        <h3>Có người đăng ký nhận tin mới từ website bán đồ nội thất</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Nội dung:</strong></p>
        <p>Tôi cần hỗ trợ</p>
      `,
    };

    // Gửi email
    await transporter.sendMail(mailOptions);

    // Phản hồi thành công
    res.status(200).json({
      success: true,
      message: "Đăng ký nhận tin thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi đăng ký nhận tin",
      error: error.message,
    });
  }
});

module.exports = router;
