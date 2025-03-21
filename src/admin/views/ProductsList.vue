<!-- src/views/admin/ProductsList.vue -->
<template>
  <div class="products-container">
    <h1 class="page-title">Quản Lý Sản Phẩm</h1>
    
    <div v-if="loading" class="loading-container">
      <div class="spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Đang tải dữ liệu...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button @click="fetchProducts" class="btn btn-primary">
        <i class="fas fa-sync-alt"></i> Thử lại
      </button>
    </div>

    <div v-else>
      <div class="actions-bar">
        <div class="search-container">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Tìm kiếm theo tên, mã sản phẩm"
            class="search-input"
          />
          <button class="search-btn" @click="applyFilters">
            <i class="fas fa-search"></i>
          </button>
        </div>
        <button @click="showAddModal = true" class="btn-add">
          <i class="fas fa-plus"></i> Thêm sản phẩm
        </button>
      </div>

      <div class="table-container">
        <table class="products-table">
          <thead>
            <tr>
              <th>Mã SP</th>
              <th>Hình ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Giá</th>
              <th>Tồn kho</th>
              <th>Trạng thái</th>
              <th>Tùy chọn</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredProducts.length === 0">
              <td colspan="7" class="empty-message">
                Không tìm thấy sản phẩm nào
              </td>
            </tr>
            <tr v-for="product in filteredProducts" :key="product._id">
              <td>{{ shortId(product._id) }}</td>
              <td class="product-image">
                <img 
                  :src="product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/50'" 
                  alt="Hình ảnh sản phẩm"
                />
              </td>
              <td>{{ product.name }}</td>
              <td>{{ formatPrice(product.price) }}</td>
              <td>{{ product.countInStock }}</td>
              <td>
                <span class="status-badge" :class="getStatusClass(product.isActive)">
                  {{ product.isActive ? 'Còn bán' : 'Ngừng bán' }}
                </span>
              </td>
              <td class="actions">
                <button @click="editProduct(product)" class="btn-edit">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="confirmDelete(product)" class="btn-delete">
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
        <div class="page-info">
          Trang {{ currentPage }}/{{ totalPages }}
        </div>
        <button
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
          class="page-btn"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Modal thêm/sửa sản phẩm -->
    <div v-if="showAddModal || showEditModal" class="modal">
      <div class="modal-content product-modal">
        <div class="modal-header">
          <h2>{{ showEditModal ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới' }}</h2>
          <button @click="closeModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Tên sản phẩm <span class="required">*</span></label>
            <input type="text" v-model="productForm.name" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Giá <span class="required">*</span></label>
              <input type="number" v-model="productForm.price" min="0" required />
            </div>
            <div class="form-group">
              <label>Số lượng <span class="required">*</span></label>
              <input type="number" v-model="productForm.countInStock" min="0" required />
            </div>
          </div>
          <div class="form-group">
            <label>Mô tả</label>
            <textarea v-model="productForm.description" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Hình ảnh URL</label>
            <input type="text" v-model="productForm.imageUrl" placeholder="https://example.com/image.jpg" />
            <small>Nhập URL ảnh hoặc tải lên từ máy tính (chức năng đang phát triển)</small>
          </div>
          <div class="form-group">
            <label>Trạng thái</label>
            <div class="toggle-container">
              <label class="toggle">
                <input type="checkbox" v-model="productForm.isActive">
                <span class="slider"></span>
              </label>
              <span class="toggle-label">{{ productForm.isActive ? 'Đang bán' : 'Ngừng bán' }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn-cancel">Hủy</button>
          <button @click="saveProduct" class="btn-save" :disabled="!isFormValid || saving">
            <span v-if="saving"><i class="fas fa-spinner fa-spin"></i></span>
            <span v-else>{{ showEditModal ? 'Cập nhật' : 'Thêm' }}</span>
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
            Bạn có chắc chắn muốn xóa sản phẩm "{{ productToDelete.name }}" không?
          </p>
          <p class="warning">Hành động này không thể hoàn tác!</p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn-cancel">Hủy</button>
          <button @click="deleteProduct" class="btn-delete">
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
  name: "products-list",
  data() {
    return {
      products: [],
      loading: true,
      error: null,
      searchQuery: "",
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 10,
      showAddModal: false,
      showEditModal: false,
      productForm: {
        _id: null,
        name: "",
        price: 0,
        countInStock: 0,
        description: "",
        imageUrl: "",
        isActive: true,
        images: []
      },
      saving: false,
      showDeleteModal: false,
      productToDelete: {},
      deleting: false
    };
  },
  computed: {
    filteredProducts() {
      if (!this.searchQuery) {
        return this.products;
      }
      
      const query = this.searchQuery.toLowerCase();
      return this.products.filter(
        product => 
          product.name.toLowerCase().includes(query) ||
          product._id.toLowerCase().includes(query)
      );
    },
    isFormValid() {
      return this.productForm.name && 
             this.productForm.price > 0 && 
             this.productForm.countInStock >= 0;
    }
  },
  created() {
    this.fetchProducts();
  },
  methods: {
    async fetchProducts() {
      this.loading = true;
      this.error = null;

      try {
        const token = localStorage.getItem("admin_token");
        if (!token) {
          this.$router.push("/admin/login");
          return;
        }

        const API_URL = "http://localhost:5001/api/admin/products";
        console.log("Fetching products from:", API_URL);

        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Products data:", data);
          if (data.success) {
            this.products = data.data;
            this.totalPages = Math.ceil(data.data.length / this.itemsPerPage);
          } else {
            throw new Error(data.message || "Không thể tải danh sách sản phẩm");
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
        console.error("Products List Error:", error);
        this.error = error.message || "Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.";
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          this.error = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ backend đã được khởi động chưa.";

          // Sử dụng dữ liệu mẫu cho môi trường phát triển
          this.products = [
            {
              _id: "6267d9220e4f441c71e7b31",
              name: "Áo thun nam cổ tròn",
              price: 199000,
              countInStock: 50,
              description: "Áo thun nam cổ tròn chất liệu cotton 100%",
              images: ["https://via.placeholder.com/150?text=Ao+Thun"],
              isActive: true
            },
            {
              _id: "6267d9220e4f441c71e7b32",
              name: "Quần jean nam slim fit",
              price: 450000,
              countInStock: 30,
              description: "Quần jean nam slim fit màu xanh đen",
              images: ["https://via.placeholder.com/150?text=Quan+Jean"],
              isActive: true
            },
            {
              _id: "6267d9220e4f441c71e7b33",
              name: "Áo khoác nữ dáng dài",
              price: 750000,
              countInStock: 20,
              description: "Áo khoác nữ dáng dài kiểu Hàn Quốc",
              images: ["https://via.placeholder.com/150?text=Ao+Khoac"],
              isActive: false
            }
          ];
          this.totalPages = Math.ceil(this.products.length / this.itemsPerPage);
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
    
    formatPrice(price) {
      return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND',
        maximumFractionDigits: 0
      }).format(price);
    },
    
    getStatusClass(isActive) {
      return isActive ? 'active' : 'inactive';
    },
    
    applyFilters() {
      this.currentPage = 1;
    },
    
    changePage(page) {
      this.currentPage = page;
    },
    
    editProduct(product) {
      this.productForm = { 
        _id: product._id,
        name: product.name,
        price: product.price,
        countInStock: product.countInStock,
        description: product.description || '',
        imageUrl: product.images && product.images.length > 0 ? product.images[0] : '',
        isActive: product.isActive !== false,
        images: product.images || []
      };
      this.showEditModal = true;
    },
    
    closeModal() {
      this.showAddModal = false;
      this.showEditModal = false;
      this.resetForm();
    },
    
    resetForm() {
      this.productForm = {
        _id: null,
        name: "",
        price: 0,
        countInStock: 0,
        description: "",
        imageUrl: "",
        isActive: true,
        images: []
      };
    },
    
    async saveProduct() {
      if (!this.isFormValid) return;
      
      this.saving = true;
      
      try {
        const token = localStorage.getItem("admin_token");
        if (!token) {
          this.$router.push("/admin/login");
          return;
        }
        
        // Prepare product data
        const productData = {
          name: this.productForm.name,
          price: Number(this.productForm.price),
          countInStock: Number(this.productForm.countInStock),
          description: this.productForm.description,
          isActive: this.productForm.isActive
        };
        
        // Add image if provided
        if (this.productForm.imageUrl) {
          productData.images = [this.productForm.imageUrl];
        }
        
        let API_URL, method;
        
        if (this.showEditModal) {
          // Update existing product
          API_URL = `http://localhost:5001/api/admin/products/${this.productForm._id}`;
          method = "PUT";
        } else {
          // Create new product
          API_URL = `http://localhost:5001/api/admin/products`;
          method = "POST";
        }
        
        const response = await fetch(API_URL, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(productData)
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            if (this.showEditModal) {
              // Update in the list
              const index = this.products.findIndex(p => p._id === this.productForm._id);
              if (index !== -1) {
                this.products[index] = data.data;
              }
            } else {
              // Add to the list
              this.products.unshift(data.data);
              this.totalPages = Math.ceil(this.products.length / this.itemsPerPage);
            }
            
            this.closeModal();
            alert(this.showEditModal ? "Cập nhật sản phẩm thành công!" : "Thêm sản phẩm mới thành công!");
          } else {
            throw new Error(data.message || `Không thể ${this.showEditModal ? 'cập nhật' : 'thêm'} sản phẩm`);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Lỗi ${response.status}: ${response.statusText}`
          );
        }
      } catch (error) {
        console.error("Save Product Error:", error);
        alert(error.message || `Không thể ${this.showEditModal ? 'cập nhật' : 'thêm'} sản phẩm. Vui lòng thử lại sau.`);
      } finally {
        this.saving = false;
      }
    },
    
    confirmDelete(product) {
      this.productToDelete = product;
      this.showDeleteModal = true;
    },
    
    closeDeleteModal() {
      this.showDeleteModal = false;
      this.productToDelete = {};
    },
    
    async deleteProduct() {
      this.deleting = true;
      
      try {
        const token = localStorage.getItem("admin_token");
        if (!token) {
          this.$router.push("/admin/login");
          return;
        }
        
        const API_URL = `http://localhost:5001/api/admin/products/${this.productToDelete._id}`;
        
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
            this.products = this.products.filter(p => p._id !== this.productToDelete._id);
            this.totalPages = Math.ceil(this.products.length / this.itemsPerPage);
            this.closeDeleteModal();
            alert("Xóa sản phẩm thành công!");
          } else {
            throw new Error(data.message || "Không thể xóa sản phẩm");
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Lỗi ${response.status}: ${response.statusText}`
          );
        }
      } catch (error) {
        console.error("Delete Product Error:", error);
        alert(error.message || "Không thể xóa sản phẩm. Vui lòng thử lại sau.");
      } finally {
        this.deleting = false;
      }
    }
  }
};
</script>

<style scoped>
.products-container {
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
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

.products-table {
  width: 100%;
  border-collapse: collapse;
}

.products-table th,
.products-table td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.products-table th {
  background-color: #f9f9f9;
  font-weight: 600;
  color: #333;
}

.product-image {
  width: 60px;
}

.product-image img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
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

.product-modal {
  width: 600px;
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

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group select,
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

small {
  display: block;
  margin-top: 5px;
  color: #666;
  font-size: 12px;
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

.btn-save:disabled {
  background-color: #ddd;
  cursor: not-allowed;
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
