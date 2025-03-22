<template>
  <div class="verification-success-container">
    <div class="success-content">
      <i class="fas fa-check-circle"></i>
      <h2>Xác nhận email thành công!</h2>
      <p>Tài khoản của bạn đã được kích hoạt thành công. Cảm ơn bạn đã đăng ký!</p>
      <div class="actions">
        <router-link to="/login" class="btn-login">Đăng nhập ngay</router-link>
        <router-link to="/" class="btn-home">Về trang chủ</router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "VerificationSuccess"
};
</script>

<style scoped>
.verification-success-container {
  max-width: 600px;
  margin: 100px auto;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.success-content i {
  font-size: 70px;
  color: #4CAF50;
}

.success-content h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
}

.success-content p {
  color: #666;
  font-size: 16px;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.btn-login, .btn-home {
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

.btn-login:hover {
  transform: translateY(-2px);
}

.btn-home {
  background-color: #f0f0f0;
  color: #333;
}

.btn-home:hover {
  background-color: #e6e6e6;
}
</style> 