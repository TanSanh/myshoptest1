require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const emailRoutes = require("./routes/emailRoutes");
const errorHandler = require("./middleware/errorHandler");
const userRoutes = require("./routes/userRoutes");
const cartRoutes = require("./routes/cartRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

// Cấu hình Mongoose
mongoose.set("strictQuery", true);

// Kết nối MongoDB
connectDB();

// Middleware
// app.use(cors({
//   origin: '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));
// app.use(express.json());

// // Middleware để log requests - chỉ log khi khởi động và lỗi
// app.use((req, res, next) => {
//   // Bỏ log cho các request thường xuyên như GET /api/users/me, GET /api/products, GET /users/cart
//   if (
//     (req.method === 'GET' && req.originalUrl === '/api/users/me') ||
//     (req.method === 'GET' && req.originalUrl === '/api/products') ||
//     (req.method === 'GET' && req.originalUrl === '/users/cart') ||
//     (req.method === 'GET' && req.originalUrl === '/users/payment-history')
//   ) {
//     // Bỏ qua logging cho các request phổ biến
//   } else {
//     console.log(`${req.method} ${req.originalUrl}`);
//   }
//   next();
// });

app.use(cors());
app.use(express.json());

// Các tuyến đường
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);

// Thêm route /users cho frontend
app.use("/users", userRoutes);

// Xử lý lỗi cho các tuyến đường không tồn tại
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Tuyến đường không tồn tại!"
  });
});

// Error handler middleware
app.use((err, req, res, next) => {
  // Chỉ log lỗi trong môi trường development
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Lỗi máy chủ nội bộ",
  });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
