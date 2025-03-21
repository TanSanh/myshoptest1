const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const permissionSchema = new mongoose.Schema({
  module: {
    type: String,
    required: true,
    enum: ["users", "products", "orders", "categories", "statistics"]
  },
  actions: {
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false }
  }
});

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Tên đăng nhập là bắt buộc"],
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, "Mật khẩu là bắt buộc"],
      minlength: [6, "Mật khẩu phải có ít nhất 6 ký tự"]
    },
    fullName: {
      type: String,
      required: [true, "Họ tên là bắt buộc"]
    },
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      unique: true,
      match: [/.+\@.+\..+/, "Email không hợp lệ"]
    },
    phone: {
      type: String,
      validate: {
        validator: function(v) {
          return /^[0-9]{10,11}$/.test(v);
        },
        message: "Số điện thoại không hợp lệ"
      }
    },
    role: {
      type: String,
      enum: ["super_admin", "admin", "manager", "staff"],
      default: "staff"
    },
    permissions: [permissionSchema],
    lastLogin: {
      type: Date
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active"
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    avatar: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Hash mật khẩu trước khi lưu
adminSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Kiểm tra mật khẩu
adminSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Phương thức để cấp quyền
adminSchema.methods.grantPermission = function(module, actions) {
  // Tìm kiếm quyền hiện có
  const existingPermission = this.permissions.find(p => p.module === module);
  
  if (existingPermission) {
    // Cập nhật quyền hiện có
    for (const action in actions) {
      if (actions.hasOwnProperty(action)) {
        existingPermission.actions[action] = actions[action];
      }
    }
  } else {
    // Thêm quyền mới
    this.permissions.push({
      module,
      actions
    });
  }
};

// Phương thức kiểm tra quyền
adminSchema.methods.hasPermission = function(module, action) {
  const permission = this.permissions.find(p => p.module === module);
  
  // Super Admin có tất cả quyền
  if (this.role === "super_admin") {
    return true;
  }
  
  return permission && permission.actions[action];
};

// Phương thức nâng cao vai trò
adminSchema.methods.setRole = function(role) {
  if (["super_admin", "admin", "manager", "staff"].includes(role)) {
    this.role = role;
    
    // Thiết lập quyền mặc định dựa trên vai trò
    switch (role) {
      case "super_admin":
        // Super admin có tất cả quyền
        ["users", "products", "orders", "categories", "statistics"].forEach(module => {
          this.grantPermission(module, { view: true, create: true, update: true, delete: true });
        });
        break;
      case "admin":
        // Admin có hầu hết quyền ngoại trừ xóa người dùng
        ["products", "orders", "categories", "statistics"].forEach(module => {
          this.grantPermission(module, { view: true, create: true, update: true, delete: true });
        });
        this.grantPermission("users", { view: true, create: true, update: true, delete: false });
        break;
      case "manager":
        // Manager có quyền xem tất cả và quản lý sản phẩm, đơn hàng
        ["users", "statistics", "categories"].forEach(module => {
          this.grantPermission(module, { view: true, create: false, update: false, delete: false });
        });
        ["products", "orders"].forEach(module => {
          this.grantPermission(module, { view: true, create: true, update: true, delete: false });
        });
        break;
      case "staff":
        // Staff chỉ có quyền xem và cập nhật đơn hàng
        this.grantPermission("orders", { view: true, create: false, update: true, delete: false });
        this.grantPermission("products", { view: true, create: false, update: false, delete: false });
        this.grantPermission("statistics", { view: true, create: false, update: false, delete: false });
        break;
    }
  }
};

module.exports = mongoose.models.Admin || mongoose.model("Admin", adminSchema); 