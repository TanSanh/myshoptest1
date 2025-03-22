<template>
  <div class="email-verification-container">
    <div v-if="verifying" class="verification-content">
      <div class="spinner"></div>
      <h2>Đang xác nhận email...</h2>
      <p>Vui lòng đợi trong giây lát.</p>
    </div>
    
    <div v-else-if="success" class="verification-content success">
      <i class="fas fa-check-circle"></i>
      <h2>Xác nhận email thành công!</h2>
      <p>Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập để sử dụng dịch vụ.</p>
      <div class="actions">
        <router-link to="/login" class="btn-login">Đăng nhập ngay</router-link>
        <router-link to="/" class="btn-home">Về trang chủ</router-link>
      </div>
    </div>
    
    <div v-else class="verification-content error">
      <i class="fas fa-times-circle"></i>
      <h2>Xác nhận email thất bại</h2>
      <p>{{ errorMessage || 'Đường dẫn xác nhận không hợp lệ hoặc đã hết hạn.' }}</p>
      <div class="actions">
        <button @click="resendVerification" class="btn-resend" :disabled="isSending">
          {{ isSending ? 'Đang gửi...' : 'Gửi lại email xác nhận' }}
        </button>
        <router-link to="/" class="btn-home">Về trang chủ</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'EmailVerification',
  data() {
    return {
      verifying: true,
      success: false,
      errorMessage: '',
      isSending: false,
      email: '',
    };
  },
  created() {
    this.verifyToken();
  },
  methods: {
    async verifyToken() {
      try {
        const token = this.$route.params.token;
        if (!token) {
          this.verifying = false;
          this.errorMessage = 'Không tìm thấy mã xác nhận.';
          return;
        }

        // Gọi API xác nhận token
        await axios.get(`http://localhost:5001/api/users/verify/${token}`);
        
        this.success = true;
        this.verifying = false;
      } catch (error) {
        this.verifying = false;
        this.success = false;
        
        if (error.response && error.response.data && error.response.data.message) {
          this.errorMessage = error.response.data.message;
        } else {
          this.errorMessage = 'Có lỗi xảy ra khi xác nhận email. Vui lòng thử lại sau.';
        }
      }
    },
    async resendVerification() {
      this.isSending = true;
      
      try {
        // Mở popup để lấy email
        this.email = prompt('Vui lòng nhập email của bạn để gửi lại mã xác nhận:');
        
        if (!this.email) {
          this.isSending = false;
          return;
        }
        
        // Gọi API gửi lại email xác nhận
        await axios.post('http://localhost:5001/api/users/resend-verification', {
          email: this.email
        });
        
        alert('Email xác nhận đã được gửi lại. Vui lòng kiểm tra hộp thư đến của bạn.');
      } catch (error) {
        let errorMsg = 'Có lỗi xảy ra khi gửi lại email xác nhận.';
        
        if (error.response && error.response.data && error.response.data.message) {
          errorMsg = error.response.data.message;
        }
        
        alert(errorMsg);
      } finally {
        this.isSending = false;
      }
    }
  }
};
</script>

<style scoped>
.email-verification-container {
  max-width: 600px;
  margin: 100px auto;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.verification-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.verification-content h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 10px;
}

.verification-content p {
  color: #666;
  font-size: 16px;
  margin-bottom: 20px;
}

.success i {
  font-size: 60px;
  color: #4CAF50;
}

.error i {
  font-size: 60px;
  color: #F44336;
}

.actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.btn-login, .btn-home, .btn-resend {
  padding: 12px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.3s, transform 0.2s;
}

.btn-login {
  background-color: #fcb034;
  color: white;
}

.btn-home {
  background-color: #f0f0f0;
  color: #333;
}

.btn-resend {
  background-color: #2196F3;
  color: white;
  border: none;
}

.btn-login:hover, .btn-resend:hover {
  transform: translateY(-2px);
}

.btn-home:hover {
  background-color: #e6e6e6;
}

.btn-resend:disabled {
  background-color: #b0b0b0;
  cursor: not-allowed;
}

/* Spinner */
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #fcb034;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 