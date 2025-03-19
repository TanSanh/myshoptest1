import axios from "axios";

export default {
  namespaced: true,
  state: () => ({
    currentUser: JSON.parse(localStorage.getItem("currentUser")) || null,
    token: localStorage.getItem("token") || null,
    loading: false,
    error: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.currentUser && !!state.token,
    currentUser: (state) => state.currentUser,
    token: (state) => state.token,
    isLoading: (state) => state.loading,
    errorMessage: (state) => state.error,
  },
  mutations: {
    SET_USER(state, { user, token }) {
      state.currentUser = user;
      state.token = token;
      localStorage.setItem("currentUser", JSON.stringify(user));
      localStorage.setItem("token", token);
    },
    LOGOUT(state) {
      state.currentUser = null;
      state.token = null;
      localStorage.removeItem("currentUser");
      localStorage.removeItem("token");
    },
    SET_LOADING(state, isLoading) {
      state.loading = isLoading;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
  },
  actions: {
    async login({ commit, dispatch }, userData) {
      commit("SET_LOADING", true);
      commit("SET_ERROR", null);
      try {
        const res = await axios.post("http://localhost:5001/users/login", {
          email: userData.email,
          password: userData.password,
        });
        
        if (!res.data.token) {
          throw new Error("Không nhận được token từ server");
        }
        
        const user = res.data.user;
        const token = res.data.token;
        
        // Thiết lập token mặc định cho tất cả các yêu cầu axios
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        
        commit("SET_USER", { user, token });
        
        // Đồng bộ giỏ hàng và lịch sử thanh toán sau khi đăng nhập
        await dispatch("cart/fetchCart", null, { root: true });
        await dispatch("paymentHistory/fetchPaymentHistory", null, {
          root: true,
        });
      } catch (error) {
        console.error("Error login:", error);
        const msg =
          (error.response &&
            error.response.data &&
            error.response.data.message) ||
          error.message ||
          "Đăng nhập thất bại";
        commit("SET_ERROR", msg);
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },
    async logout({ commit, dispatch }) {
      // Xóa token mặc định từ axios
      delete axios.defaults.headers.common["Authorization"];
      
      commit("LOGOUT");
      // Xóa giỏ hàng trong trạng thái Vuex
      await dispatch("cart/clearCart", null, { root: true });
      await dispatch("paymentHistory/fetchPaymentHistory", null, {
        root: true,
      });
    },
    
    // Kiểm tra token hiện tại có hợp lệ không
    async checkAuth({ state, dispatch }) {
      const token = state.token || localStorage.getItem("token");
      if (!token) {
        return false;
      }
      
      try {
        // Gọi API để kiểm tra token
        await axios.get("http://localhost:5001/users/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        return true;
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // Token không hợp lệ, đăng xuất
          await dispatch("logout");
        }
        return false;
      }
    }
  },
};
