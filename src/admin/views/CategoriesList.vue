<template>
  <div class="categories-container">
    <h1 class="page-title">Quản Lý Danh Mục</h1>

    <div v-if="loading" class="loading-container">
      <div class="spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Đang tải dữ liệu...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button @click="fetchCategories" class="btn btn-primary">
        <i class="fas fa-sync-alt"></i> Thử lại
      </button>
    </div>

    <div v-else>
      <div class="actions-bar">
        <div class="search-container">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Tìm kiếm theo tên danh mục"
            class="search-input"
          />
          <button class="search-btn" @click="applyFilters">
            <i class="fas fa-search"></i>
          </button>
        </div>
        <button @click="showAddForm = true" class="btn-add">
          <i class="fas fa-plus"></i> Thêm danh mục
        </button>
      </div>

      <div class="table-container">
        <table class="categories-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên danh mục</th>
              <th>Mô tả</th>
              <th>Số sản phẩm</th>
              <th>Trạng thái</th>
              <th>Tùy chọn</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredCategories.length === 0">
              <td colspan="6" class="empty-message">
                Không tìm thấy danh mục nào
              </td>
            </tr>
            <tr v-for="category in filteredCategories" :key="category._id">
              <td>{{ shortId(category._id) }}</td>
              <td>{{ category.name }}</td>
              <td>{{ category.description || 'Không có mô tả' }}</td>
              <td>{{ category.productCount || 0 }}</td>
              <td>
                <span class="status-badge" :class="getStatusClass(category.isActive)">
                  {{ category.isActive ? 'Hiển thị' : 'Ẩn' }}
                </span>
              </td>
              <td class="actions">
                <button @click="editCategory(category)" class="btn-edit">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="confirmDelete(category)" class="btn-delete">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal thêm/sửa danh mục -->
    <div v-if="showAddForm || showEditForm" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ showEditForm ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Mới' }}</h2>
          <button @click="closeModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Tên danh mục <span class="required">*</span></label>
            <input type="text" v-model="categoryForm.name" required />
          </div>
          <div class="form-group">
            <label>Mô tả</label>
            <textarea v-model="categoryForm.description" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Trạng thái</label>
            <div class="toggle-container">
              <label class="toggle">
                <input type="checkbox" v-model="categoryForm.isActive">
                <span class="slider"></span>
              </label>
              <span class="toggle-label">{{ categoryForm.isActive ? 'Hiển thị' : 'Ẩn' }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn-cancel">Hủy</button>
          <button @click="saveCategory" class="btn-save" :disabled="!categoryForm.name || saving">
            <span v-if="saving"><i class="fas fa-spinner fa-spin"></i></span>
            <span v-else>{{ showEditForm ? 'Cập nhật' : 'Thêm' }}</span>
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
            Bạn có chắc chắn muốn xóa danh mục "{{ categoryToDelete.name }}" không?
          </p>
          <p v-if="categoryToDelete.productCount > 0" class="warning">
            Danh mục này đang có {{ categoryToDelete.productCount }} sản phẩm. Xóa danh mục sẽ ảnh hưởng đến các sản phẩm này!
          </p>
          <p class="warning">Hành động này không thể hoàn tác!</p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn-cancel">Hủy</button>
          <button @click="deleteCategory" class="btn-delete">
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
  name: "categories-list",
  data() {
    return {
      categories: [],
      loading: true,
      error: null,
      searchQuery: "",
      showAddForm: false,
      showEditForm: false,
      categoryForm: {
        _id: null,
        name: "",
        description: "",
        isActive: true
      },
      saving: false,
      showDeleteModal: false,
      categoryToDelete: {},
      deleting: false
    };
  },
  computed: {
    filteredCategories() {
      if (!this.searchQuery) {
        return this.categories;
      }
      
      const query = this.searchQuery.toLowerCase();
      return this.categories.filter(
        category => 
          category.name.toLowerCase().includes(query) ||
          (category.description && category.description.toLowerCase().includes(query))
      );
    }
  },
  created() {
    this.fetchCategories();
  },
  methods: {
    async fetchCategories() {
      this.loading = true;
      this.error = null;

      try {
        const token = localStorage.getItem("admin_token");
        if (!token) {
          this.$router.push("/admin/login");
          return;
        }

        const API_URL = "http://localhost:5001/api/admin/categories";
        console.log("Fetching categories from:", API_URL);

        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Categories data:", data);
          if (data.success) {
            this.categories = data.data;
          } else {
            throw new Error(data.message || "Không thể tải danh sách danh mục");
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
        console.error("Categories List Error:", error);
        this.error = error.message || "Không thể tải danh sách danh mục. Vui lòng thử lại sau.";
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          this.error = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ backend đã được khởi động chưa.";
          
          // Sử dụng dữ liệu mẫu cho môi trường phát triển
          this.categories = [
            {
              _id: "5f9a5b5a5a5a5a5a5a5a5a5a",
              name: "Quần áo nam",
              description: "Danh mục quần áo dành cho nam",
              isActive: true,
              productCount: 25
            },
            {
              _id: "5f9a5b5a5a5a5a5a5a5a5a5b",
              name: "Quần áo nữ",
              description: "Danh mục quần áo dành cho nữ",
              isActive: true,
              productCount: 30
            },
            {
              _id: "5f9a5b5a5a5a5a5a5a5a5a5c",
              name: "Phụ kiện",
              description: "Các phụ kiện thời trang",
              isActive: true,
              productCount: 15
            },
            {
              _id: "5f9a5b5a5a5a5a5a5a5a5a5d",
              name: "Giày dép",
              description: "Giày, dép các loại",
              isActive: true,
              productCount: 20
            },
            {
              _id: "5f9a5b5a5a5a5a5a5a5a5a5e",
              name: "Đồ thể thao",
              description: "Các sản phẩm dành cho thể thao và dã ngoại",
              isActive: false,
              productCount: 10
            }
          ];
          this.error = null;
        }
      } finally {
        this.loading = false;
      }
    },
    
    shortId(id) {
      if (!id) return '';
      return id.substring(id.length - 6);
    },
    
    getStatusClass(isActive) {
      return isActive ? 'active' : 'inactive';
    },
    
    applyFilters() {
      // Có thể thêm logic lọc khác ở đây nếu cần
    },
    
    editCategory(category) {
      this.categoryForm = { 
        _id: category._id,
        name: category.name,
        description: category.description || '',
        isActive: category.isActive !== false
      };
      this.showEditForm = true;
    },
    
    closeModal() {
      this.showAddForm = false;
      this.showEditForm = false;
      this.resetForm();
    },
    
    resetForm() {
      this.categoryForm = {
        _id: null,
        name: "",
        description: "",
        isActive: true
      };
    },
    
    async saveCategory() {
      if (!this.categoryForm.name) return;
      
      this.saving = true;
      
      try {
        const token = localStorage.getItem("admin_token");
        if (!token) {
          this.$router.push("/admin/login");
          return;
        }
        
        // Prepare category data
        const categoryData = {
          name: this.categoryForm.name,
          description: this.categoryForm.description,
          isActive: this.categoryForm.isActive
        };
        
        let API_URL, method;
        
        if (this.showEditForm) {
          // Update existing category
          API_URL = `http://localhost:5001/api/admin/categories/${this.categoryForm._id}`;
          method = "PUT";
        } else {
          // Create new category
          API_URL = `http://localhost:5001/api/admin/categories`;
          method = "POST";
        }
        
        const response = await fetch(API_URL, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(categoryData)
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            if (this.showEditForm) {
              // Update in the list
              const index = this.categories.findIndex(c => c._id === this.categoryForm._id);
              if (index !== -1) {
                this.categories[index] = {
                  ...this.categories[index],
                  ...data.data
                };
              }
            } else {
              // Add to the list
              this.categories.unshift({
                ...data.data,
                productCount: 0
              });
            }
            
            this.closeModal();
            alert(this.showEditForm ? "Cập nhật danh mục thành công!" : "Thêm danh mục mới thành công!");
          } else {
            throw new Error(data.message || `Không thể ${this.showEditForm ? 'cập nhật' : 'thêm'} danh mục`);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Lỗi ${response.status}: ${response.statusText}`
          );
        }
      } catch (error) {
        console.error("Save Category Error:", error);
        alert(error.message || `Không thể ${this.showEditForm ? 'cập nhật' : 'thêm'} danh mục. Vui lòng thử lại sau.`);
      } finally {
        this.saving = false;
      }
    },
    
    confirmDelete(category) {
      this.categoryToDelete = category;
      this.showDeleteModal = true;
    },
    
    closeDeleteModal() {
      this.showDeleteModal = false;
      this.categoryToDelete = {};
    },
    
    async deleteCategory() {
      this.deleting = true;
      
      try {
        const token = localStorage.getItem("admin_token");
        if (!token) {
          this.$router.push("/admin/login");
          return;
        }
        
        const API_URL = `http://localhost:5001/api/admin/categories/${this.categoryToDelete._id}`;
        
        const response = await fetch(API_URL, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Remove from the list
            this.categories = this.categories.filter(c => c._id !== this.categoryToDelete._id);
            this.closeDeleteModal();
            alert("Xóa danh mục thành công!");
          } else {
            throw new Error(data.message || "Không thể xóa danh mục");
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Lỗi ${response.status}: ${response.statusText}`
          );
        }
      } catch (error) {
        console.error("Delete Category Error:", error);
        alert(error.message || "Không thể xóa danh mục. Vui lòng thử lại sau.");
      } finally {
        this.deleting = false;
      }
    }
  }
};
</script>

<style scoped>
.categories-container {
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

.actions-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.search-container {
  display: flex;
  max-width: 500px;
  width: 50%;
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

.btn-add {
  padding: 10px 15px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
}

.table-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  margin-bottom: 20px;
}

.categories-table {
  width: 100%;
  border-collapse: collapse;
}

.categories-table th,
.categories-table td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.categories-table th {
  background-color: #f9f9f9;
  font-weight: 600;
  color: #333;
}

.status-badge {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.active {
  background-color: #e6f7ee;
  color: #00965e;
}

.status-badge.inactive {
  background-color: #fee6e6;
  color: #d32f2f;
}

.actions {
  display: flex;
  gap: 10px;
}

.btn-edit, .btn-delete {
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
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
}

.required {
  color: #f44336;
}

.toggle-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #4caf50;
}

input:focus + .slider {
  box-shadow: 0 0 1px #4caf50;
}

input:checked + .slider:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}

.toggle-label {
  font-size: 14px;
  color: #333;
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

.btn-save:disabled {
  background-color: #ddd;
  cursor: not-allowed;
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
