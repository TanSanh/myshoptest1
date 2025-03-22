<template>
  <div class="customers-container">
    <h1 class="page-title">Quản Lý Khách Hàng</h1>

    <div v-if="loading" class="loading-container">
      <div class="spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Đang tải dữ liệu...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button @click="fetchCustomers" class="btn btn-primary">
        <i class="fas fa-sync-alt"></i> Thử lại
      </button>
    </div>

    <div v-else>
      <div class="filters">
        <div class="search-container">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Tìm kiếm theo tên, email hoặc số điện thoại"
            class="search-input"
          />
          <button class="search-btn" @click="applyFilters">
            <i class="fas fa-search"></i>
          </button>
        </div>
      </div>

      <div class="table-container">
        <table class="customers-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ Tên</th>
              <th>Email</th>
              <th>Số Điện Thoại</th>
              <th>Vai Trò</th>
              <th>Tùy Chọn</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredCustomers.length === 0">
              <td colspan="6" class="empty-message">
                Không tìm thấy khách hàng nào
              </td>
            </tr>
            <tr v-for="customer in filteredCustomers" :key="customer._id">
              <td>{{ shortId(customer._id) }}</td>
              <td>{{ customer.fullname }}</td>
              <td>{{ customer.email }}</td>
              <td>{{ customer.phone || "Chưa cập nhật" }}</td>
              <td>
                <span class="role-badge" :class="getRoleClass(customer.role)">
                  {{ getRoleText(customer.role) }}
                </span>
              </td>
              <td class="actions">
                <button @click="editCustomer(customer)" class="btn-edit">
                  <i class="fas fa-edit"></i>
                </button>
                <button
                  @click="confirmDelete(customer)"
                  class="btn-delete"
                  :disabled="customer.role === 'admin'"
                >
                  <i class="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="totalPages > 1">
        <button
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
          class="page-btn"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <div class="page-info">Trang {{ currentPage }}/{{ totalPages }}</div>
        <button
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
          class="page-btn"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Modal chỉnh sửa khách hàng -->
    <div v-if="showEditModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Chỉnh Sửa Thông Tin Khách Hàng</h2>
          <button @click="closeModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Họ Tên</label>
            <input type="text" v-model="editForm.fullname" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" v-model="editForm.email" />
          </div>
          <div class="form-group">
            <label>Số Điện Thoại</label>
            <input type="text" v-model="editForm.phone" />
          </div>
          <div class="form-group">
            <label>Vai Trò</label>
            <select v-model="editForm.role">
              <option value="user">Khách hàng</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn-cancel">Hủy</button>
          <button @click="saveCustomer" class="btn-save">
            <span v-if="saving"><i class="fas fa-spinner fa-spin"></i></span>
            <span v-else>Lưu</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal xác nhận xóa -->
    <div v-if="showDeleteModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Xác Nhận Xóa</h2>
          <button @click="closeDeleteModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>
            Bạn có chắc chắn muốn xóa khách hàng "{{
              customerToDelete.fullname
            }}" không?
          </p>
          <p class="warning">Hành động này không thể hoàn tác!</p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn-cancel">Hủy</button>
          <button @click="deleteCustomer" class="btn-delete">
            <span v-if="deleting"><i class="fas fa-spinner fa-spin"></i></span>
            <span v-else>Xóa</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "customers-list",
  data() {
    return {
      customers: [],
      loading: true,
      error: null,
      searchQuery: "",
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 10,
      showEditModal: false,
      editForm: {
        _id: null,
        fullname: "",
        email: "",
        phone: "",
        role: "user",
      },
      saving: false,
      showDeleteModal: false,
      customerToDelete: {},
      deleting: false,
    };
  },
  computed: {
    filteredCustomers() {
      if (!this.searchQuery) {
        return this.customers;
      }

      const query = this.searchQuery.toLowerCase();
      return this.customers.filter(
        (customer) =>
          customer.fullname.toLowerCase().includes(query) ||
          customer.email.toLowerCase().includes(query) ||
          (customer.phone && customer.phone.includes(query))
      );
    },
  },
  created() {
    this.fetchCustomers();
  },
  methods: {
    async fetchCustomers() {
      this.loading = true;
      this.error = null;

      try {
        const token = localStorage.getItem("admin_token");
        if (!token) {
          this.$router.push("/admin/login");
          return;
        }

        const API_URL = "http://localhost:5001/api/admin/users";
        console.log("Fetching customers from:", API_URL);

        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Customers data:", data);
          if (data.success) {
            this.customers = data.data;
            this.totalPages = Math.ceil(data.data.length / this.itemsPerPage);
          } else {
            throw new Error(
              data.message || "Không thể tải danh sách khách hàng"
            );
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
        console.error("Customers List Error:", error);
        this.error =
          error.message ||
          "Không thể tải danh sách khách hàng. Vui lòng thử lại sau.";
        if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError")
        ) {
          this.error =
            "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ backend đã được khởi động chưa.";
        }
      } finally {
        this.loading = false;
      }
    },

    shortId(id) {
      if (!id) return "";
      // Lấy 6 ký tự cuối của ID MongoDB
      return id.substring(id.length - 6);
    },

    getRoleClass(role) {
      return {
        admin: role === "admin",
        user: role === "user",
      };
    },

    getRoleText(role) {
      return role === "admin" ? "Quản trị viên" : "Khách hàng";
    },

    applyFilters() {
      this.currentPage = 1;
    },

    changePage(page) {
      this.currentPage = page;
    },

    editCustomer(customer) {
      this.editForm = { ...customer };
      this.showEditModal = true;
    },

    closeModal() {
      this.showEditModal = false;
      this.editForm = {
        _id: null,
        fullname: "",
        email: "",
        phone: "",
        role: "user",
      };
    },

    async saveCustomer() {
      this.saving = true;

      try {
        const token = localStorage.getItem("admin_token");
        if (!token) {
          this.$router.push("/admin/login");
          return;
        }

        const API_URL = `http://localhost:5001/api/admin/users/${this.editForm._id}`;

        const response = await fetch(API_URL, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fullname: this.editForm.fullname,
            email: this.editForm.email,
            phone: this.editForm.phone,
            role: this.editForm.role,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Cập nhật dữ liệu trong danh sách
            const index = this.customers.findIndex(
              (c) => c._id === this.editForm._id
            );
            if (index !== -1) {
              this.customers[index] = {
                ...this.customers[index],
                ...data.data,
              };
            }

            this.closeModal();
            // Hiển thị thông báo thành công (có thể sử dụng toast hoặc alert)
            alert("Cập nhật thông tin khách hàng thành công!");
          } else {
            throw new Error(
              data.message || "Không thể cập nhật thông tin khách hàng"
            );
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Lỗi ${response.status}: ${response.statusText}`
          );
        }
      } catch (error) {
        console.error("Update Customer Error:", error);
        alert(
          error.message ||
            "Không thể cập nhật thông tin khách hàng. Vui lòng thử lại sau."
        );
      } finally {
        this.saving = false;
      }
    },

    confirmDelete(customer) {
      this.customerToDelete = customer;
      this.showDeleteModal = true;
    },

    closeDeleteModal() {
      this.showDeleteModal = false;
      this.customerToDelete = {};
    },

    async deleteCustomer() {
      this.deleting = true;

      try {
        const token = localStorage.getItem("admin_token");
        if (!token) {
          this.$router.push("/admin/login");
          return;
        }

        const API_URL = `http://localhost:5001/api/admin/users/${this.customerToDelete._id}`;

        const response = await fetch(API_URL, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Xóa khách hàng khỏi danh sách
            this.customers = this.customers.filter(
              (c) => c._id !== this.customerToDelete._id
            );
            this.closeDeleteModal();
            // Hiển thị thông báo thành công
            alert("Xóa khách hàng thành công!");
          } else {
            throw new Error(data.message || "Không thể xóa khách hàng");
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Lỗi ${response.status}: ${response.statusText}`
          );
        }
      } catch (error) {
        console.error("Delete Customer Error:", error);
        alert(
          error.message || "Không thể xóa khách hàng. Vui lòng thử lại sau."
        );
      } finally {
        this.deleting = false;
      }
    },
  },
};
</script>

<style scoped>
.customers-container {
  padding: 20px;
}

.page-title {
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

.filters {
  display: flex;
  margin-bottom: 20px;
}

.search-container {
  display: flex;
  flex: 1;
  max-width: 500px;
}

.search-input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-right: none;
  border-radius: 4px 0 0 4px;
  font-size: 14px;
}

.search-btn {
  padding: 10px 15px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}

.table-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  margin-bottom: 20px;
}

.customers-table {
  width: 100%;
  border-collapse: collapse;
}

.customers-table th,
.customers-table td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.customers-table th {
  background-color: #f9f9f9;
  font-weight: 600;
  color: #333;
}

.role-badge {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 600;
}

.role-badge.admin {
  background-color: #ff5722;
  color: white;
}

.role-badge.user {
  background-color: #4caf50;
  color: white;
}

.actions {
  display: flex;
  gap: 10px;
}

.btn-edit,
.btn-delete {
  padding: 5px 10px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
}

.btn-edit {
  background-color: #2196f3;
  color: white;
}

.btn-delete {
  background-color: #f44336;
  color: white;
}

.btn-delete:disabled {
  background-color: #ddd;
  cursor: not-allowed;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.page-btn {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 3px;
  padding: 5px 10px;
  cursor: pointer;
  color: #333;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

.empty-message {
  text-align: center;
  padding: 30px;
  color: #666;
}

/* Modal styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  width: 500px;
  max-width: 90%;
}

.modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel,
.btn-save,
.btn-primary {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.btn-cancel {
  background-color: #f5f5f5;
  color: #333;
}

.btn-save {
  background-color: #4caf50;
  color: white;
}

.btn-primary {
  background-color: #2196f3;
  color: white;
}

.warning {
  color: #f44336;
  font-weight: 600;
}
</style>
