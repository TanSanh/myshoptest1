<template>
  <div class="dashboard">
    <h1 class="dashboard-title">Bảng Điều Khiển</h1>

    <div v-if="loading" class="loading-container">
      <div class="spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Đang tải dữ liệu...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button @click="fetchDashboardData" class="btn btn-primary">
        <i class="fas fa-sync-alt"></i> Thử lại
      </button>
    </div>

    <div v-else>
      <div class="stats-container">
        <stat-card
          title="Tổng Doanh Thu"
          :value="formatCurrency(dashboardData.totalRevenue)"
          icon="fas fa-money-bill-wave"
          backgroundColor="#FF7B54"
        />
        <stat-card
          title="Tổng Đơn Hàng"
          :value="dashboardData.totalOrders"
          icon="fas fa-shopping-cart"
          backgroundColor="#2196f3"
        />
        <stat-card
          title="Khách Hàng"
          :value="dashboardData.totalCustomers"
          icon="fas fa-users"
          backgroundColor="#4caf50"
        />
        <stat-card
          title="Sản Phẩm"
          :value="dashboardData.totalProducts"
          icon="fas fa-box"
          backgroundColor="#ff5722"
        />
      </div>

      <div class="chart-section">
        <div class="chart-header">
          <h2>Doanh Thu Tháng {{ currentMonth }}/{{ currentYear }}</h2>
        </div>
        <div class="chart-container">
          <div class="chart-placeholder">
            <div class="chart-bars">
              <div
                v-for="(value, index) in dashboardData.salesData"
                :key="index"
                class="chart-bar"
                :style="{
                  height: `${(value / maxSalesValue) * 100}%`,
                }"
                :title="`Ngày ${index + 1}: ${formatCurrency(value)}`"
              ></div>
            </div>
          </div>
          <div class="chart-labels">
            <div
              v-for="label in chartLabels"
              :key="label.index"
              class="chart-label"
            >
              {{ label.text }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import StatCard from "../components/StatCard.vue";

export default {
  name: "admin-dashboard",
  components: {
    StatCard,
  },
  data() {
    return {
      loading: true,
      error: null,
      dashboardData: {
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalProducts: 0,
        salesData: [],
      },
    };
  },
  computed: {
    currentMonth() {
      return new Date().getMonth() + 1;
    },
    currentYear() {
      return new Date().getFullYear();
    },
    maxSalesValue() {
      if (
        !this.dashboardData.salesData ||
        this.dashboardData.salesData.length === 0
      ) {
        return 1;
      }
      return Math.max(...this.dashboardData.salesData, 1);
    },
    chartLabels() {
      if (!this.dashboardData.salesData) return [];

      return this.dashboardData.salesData
        .map((_, index) => ({ index, text: index + 1 }))
        .filter((item) => item.index % 5 === 0);
    },
  },
  created() {
    this.fetchDashboardData();
  },
  methods: {
    async fetchDashboardData() {
      this.loading = true;
      this.error = null;

      try {
        const token = localStorage.getItem("admin_token");
        if (!token) {
          this.$router.push("/admin/login");
          return;
        }

        const response = await fetch(
          "http://localhost:5001/api/admin/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();

          if (data.success) {
            this.dashboardData = {
              totalRevenue: data.data?.totalRevenue || 0,
              totalOrders: data.data?.totalOrders || 0,
              totalCustomers: data.data?.totalCustomers || 0,
              totalProducts: data.data?.totalProducts || 0,
              salesData: data.data?.salesData || Array(31).fill(0),
            };
          } else {
            throw new Error(data.message || "Không thể tải dữ liệu thống kê");
          }
        } else if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          this.$router.push("/admin/login");
          return;
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Lỗi ${response.status}: ${response.statusText}`
          );
        }
      } catch (error) {
        this.error =
          error.message ||
          "Không thể tải dữ liệu bảng điều khiển. Vui lòng thử lại sau.";
      } finally {
        this.loading = false;
      }
    },

    formatCurrency(value) {
      if (typeof value !== "number") {
        value = Number(value) || 0;
      }
      return value.toLocaleString("vi-VN") + " đ";
    },
  },
};
</script>

<style scoped>
.dashboard {
  padding: 20px;
  background-color: #f5f5f5;
}

.dashboard-title {
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
}

.loading-container,
.error-container {
  text-align: center;
  padding: 50px 0;
  color: #666;
}

.loading-container .spinner,
.error-container i {
  font-size: 48px;
  margin-bottom: 20px;
  color: #2196f3;
}

.error-container i {
  color: #f44336;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.chart-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 30px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h2 {
  font-size: 18px;
  margin: 0;
}

.chart-actions {
  display: flex;
  gap: 5px;
}

.btn {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
}

.btn-primary {
  background-color: #2196f3;
  color: white;
  border: none;
}

.btn-sm {
  padding: 2px 5px;
  font-size: 12px;
}

.btn-outline {
  border-color: #ddd;
  color: #666;
}

.btn-outline:hover {
  background-color: #f5f5f5;
}

.chart-container {
  height: 300px;
  position: relative;
}

.chart-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.chart-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 90%;
  padding-bottom: 20px;
}

.chart-bar {
  width: 20px;
  background-color: #2196f3;
  border-radius: 2px 2px 0 0;
  margin: 0 5px;
  transition: height 0.3s;
  min-height: 5px;
  cursor: pointer;
}

.chart-bar:hover {
  background-color: #1976d2;
}

.chart-labels {
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
}

.chart-label {
  font-size: 12px;
  color: #888;
  width: 20px;
  text-align: center;
}

@media (max-width: 1024px) {
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
  }

  .recent-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-container {
    grid-template-columns: 1fr;
  }
}
</style>
