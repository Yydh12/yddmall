<template>
  <div class="cart-container">
    <Navbar />
    <div class="cart-content">
      <div class="cart-header">
        <h1>我的购物车</h1>
        <span class="cart-count">({{ cartItems.length }}件商品)</span>
      </div>

      <!-- 购物车为空时显示 -->
      <div v-if="cartItems.length === 0" class="empty-cart">
        <div class="empty-icon">
          <i class="fa fa-shopping-cart"></i>
        </div>
        <p class="empty-text">购物车还是空的，快去添加商品吧！</p>
        <router-link to="/" class="go-shopping-btn">
          去购物
        </router-link>
      </div>

      <!-- 购物车有商品时显示 -->
      <div v-else class="cart-main">
        <!-- 购物车商品列表 -->
        <div class="cart-items">
          <div class="cart-item" v-for="item in cartItems" :key="item.cartId" :class="{ offline: item.isOffline }">
            <div class="item-select">
              <el-checkbox 
                v-model="item.selected" 
                @change="updateItemSelection(item)"
              ></el-checkbox>
            </div>
            
            <div class="item-image">
              <img :src="item.productImage || `https://picsum.photos/80/80?random=${item.cartId}`" 
                   :alt="item.productName" 
                   @error="handleImageError">
            </div>
            
            <div class="item-info">
              <h3 class="product-name">
                {{ item.productName }}
                <el-tag v-if="item.isOffline" class="offline-tag" type="danger" size="small">已下架</el-tag>
              </h3>
              <p class="product-sku">{{ item.skuName }}</p>
              <p class="product-price">¥{{ item.price.toFixed(2) }}</p>
            </div>
            
            <div class="item-quantity">
              <el-input-number 
                v-model="item.quantity" 
                :min="1" 
                :max="item.stock"
                @change="updateQuantity(item)"
                size="small"
                :disabled="item.isOffline"
              ></el-input-number>
            </div>
            
            <div class="item-total">
              ¥{{ (item.price * item.quantity).toFixed(2) }}
            </div>
            
            <div class="item-action">
            <el-button 
              type="danger" 
              size="small" 
              @click="removeItem(item)"
              :icon="Delete"
            >删除</el-button>
          </div>
        </div>
        </div>

        <!-- 购物车底部结算栏 -->
        <div class="cart-footer">
          <div class="footer-left">
            <el-checkbox 
              v-model="selectAll"
            >全选</el-checkbox>
            <el-button 
              link 
              @click="removeSelected"
              :disabled="selectedItems.length === 0"
            >删除选中商品</el-button>
            <el-button 
              link 
              @click="selectOfflineItems"
              :disabled="(cartItems || []).every(i => !i.isOffline)"
            >选中已下架商品</el-button>
            <el-button 
              link 
              @click="removeOfflineItems"
              :disabled="(cartItems || []).every(i => !i.isOffline)"
            >删除已下架商品</el-button>
          </div>
          
          <div class="footer-right">
            <div class="summary">
              <span>已选 {{ selectedItems.length }} 件商品</span>
              <span class="total-price">总计：¥{{ totalPrice.toFixed(2) }}</span>
            </div>
            <el-button 
              type="primary" 
              size="large" 
              @click="goToCheckout"
              :disabled="selectedItems.length === 0"
            >去结算</el-button>
            <el-button 
              type="danger" 
              size="large" 
              @click="clearCart"
              :disabled="(cartItems || []).length === 0"
            >清空购物车</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete } from '@element-plus/icons-vue';
import Navbar from '../components/Home/Navbar.vue';
import axios from '../axios';
import { cartUtils } from '../utils/cart.js';
import avatarUrl from '@/assets/images/avatar.png';

const router = useRouter();
const cartItems = ref([]);

// 后端通过会话识别用户，前端不传递 userId

// 计算属性
const selectedItems = computed(() => {
  return cartItems.value.filter(item => item.selected);
});

const totalPrice = computed(() => {
  return selectedItems.value.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
});

