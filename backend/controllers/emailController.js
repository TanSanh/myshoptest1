const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "hotansanh0304@gmail.com",
    pass: process.env.EMAIL_PASS || "uyuyiejavnnxvwwx",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Thêm hàm kiểm tra kết nối
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log("Email service is ready");
    return true;
  } catch (error) {
    console.error("Email service error:", error);
    return false;
  }
};

exports.sendVerificationEmail = asyncHandler(
  async (email, verificationToken) => {
    // Kiểm tra kết nối trước khi gửi
    if (!(await verifyConnection())) {
      throw new Error("Email service not available");
    }

    const mailOptions = {
      from: `"Myshop" <${process.env.EMAIL_USER || "hotansanh0304@gmail.com"}>`,
      to: email,
      subject: "Xác nhận đăng ký tài khoản Myshop",
      html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2>Xác nhận tài khoản Myshop của bạn</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại Myshop!</p>
        <p>Để hoàn tất đăng ký, vui lòng nhấn vào nút bên dưới để xác nhận địa chỉ email của bạn:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email/${verificationToken}"
             style="background-color: #4CAF50; color: white; padding: 12px 25px;
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            Xác nhận email của tôi
          </a>
        </div>
        <p>Hoặc, bạn có thể truy cập link sau: <a href="${process.env.BACKEND_URL || 'http://localhost:5001'}/api/users/verify/${verificationToken}">Xác nhận email</a></p>
        <p>Lưu ý: Đường dẫn này sẽ hết hạn sau 24 giờ.</p>
        <p>Nếu bạn không thực hiện yêu cầu đăng ký này, vui lòng bỏ qua email.</p>
        <hr>
        <p style="font-size: 12px; color: #666;">Đây là email tự động, vui lòng không trả lời email này.</p>
      </div>
    `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Verification email sent to:", email);
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send verification email");
    }
  }
);
