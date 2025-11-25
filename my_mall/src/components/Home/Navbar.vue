<template>
  <div class="navbar">
    <div class="nav-links">
      <div class="left-links">
        <template v-if="loggedInUsername">
          <a href="/userInfo"><span>欢迎您，{{ loggedInUsername }}</span></a>
          <a href="#" @click.prevent="logout">退出登录</a>
        </template>
        <template v-else>
          <a href="/login">亲，请登录</a>
          <a href="/register">免费注册</a>
        </template>

      </div>
      <div class="right-links">
        <a href="#" @click.prevent="goToAwaitReview">已买到的宝贝</a>
        <a href="#" @click.prevent="goToCart">
          购物车
          <span v-if="cartCount > 0" class="cart-count">({{ cartCount }})</span>
        </a>
        <a href="#" @click.prevent="goToFavorites">收藏夹</a>
        <a href="#" @click.prevent="goToFootprints">我的足迹</a>
        <a href="#" @click.prevent="goToSellerCenter">免费开店</a>
        <a href="#" @click.prevent="goToSellerCenter">卖家中心</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { cartUtils } from '../../utils/cart';

const loggedInUsername = ref('');
const router = useRouter();
const user = JSON.parse(localStorage.getItem('user'));
const cartCount = ref(0);

const goToAwaitReview = () => {
  router.push({ path: '/orderTasks', query: { tab: 'awaitReview' } });
};

onMounted(async () => {
  if (user) {
    loggedInUsername.value = user.username;
  }
  
  // 初始化购物车数量
  await updateCartCount();
  
  // 设置定时器，定期更新购物车数量
  const cartCountInterval = setInterval(() => {
    updateCartCount();
  }, 30000); // 每30秒更新一次
  
  // 监听购物车变化事件
  window.addEventListener('cartUpdated', updateCartCount);
  
  // 清理函数
  return () => {
    clearInterval(cartCountInterval);
    window.removeEventListener('cartUpdated', updateCartCount);
  };
});

const updateCartCount = async () => {
  try {
    // 使用专门的获取数量方法（异步）
    cartCount.value = await cartUtils.getCartItemCount();
  } catch (error) {
    console.error('更新购物车数量失败:', error);
    cartCount.value = 0;
  }
};

const goToCart = () => {
  router.push('/cart');
};

const logout = () => {
  localStorage.removeItem('user');
  loggedInUsername.value = '';
  // 使用路由跳转替代全量刷新，减少状态丢失
  router.replace('/login');
};

const goToSellerCenter = () => {
  if (parseInt(user.roleId) === 3) {
    router.push('/store/home');
  } else {
    router.push('/openshop');
  }
};

const goToFavorites = () => {
  router.push('/favorites');
};

const goToFootprints = () => {
  router.push('/footprints');
};
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  min-width: 1200px; /* 添加最小宽度防止挤压 */
}

.nav-links {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 1300px; /* 限制最大宽度 */
  margin: 0 auto; /* 水平居中 */
}

.left-links,
.right-links {
  display: flex;
  gap: 10px;
  flex-wrap: nowrap; /* 防止链接换行 */
}
.nav-links a,
.left-links span {
  color: black;
  text-decoration: none;
  font-size: 12px; /* 缩小字体大小 */
}

.cart-count {
  color: #ff6b6b;
  font-weight: bold;
}
</style>