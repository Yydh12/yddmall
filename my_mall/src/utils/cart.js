import { ref } from 'vue';
import axios from '../axios';

// 购物车状态管理
const cartItems = ref([]);
const isLoading = ref(false);

// 购物车工具函数
export const cartUtils = {
  // 添加商品到购物车
  async addToCart(product) {
    try {
      const response = await axios.post('/cart', {
        itemId: product.itemId,
        skuId: product.skuId,
        quantity: product.quantity || 1
      });
      
      if (response.data.code === 200) {
        // 更新本地购物车数据
        await this.loadCart();
        // 触发购物车更新事件
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        return { success: true, message: '添加成功' };
      } else {
        return { success: false, message: response.data.message || '添加失败' };
      }
    } catch (error) {
      console.error('添加到购物车失败:', error);
      return { success: false, message: '添加到购物车失败，请稍后重试' };
    }
  },

  // 本地存储方式添加（已移除）
  addToLocalCart(product) {
    console.warn('本地存储功能已移除，请确保用户已登录');
    return { success: false, message: '请登录后添加商品到购物车' };
  },

  // 从购物车删除商品
  async removeFromCart(cartId) {
    try {
      const response = await axios.delete(`/cart/${cartId}`);
      if (response.data.code === 200) {
        await this.loadCart();
        return { success: true };
      }
    } catch (error) {
      console.error('从购物车删除失败:', error);
      return { success: false, message: '删除失败，请稍后重试' };
    }
  },

  // 更新购物车商品数量
  async updateQuantity(cartId, quantity) {
    try {
      const response = await axios.put(`/cart/${cartId}`, { quantity });
      if (response.data.code === 200) {
        await this.loadCart();
        return { success: true };
      }
    } catch (error) {
      console.error('更新数量失败:', error);
      return { success: false, message: '更新数量失败，请稍后重试' };
    }
  },

  // 加载购物车数据
  async loadCart() {
    console.log('开始加载购物车数据...');
    isLoading.value = true;
    
    try {
      console.log('尝试从API获取购物车数据...');
      const response = await axios.get('/cart');
      console.log('购物车API响应:', response.data);
      
      if (response.data.code === 200) {
        cartItems.value = response.data.data;
        console.log('购物车数据加载成功:', cartItems.value.length, '个商品');
      } else if (response.data.code === 401) {
        // 用户未登录，购物车为空
        console.log('用户未登录，购物车为空');
        cartItems.value = [];
      } else {
        console.error('购物车数据加载失败:', response.data.message);
        cartItems.value = [];
      }
    } catch (error) {
      console.error('获取购物车数据错误:', error);
      console.error('错误详情:', error.response?.data || error.message);
      cartItems.value = [];
    } finally {
      isLoading.value = false;
    }
  },

  // 获取购物车商品数量
  async getCartItemCount() {
    try {
      console.log('开始获取购物车数量...');
      const response = await axios.get('/cart/count');
      console.log('购物车数量API响应:', response.data);
      
      if (response.data.code === 200) {
        return response.data.data;
      } else if (response.data.code === 401) {
        // 用户未登录，购物车为空
        console.log('用户未登录，购物车为空');
        return 0;
      } else {
        console.error('获取购物车数量失败:', response.data.message);
        return 0;
      }
    } catch (error) {
      console.error('获取购物车数量错误:', error);
      return 0;
    }
  },

  // 清空购物车
  async clearCart() {
    try {
      const response = await axios.delete('/cart/clear');
      if (response.data.code === 200) {
        cartItems.value = [];
        localStorage.removeItem('cart');
        return { success: true };
      }
    } catch (error) {
      console.error('清空购物车失败:', error);
      return { success: false, message: '清空购物车失败，请稍后重试' };
    }
  },

  // 本地存储相关方法（已移除）
  getLocalCart() {
    console.warn('本地存储功能已移除');
    return [];
  },

  saveLocalCart(cart) {
    console.warn('本地存储功能已移除');
  },

  // 检查商品是否已存在购物车中
  isInCart(itemId, skuId) {
    return cartItems.value.some(item => item.itemId === itemId && item.skuId === skuId);
  },

  // 获取购物车中商品的总价格
  getCartTotal() {
    return cartItems.value.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
};

// 购物车状态
export const cartState = {
  cartItems,
  isLoading
};

export default {
  cartUtils,
  cartState
};