const selectAll = computed({
  get: () => {
    if (cartItems.value.length === 0) return false;
    return cartItems.value.every(item => item.selected);
  },
  set: (value) => {
    console.log('全选setter被调用，新值:', value);
    cartItems.value.forEach(item => {
      item.selected = value;
    });
    console.log('全选setter完成，商品数量:', cartItems.value.length);
  }
});

// 方法
const loadCartItems = async () => {
  try {
    console.log('购物车页面开始加载数据...');
    const response = await axios.get('/cart');
    console.log('购物车页面API响应:', response.data);
    
    if (response.data.code === 200) {
        cartItems.value = response.data.data.map(item => ({
          ...item,
          selected: false, // 默认不选中
          isOffline: false // 默认可用，后续状态自检更新
        }));
        console.log('购物车页面成功加载数据:', cartItems.value.length, '个商品');
        // 调试：检查每个商品的图片信息
        cartItems.value.forEach((item, index) => {
          console.log(`商品${index + 1}:`, {
            productName: item.productName,
            productImage: item.productImage,
            hasImage: !!item.productImage,
            imageUrl: item.productImage || '无'
          });
        });
        // 加载后进行商品状态自检（判断是否下架或不存在）
        await checkItemStatuses();
      } else if (response.data.code === 401) {
        // 用户未登录，购物车为空
        console.log('用户未登录，购物车为空');
        ElMessage.info('请先登录以获取完整的购物车功能');
        cartItems.value = [];
      } else {
        console.error('购物车页面加载失败:', response.data.message);
        ElMessage.error(response.data.message || '获取购物车数据失败');
        cartItems.value = [];
      }
  } catch (error) {
      console.error('购物车页面获取数据错误:', error);
      console.error('错误详情:', error.response?.data || error.message);
      ElMessage.error('网络错误，购物车为空');
      cartItems.value = [];
    }
};

// 本地存储相关函数已移除

const updateItemSelection = (item) => {
  // 商品选择状态变更 - 可以在这里添加额外的逻辑
  console.log('商品选择状态变更:', item.productName, item.selected);
  // 检查全选状态是否需要更新
  console.log('当前全选状态:', selectAll.value);
};

const updateQuantity = async (item) => {
  try {
    // 按后端约定：PUT /cart/{cartId}/quantity，使用请求参数 quantity
    await axios.put(`/cart/${item.cartId}/quantity`, null, { params: { quantity: item.quantity } });
  } catch (error) {
    console.error('更新数量失败:', error);
    ElMessage.error('更新数量失败');
  }
};

const removeItem = async (item) => {
  try {
    await ElMessageBox.confirm('确定要删除这个商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    // 调用API删除
    await axios.delete(`/cart/${item.cartId}`);
    
    // 从列表中移除
    const index = cartItems.value.findIndex(cartItem => cartItem.cartId === item.cartId);
    if (index > -1) {
      cartItems.value.splice(index, 1);
    }
    
    ElMessage.success('删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除商品失败:', error);
      ElMessage.error('删除商品失败');
    }
  }
};

// 全选功能已通过计算属性的setter实现，不需要额外的方法

const removeSelected = async () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请先选择要删除的商品');
    return;
  }

  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedItems.value.length} 个商品吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    // 使用后端批量删除接口 /cart/batch?cartIds=1,2,3
    const ids = selectedItems.value.map(i => i.cartId).join(',');
    await axios.delete(`/cart/batch`, { params: { cartIds: ids } });

    // 从列表中移除选中的商品
    cartItems.value = cartItems.value.filter(item => !item.selected);
    ElMessage.success('删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error);
      ElMessage.error('批量删除失败');
    }
  }
};

const goToCheckout = () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请先选择要结算的商品');
    return;
  }

  console.log('去结算按钮被点击，选中商品数量:', selectedItems.value.length);
  console.log('选中的商品:', selectedItems.value);
  
  // 将选中的商品信息存储到sessionStorage，用于结算页面
  sessionStorage.setItem('checkoutItems', JSON.stringify(selectedItems.value));
  console.log('商品数据已保存到sessionStorage');
  
  // 尝试使用不同的导航方式
  console.log('当前路由器实例:', router);
  console.log('可用的路由:', router.getRoutes());
  
  try {
    // 使用命名路由或直接路径
    router.push({ path: '/checkout' });
    console.log('路由跳转已触发');
  } catch (error) {
    console.error('路由跳转失败:', error);
    ElMessage.error('跳转失败，请重试');
    // 回退方案：使用 replace 避免全量刷新
    try { router.replace('/checkout'); } catch {}
  }
};

