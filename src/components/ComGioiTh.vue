<template>
  <div class="page-container">
    <h1>Giới Thiệu</h1>
    <p>
      Chào mừng bạn đến với <strong>showroom nội thất</strong> của chúng tôi!
      Chúng tôi tự hào cung cấp những sản phẩm nội thất hiện đại, tinh tế và
      tiện nghi, nhằm mang đến không gian sống hoàn hảo cho mọi gia đình.
    </p>

    <div class="about-section">
      <h2>Tầm Nhìn & Sứ Mệnh</h2>
      <p>
        Tầm nhìn của chúng tôi là trở thành thương hiệu nội thất
        <em>hàng đầu</em>
        với chất lượng vượt trội và mẫu mã đa dạng, phù hợp với xu hướng mới
        nhất. Sứ mệnh của chúng tôi là mang đến cho khách hàng những giải pháp
        nội thất
        <strong>thẩm mỹ</strong> và <strong>tiện nghi</strong>, giúp tổ ấm trở
        nên ấm cúng và thể hiện cá tính riêng.
      </p>
    </div>

    <div class="core-values-section">
      <h2>Giá Trị Cốt Lõi</h2>
      <ul class="core-values-list">
        <li>
          <strong>Chất Lượng Hàng Đầu</strong>: Cam kết mọi sản phẩm đều đạt
          tiêu chuẩn cao, từ chất liệu đến thiết kế.
        </li>
        <li>
          <strong>Khách Hàng Là Trọng Tâm</strong>: Luôn lắng nghe và đáp ứng
          nhu cầu của khách hàng, mang lại trải nghiệm mua sắm tuyệt vời.
        </li>
        <li>
          <strong>Đổi Mới Sáng Tạo</strong>: Thường xuyên cập nhật xu hướng nội
          thất, kết hợp công nghệ và ý tưởng thiết kế mới.
        </li>
        <li>
          <strong>Trách Nhiệm Xã Hội</strong>: Hướng tới sử dụng vật liệu thân
          thiện môi trường, đóng góp cho cộng đồng và phát triển bền vững.
        </li>
      </ul>
    </div>

    <div class="team-section">
      <h2>Đội Ngũ Của Chúng Tôi</h2>
      <p>
        Chúng tôi có đội ngũ chuyên gia thiết kế, kỹ sư và nhân viên tư vấn
        nhiệt tình, dày dạn kinh nghiệm. Họ không ngừng sáng tạo, nghiên cứu xu
        hướng mới để mang đến cho khách hàng những sản phẩm nội thất độc đáo và
        phù hợp nhất với không gian sống.
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: "ComGioiTh",
};
</script>

<style scoped>
.page-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px;
  text-align: center;
  background-color: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.page-container:hover {
  transform: translateY(-5px);
}

h1 {
  font-size: 2.5em;
  margin-bottom: 20px;
  color: #2c3e50;
}

p {
  font-size: 1.2em;
  color: #555;
  line-height: 1.6;
}

.about-section {
  margin-top: 40px;
  padding: 20px;
  text-align: left;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.about-section h2 {
  font-size: 1.8em;
  margin-bottom: 10px;
  color: #3498db;
}

.about-section p {
  font-size: 1em;
  color: #333;
}

.core-values-section {
  margin-top: 40px;
  padding: 20px;
  text-align: left;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.core-values-section h2 {
  font-size: 1.8em;
  margin-bottom: 10px;
  color: #e67e22;
}

.core-values-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.core-values-list li {
  font-size: 1em;
  color: #444;
  margin: 10px 0;
  line-height: 1.6;
  position: relative;
  padding-left: 20px;
}

.core-values-list li:before {
  content: "✔";
  color: #e67e22;
  position: absolute;
  left: 0;
  top: 0;
  font-size: 1.2em;
}

.team-section {
  margin-top: 40px;
  padding: 20px;
  text-align: left;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.team-section h2 {
  font-size: 1.8em;
  margin-bottom: 10px;
  color: #27ae60;
}

.team-section p {
  font-size: 1em;
  color: #333;
}
</style>
