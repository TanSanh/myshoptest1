const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Order = require("../models/Order");

// Lấy thống kê tổng quan cho dashboard
const getDashboardStats = async (req, res) => {
  try {
    // Đếm tổng số khách hàng (role: user)
    const totalCustomers = await User.countDocuments({ role: "user" });

    // Đếm tổng số sản phẩm
    const totalProducts = await Product.countDocuments();

    // Đếm tổng số đơn hàng
    const totalOrders = await Order.countDocuments();

    // Tính tổng doanh thu từ tất cả đơn hàng, không chỉ từ đơn hàng đã hoàn thành
    const allOrders = await Order.find();

    const totalRevenue = allOrders.reduce(
      (sum, order) => sum + (order.totalPrice || 0),
      0
    );

    // Tạo dữ liệu doanh thu theo ngày trong tháng hiện tại
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Khởi tạo mảng doanh thu theo ngày (31 ngày)
    const salesData = Array(31).fill(0);

    // Lấy các đơn hàng trong tháng hiện tại (tất cả trạng thái)
    const ordersThisMonth = await Order.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // Tính doanh thu theo ngày
    ordersThisMonth.forEach((order) => {
      const day = new Date(order.createdAt).getDate() - 1; // mảng bắt đầu từ 0
      salesData[day] += order.totalPrice || 0;
    });

    // Trả về dữ liệu đúng định dạng mà frontend mong đợi
    return res.status(200).json({
      success: true,

      data: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        salesData,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy thống kê:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê: " + error.message,
    });
  }
};

// Lấy danh sách tất cả người dùng
const getAllUsers = async (req, res) => {
  try {
    // Lấy tất cả người dùng và loại bỏ thông tin password
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách người dùng: " + error.message,
    });
  }
};

// Lấy thông tin một người dùng theo ID
const getUserById = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Tìm người dùng theo ID và loại bỏ mật khẩu
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin người dùng: " + error.message,
    });
  }
};

// Cập nhật thông tin người dùng
const updateUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { fullname, email, phone, address, role } = req.body;

    // Kiểm tra người dùng tồn tại
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Kiểm tra email trùng lặp
    if (email && email !== userExists.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email đã được sử dụng bởi tài khoản khác",
        });
      }
    }

    // Tạo object với các trường cần cập nhật
    const updateFields = {};
    if (fullname) updateFields.fullname = fullname;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (address) updateFields.address = address;
    if (role) updateFields.role = role;

    // Cập nhật thông tin người dùng
    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin người dùng thành công",
      data: updatedUser,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Lỗi khi cập nhật thông tin người dùng: " + error.message,
    });
  }
};

// Xóa người dùng
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    // Kiểm tra người dùng tồn tại
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    // Ngăn xóa tài khoản admin
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Không thể xóa tài khoản admin",
      });
    }

    // Xóa người dùng
    await User.findByIdAndDelete(req.params.userId);

    res.status(200).json({
      success: true,
      message: "Người dùng đã được xóa thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa người dùng: " + error.message,
    });
  }
};

// Lấy danh sách tất cả sản phẩm
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách sản phẩm: " + error.message,
    });
  }
};

// Tạo sản phẩm mới
const createProduct = async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);

    res.status(201).json({
      success: true,
      data: newProduct,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Lỗi khi tạo sản phẩm: " + error.message,
    });
  }
};

// Cập nhật sản phẩm
const updateProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Kiểm tra sản phẩm tồn tại
    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    // Cập nhật sản phẩm
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Lỗi khi cập nhật sản phẩm: " + error.message,
    });
  }
};

// Xóa sản phẩm
const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    // Xóa sản phẩm
    await Product.findByIdAndDelete(productId);

    res.status(200).json({
      success: true,
      message: "Sản phẩm đã được xóa thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa sản phẩm: " + error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
