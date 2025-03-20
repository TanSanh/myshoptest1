import { createApp } from "vue";
import App from "./App.vue";
import store from "./store";
import router from "./router";
import axios from "axios";
import "@fortawesome/fontawesome-free/css/all.css";

// Thiết lập token mặc định cho axios nếu có
const token = localStorage.getItem("token");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// Thiết lập interceptor để xử lý lỗi 401
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Đăng xuất nếu token hết hạn
      await store.dispatch("auth/logout");
      router.push("/login");
    }
    return Promise.reject(error);
  }
);

// Tạo ứng dụng Vue
const app = createApp(App);

//  Bật devtools trong môi trường phát triển
if (process.env.NODE_ENV === "development") {
  app.config.devtools = true;
}

// Sử dụng Vuex Store
app.use(store);

// Sử dụng Vue Router
app.use(router);

// Mount ứng dụng vào DOM
app.mount("#app");