// 图片加载容错
const handleImageError = (event) => {
  event.target.src = avatarUrl;
};

// 商品状态自检：根据 itemId 调用 /item/{id} 判断是否下架或不存在
const checkItemStatuses = async () => {
  try {
    const ids = [...new Set((cartItems.value || []).map(i => i.itemId).filter(Boolean))];
    if (!ids.length) return;
    const statusMap = {};
    const tasks = ids.map(id => axios.get(`/item/${id}`)
      .then(res => {
        if (res?.data?.code === 200 && res.data.data) {
          statusMap[id] = Number(res.data.data.status || 0); // 1: 在售，其它：非在售
        } else {
          statusMap[id] = -1; // 标记不存在或异常
        }
      })
      .catch(() => { statusMap[id] = -1; }));
    await Promise.all(tasks);
    (cartItems.value || []).forEach(i => {
      const s = statusMap[i.itemId];
      i.isOffline = s === undefined ? false : (s !== 1);
    });
  } catch (e) {
    console.warn('商品状态自检失败：', e?.response?.data || e);
  }
};

// 选中所有已下架商品
const selectOfflineItems = () => {
  (cartItems.value || []).forEach(i => { if (i.isOffline) i.selected = true; });
};

// 删除所有已下架商品
const removeOfflineItems = async () => {
  const offline = (cartItems.value || []).filter(i => i.isOffline);
  if (!offline.length) { ElMessage.info('暂无已下架商品'); return; }
  try {
    await ElMessageBox.confirm(`确定删除 ${offline.length} 个已下架商品吗？`, '提示', { type: 'warning' });
  } catch { return; }
  // 使用后端批量删除接口
  const ids = offline.map(i => i.cartId).join(',');
  await axios.delete(`/cart/batch`, { params: { cartIds: ids } });
  const ok = offline.length;
  cartItems.value = cartItems.value.filter(i => !i.isOffline);
  ElMessage.success(`已删除 ${ok} 个已下架商品`);
};

// 清空购物车
const clearCart = async () => {
  if ((cartItems.value || []).length === 0) { ElMessage.info('购物车已为空'); return; }
  try {
    await ElMessageBox.confirm('确定要清空购物车吗？此操作不可撤销。', '清空购物车', { type: 'warning' });
  } catch { return; }
  try {
    const res = await axios.delete('/cart/clear');
    const ok = res?.data?.code === 200 && (res.data?.data === true || res.data?.data === 1);
    if (ok) {
      cartItems.value = [];
      ElMessage.success('购物车已清空');
    } else if (res?.data?.code === 401) {
      ElMessage.warning('请先登录后再操作');
    } else {
      ElMessage.error(res?.data?.message || '清空购物车失败');
    }
  } catch (e) {
    console.error('清空购物车失败:', e);
    ElMessage.error('清空购物车失败');
  }
};

// 生命周期
onMounted(() => {
  loadCartItems();
});
</script>

<style scoped>
.cart-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px 0;
}

.cart-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.cart-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
  background: white;
  padding: 25px 30px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8e8e8;
}

.cart-header h1 {
  font-size: 28px;
  color: #2c3e50;
  font-weight: 600;
  margin: 0;
}

.cart-count {
  color: #7f8c8d;
  font-size: 16px;
  background: #ecf0f1;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 500;
}

.empty-cart {
  text-align: center;
  padding: 120px 0;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid #e8e8e8;
}

.empty-icon {
  font-size: 100px;
  color: #bdc3c7;
  margin-bottom: 25px;
  opacity: 0.7;
}

.empty-text {
  font-size: 18px;
  color: #7f8c8d;
  margin-bottom: 35px;
  font-weight: 400;
}

