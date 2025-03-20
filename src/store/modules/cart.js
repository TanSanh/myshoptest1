import axios from "axios";

const state = () => ({
  cartItems: [],
});

const mutations = {
  SET_CART_ITEMS(state, items) {
    state.cartItems = items;
  },
  CLEAR_CART(state) {
    state.cartItems = [];
  },
};

const actions = {
  async fetchCart({ commit, rootGetters, dispatch }) {
    const currentUser = rootGetters["auth/currentUser"];
    if (!currentUser) {
      commit("SET_CART_ITEMS", []);
      return;
    }
    
    const token = localStorage.getItem("token");
    if (!token) {
      commit("SET_CART_ITEMS", []);
      return;
    }
    
    try {
      // Đảm bảo danh sách sản phẩm đã được tải trước
      await dispatch("products/fetchProducts", null, { root: true });
      
      const response = await axios.get("http://localhost:5001/users/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Kiểm tra và điều chỉnh số lượng sản phẩm nếu vượt quá tồn kho
      const cartItems = response.data.items || [];
      let hasChanges = false;
      
      for (let i = 0; i < cartItems.length; i++) {
        const item = cartItems[i];
        
        // Đảm bảo productId là chuỗi đơn giản, không phải là đối tượng
        if (item.productId && typeof item.productId === 'object') {
          // Nếu productId là đối tượng, lấy _id hoặc id của nó
          cartItems[i].productId = item.productId._id || item.productId.id || JSON.stringify(item.productId);
          hasChanges = true;
        }

        const product = rootGetters["products/getProductById"](cartItems[i].productId);
        
        if (product) {
          console.log(`Sản phẩm "${item.name}" có ID: ${cartItems[i].productId}, tồn kho: ${product.stock}`);
          
          if (item.quantity > product.stock) {
            console.warn(`Sản phẩm "${item.name}" có số lượng (${item.quantity}) vượt quá tồn kho (${product.stock}). Đang điều chỉnh...`);
            cartItems[i].quantity = product.stock;
            hasChanges = true;
            
            // Cập nhật lại số lượng trên server
            try {
              await axios.put(
                "http://localhost:5001/users/cart",
                {
                  variantId: item.variantId,
                  productId: cartItems[i].productId,
                  name: item.name,
                  color: item.color,
                  size: item.size,
                  quantity: product.stock,
                  price: item.price,
                  image: item.image,
                },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
            } catch (updateError) {
              console.error("Lỗi khi cập nhật số lượng sản phẩm:", updateError);
            }
          }
        } else {
          console.warn(`Không tìm thấy sản phẩm có ID ${cartItems[i].productId} trong danh sách sản phẩm`);
        }
      }
      
      commit("SET_CART_ITEMS", cartItems);
      
      if (hasChanges) {
        console.log("Đã cập nhật giỏ hàng do có sản phẩm vượt quá tồn kho hoặc ID không đúng định dạng");
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      if (error.response && error.response.status === 401) {
        console.error("Token hết hạn hoặc không hợp lệ. Đang đăng xuất...");
        await dispatch("auth/logout", null, { root: true });
        commit("SET_CART_ITEMS", []);
      } else if (error.response && error.response.status === 404) {
        console.warn("Endpoint /users/cart not found. Creating new cart...");
        try {
          await axios.post(
            "http://localhost:5001/users/cart",
            { userId: currentUser.id, items: [] },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } catch (postError) {
          console.error("Error creating cart:", postError);
        }
        commit("SET_CART_ITEMS", []);
      } else {
        commit("SET_CART_ITEMS", []);
      }
    }
  },
  async addToCart({ dispatch, rootGetters }, product) {
    const currentUser = rootGetters["auth/currentUser"];
    if (!currentUser) {
      console.warn("User not authenticated. Please log in to add to cart.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found. Please log in.");
      return;
    }

    // Đảm bảo productId là chuỗi đơn giản, không phải là đối tượng
    let productId = product._id || product.id;
    if (productId && typeof productId === 'object') {
      productId = productId._id || productId.id || String(productId);
    }
    
    const variantId = `${productId}_${product.color || "N/A"}_${
      product.size || "N/A"
    }`;
    const quantityToAdd =
      product.quantity && product.quantity > 0 ? product.quantity : 1;

    // Kiểm tra số lượng tồn kho
    const productInStore = rootGetters["products/getProductById"](productId);
    if (!productInStore) {
      throw new Error(`Không tìm thấy thông tin sản phẩm. Vui lòng thử lại sau.`);
    }

    // Tìm số lượng hiện tại trong giỏ hàng (nếu có)
    const cartItems = this.state.cart.cartItems;
    const existingItem = cartItems.find((item) => item.variantId === variantId);
    const currentQuantity = existingItem ? existingItem.quantity : 0;

    // Tổng số lượng sau khi thêm
    const totalQuantity = currentQuantity + quantityToAdd;

    if (totalQuantity > productInStore.stock) {
      // Nếu số lượng vượt quá tồn kho, thêm tối đa có thể
      const availableToAdd = Math.max(0, productInStore.stock - currentQuantity);
      
      if (availableToAdd <= 0) {
        throw new Error(
          `Không thể thêm vào giỏ hàng. Bạn đã có ${currentQuantity} sản phẩm "${productInStore.name}" trong giỏ hàng (tối đa ${productInStore.stock}).`
        );
      }
      
      // Tự động điều chỉnh số lượng thêm vào tối đa có thể
      const adjustedQuantity = currentQuantity + availableToAdd;
      
      try {
        await axios.put(
          "http://localhost:5001/users/cart",
          {
            variantId,
            productId,
            name: product.name,
            color: product.color || "N/A",
            size: product.size || "N/A",
            quantity: adjustedQuantity,
            price: product.price,
            image: product.image,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        await dispatch("fetchCart");
        
        // Thông báo đã điều chỉnh số lượng - chỉ hiển thị thông báo đặc biệt khi số lượng bị điều chỉnh
        alert(`Đã thêm ${availableToAdd} sản phẩm vào giỏ hàng. Không thể thêm thêm vì sản phẩm "${productInStore.name}" chỉ còn ${productInStore.stock} sản phẩm trong kho.`);
        
      } catch (error) {
        console.error("Error adding to cart:", error);
        if (error.response && error.response.status === 401) {
          console.error("Token hết hạn hoặc không hợp lệ. Đang đăng xuất...");
          await dispatch("auth/logout", null, { root: true });
        }
        throw error;
      }
    } else {
      // Trường hợp bình thường, đủ tồn kho
      try {
        await axios.put(
          "http://localhost:5001/users/cart",
          {
            variantId,
            productId,
            name: product.name,
            color: product.color || "N/A",
            size: product.size || "N/A",
            quantity: totalQuantity,
            price: product.price,
            image: product.image,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        await dispatch("fetchCart");
      } catch (error) {
        console.error("Error adding to cart:", error);
        if (error.response && error.response.status === 401) {
          console.error("Token hết hạn hoặc không hợp lệ. Đang đăng xuất...");
          await dispatch("auth/logout", null, { root: true });
        }
        throw error;
      }
    }
  },
  async removeFromCart({ dispatch, rootGetters }, variantId) {
    const currentUser = rootGetters["auth/currentUser"];
    if (!currentUser) {
      console.warn("User not authenticated. Cannot remove from cart.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found. Please log in.");
      return;
    }

    try {
      await axios.delete(`http://localhost:5001/users/cart/${variantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await dispatch("fetchCart");
    } catch (error) {
      console.error("Error removing from cart:", error);
      if (error.response && error.response.status === 401) {
        console.error("Token hết hạn hoặc không hợp lệ. Đang đăng xuất...");
        await dispatch("auth/logout", null, { root: true });
      }
    }
  },
  async updateCartItem({ dispatch, rootGetters }, { variantId, quantity }) {
    const currentUser = rootGetters["auth/currentUser"];
    if (!currentUser) {
      console.warn("User not authenticated. Cannot update cart.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found. Please log in.");
      return;
    }

    // Lấy thông tin sản phẩm từ state
    const cartItems = this.state.cart.cartItems;
    const item = cartItems.find((i) => i.variantId === variantId);

    if (!item) {
      console.error("Item not found in cart");
      return;
    }

    // Đảm bảo productId là chuỗi đơn giản, không phải là đối tượng
    let productId = item.productId;
    if (productId && typeof productId === 'object') {
      productId = productId._id || productId.id || String(productId);
    }

    // Kiểm tra số lượng tồn kho
    const product = rootGetters["products/getProductById"](productId);
    if (product && quantity > product.stock) {
      throw new Error(
        `Không thể tăng thêm vì sản phẩm "${product.name}" chỉ còn ${product.stock} sản phẩm trong kho.`
      );
    }

    try {
      await axios.put(
        "http://localhost:5001/users/cart",
        {
          variantId,
          productId,
          name: item.name,
          color: item.color,
          size: item.size,
          quantity,
          price: item.price,
          image: item.image,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Chỉ cập nhật lại giỏ hàng sau khi API thành công
      await dispatch("fetchCart");
    } catch (error) {
      console.error("Error updating cart item:", error);
      if (error.response && error.response.status === 401) {
        console.error("Token hết hạn hoặc không hợp lệ. Đang đăng xuất...");
        await dispatch("auth/logout", null, { root: true });
      }
      throw error; // Ném lỗi để component có thể xử lý
    }
  },
  async clearCart({ dispatch, rootGetters }) {
    const currentUser = rootGetters["auth/currentUser"];
    if (!currentUser) {
      console.warn("User not authenticated. Cannot clear cart.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found. Please log in.");
      return;
    }

    try {
      await axios.delete("http://localhost:5001/users/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      await dispatch("fetchCart");
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error("Token hết hạn, cần đăng nhập lại:", error);
        await dispatch("auth/logout", null, { root: true });
      } else if (error.response && error.response.status === 404) {
        console.warn("Endpoint /users/cart not found. Clearing locally...");
        await dispatch("fetchCart");
      } else {
        console.error("Error clearing cart:", error);
      }
    }
  },
};

const getters = {
  cartItems: (state) => state.cartItems,
  cartTotalAmount: (state) =>
    state.cartItems.reduce(
      (total, item) => total + (item.price || 0) * item.quantity,
      0
    ),
  cartCount: (state) =>
    state.cartItems.reduce((count, item) => count + item.quantity, 0),
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
