<template>
  <div class="register-container">
    <h2 class="register-title">Đăng Kí Tài Khoản</h2>

    <form @submit.prevent="handleSubmit" class="register-form">
      <!-- Họ và tên -->
      <div class="form-group">
        <label for="fullname">Họ Và Tên</label>
        <input
          type="text"
          id="fullname"
          v-model="formData.fullname"
          placeholder="Nhập họ và tên"
          :disabled="isLoading"
        />
        <small v-if="errors.fullname" class="error-text">
          {{ errors.fullname }}
        </small>
      </div>

      <!-- Email -->
      <div class="form-group">
        <label for="email">Email</label>
        <input
          type="email"
          id="email"
          v-model="formData.email"
          placeholder="VD: admin@gmail.com"
          :disabled="isLoading"
        />
        <small v-if="errors.email" class="error-text">{{ errors.email }}</small>
      </div>

      <!-- Mật khẩu -->
      <div class="form-group">
        <label for="password">Mật Khẩu</label>
        <input
          type="password"
          id="password"
          v-model="formData.password"
          placeholder="Mật Khẩu phải chứa ít nhất 1 chữ hoa (A-Z)"
          :disabled="isLoading"
        />
        <small v-if="errors.password" class="error-text">
          {{ errors.password }}
        </small>
      </div>

      <!-- Xác nhận mật khẩu -->
      <div class="form-group">
        <label for="confirmPassword">Xác Nhận Mật Khẩu</label>
        <input
          type="password"
          id="confirmPassword"
          v-model="formData.confirmPassword"
          placeholder="Nhập lại mật khẩu"
          :disabled="isLoading"
        />
        <small v-if="errors.confirmPassword" class="error-text">
          {{ errors.confirmPassword }}
        </small>
      </div>

      <!-- Số điện thoại -->
      <div class="form-group">
        <label for="phone">Số Điện Thoại</label>
        <input
          type="tel"
          id="phone"
          v-model="formData.phone"
          placeholder="Nhập số điện thoại"
          :disabled="isLoading"
        />
        <small v-if="errors.phone" class="error-text">{{ errors.phone }}</small>
      </div>

      <!-- Nút đăng kí -->
      <button type="submit" class="btn-submit" :disabled="isLoading">
        <span v-if="isLoading" class="loading-spinner"></span>
        <span v-if="isLoading">Vui lòng đợi...</span>
        <span v-else>Đăng Kí</span>
      </button>
    </form>

    <p class="login-link">
      Bạn đã có tài khoản?
      <router-link to="/login">Đăng nhập</router-link>
    </p>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "ComRegister",
  data() {
    return {
      // Dữ liệu form
      formData: {
        fullname: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
      },
      // Lưu lỗi validation
      errors: {},
      // Trạng thái đang xử lý
      isLoading: false,
    };
  },
  methods: {
    // Xử lý submit form
    async handleSubmit() {
      // Reset errors
      this.errors = {};

      // Validate form
      let isValid = true;

      // Kiểm tra họ và tên
      if (!this.formData.fullname.trim()) {
        this.errors.fullname = "Vui lòng nhập họ và tên";
        isValid = false;
      }

      // Kiểm tra email
      if (!this.formData.email.trim()) {
        this.errors.email = "Vui lòng nhập email";
        isValid = false;
      } else if (!this.validateEmail(this.formData.email)) {
        this.errors.email = "Email không hợp lệ";
        isValid = false;
      }

      // Kiểm tra mật khẩu
      if (!this.formData.password) {
        this.errors.password = "Vui lòng nhập mật khẩu";
        isValid = false;
      } else if (this.formData.password.length < 6) {
        this.errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
        isValid = false;
      } else if (!/[A-Z]/.test(this.formData.password)) {
        this.errors.password = "Mật khẩu phải chứa ít nhất 1 chữ hoa";
        isValid = false;
      }

      // Kiểm tra xác nhận mật khẩu
      if (this.formData.password !== this.formData.confirmPassword) {
        this.errors.confirmPassword = "Mật khẩu không khớp";
        isValid = false;
      }

      // Nếu không hợp lệ, dừng lại
      if (!isValid) {
        return;
      }

      // Bắt đầu loading
      this.isLoading = true;

      // Dữ liệu hợp lệ, gửi yêu cầu đăng ký
      try {
        const userData = {
          fullname: this.formData.fullname,
          email: this.formData.email,
          password: this.formData.password,
          phone: this.formData.phone || "",
        };

        await axios.post(
          "http://localhost:5001/api/users/register",
          userData
        );
       
        // Thông báo đăng ký thành công và yêu cầu xác nhận email
        alert("Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản của bạn.");
        
        // Chuyển sang trang đăng nhập sau khi người dùng đóng thông báo
        this.$router.push("/login");
      } catch (error) {
        console.error("Lỗi đăng kí:", error);
        console.error("Chi tiết lỗi:", error.response ? error.response.data : "Không có dữ liệu phản hồi");
      
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          // Hiển thị lỗi từ server
          this.errors.email = error.response.data.message;
        } else {
          alert("Đăng ký thất bại! Có lỗi xảy ra khi đăng ký tài khoản.");
        }
      } finally {
        // Kết thúc loading dù thành công hay thất bại
        this.isLoading = false;
      }
    },
    // Kiểm tra email
    validateEmail(email) {
      // Regex đơn giản
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    },
  },
};
</script>

<style scoped>
.register-container {
  max-width: 1000px;
  width: 30%;
  margin: 50px auto;
  background: #fff;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.register-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.form-group label {
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  outline: none;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #fcb034;
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.error-text {
  color: red;
  font-size: 0.85em;
  margin-top: 5px;
}

/* Nút đăng kí */
.btn-submit {
  padding: 12px;
  background-color: #fcb034;
  color: #fff;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s, box-shadow 0.3s;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.btn-submit:hover {
  background-color: #e89c2f;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.btn-submit:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  box-shadow: none;
}

/* Loading spinner */
.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Link đăng nhập */
.login-link {
  margin-top: 20px;
  color: #555;
}
.login-link a {
  color: #fcb034;
  text-decoration: none;
  font-weight: bold;
}
.login-link a:hover {
  color: #e89c2f;
  text-decoration: underline;
}
</style>