.go-shopping-btn {
  display: inline-block;
  padding: 15px 40px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  text-decoration: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
  border: none;
}

.go-shopping-btn:hover {
  background: linear-gradient(135deg, #2980b9 0%, #3498db 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
}

.cart-main {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid #e8e8e8;
}

.cart-items {
  padding: 0;
}

.cart-item {
  display: flex;
  align-items: center;
  padding: 25px 30px;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  position: relative;
  background: white;
}

.cart-item:hover {
  background: #fafbfc;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

/* 已下架样式提示 */
.cart-item.offline {
  opacity: 0.7;
  background: #fff7f7;
}
.product-name .offline-tag {
  margin-left: 8px;
}

.cart-item:last-child {
  border-bottom: none;
}

.item-select {
  width: 50px;
  text-align: center;
}

/* 复选框样式优化 */
.item-select {
  margin-right: 10px;
}

/* 数量选择器样式优化 */
.item-quantity .el-input-number {
  width: 100%;
}

.item-quantity .el-input-number__decrease,
.item-quantity .el-input-number__increase {
  background: #f8f9fa;
  border: 1px solid #e8e8e8;
  transition: all 0.3s ease;
}

.item-quantity .el-input-number__decrease:hover,
.item-quantity .el-input-number__increase:hover {
  background: #e8e8e8;
  color: #3498db;
}

.item-image {
  width: 100px;
  height: 100px;
  margin-right: 25px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid white;
}

.item-image:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.item-info {
  flex: 1;
  margin-right: 25px;
}

.product-name {
  font-size: 18px;
  color: #2c3e50;
  margin-bottom: 10px;
  font-weight: 500;
  line-height: 1.4;
}

.product-sku {
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 12px;
  background: #f8f9fa;
  padding: 6px 12px;
  border-radius: 20px;
  display: inline-block;
  font-weight: 400;
}

.product-price {
  font-size: 20px;
  color: #e74c3c;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.item-quantity {
  width: 140px;
  margin-right: 25px;
}

/* 数量选择器样式 */
.item-quantity {
  width: 140px;
  margin-right: 25px;
}

.item-total {
  width: 120px;
  text-align: right;
  font-size: 20px;
  color: #e74c3c;
  font-weight: 700;
  margin-right: 25px;
  letter-spacing: -0.5px;
}

.item-action {
  width: 90px;
}

/* 结算按钮样式 */
.cart-footer .el-button--primary {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border: none;
  border-radius: 25px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.cart-footer .el-button--primary:hover {
  background: linear-gradient(135deg, #2980b9 0%, #3498db 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
}

/* 删除按钮美化 */
.item-action .el-button--danger {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
}

.item-action .el-button--danger:hover {
  background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
}



.cart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-top: 1px solid #dee2e6;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 25px;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 25px;
}

.summary {
  text-align: right;
}

.total-price {
  font-size: 24px;
  color: #e74c3c;
  font-weight: 700;
  margin-left: 15px;
  letter-spacing: -0.5px;
}

/* 页脚链接按钮样式 */
.cart-footer .el-button[link] {
  color: #7f8c8d;
  font-weight: 500;
  transition: all 0.3s ease;
}

.cart-footer .el-button[link]:hover {
  color: #e74c3c;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .cart-container {
    padding: 10px 0;
  }
  
  .cart-content {
    padding: 10px;
  }
  
  .cart-header {
    padding: 20px;
    margin-bottom: 20px;
  }
  
  .cart-header h1 {
    font-size: 24px;
  }
  
  .cart-item {
    flex-wrap: wrap;
    gap: 15px;
    padding: 20px;
  }
  
  .item-info {
    order: 2;
    flex-basis: 100%;
    margin-right: 0;
  }
  
  .item-quantity {
    order: 3;
    width: 120px;
  }
  
  .item-total {
    order: 4;
    width: 100px;
  }
  
  .item-image {
    width: 80px;
    height: 80px;
    margin-right: 15px;
  }
  
  .cart-footer {
    flex-direction: column;
    gap: 20px;
    padding: 20px;
  }
  
  .footer-right {
    width: 100%;
    justify-content: space-between;
  }
}
</style>