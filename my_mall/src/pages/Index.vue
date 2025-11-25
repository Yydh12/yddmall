<template>
  <Navbar />
  <div class="home-container">
    <Search />

    <!-- 分类区、轮播图、个人信息 -->
    <div class="main-content-row" v-if="!isSearching">
      <Category />
      <div class="carousel-container">
        <Carousel />
      </div>
      <div class="user-card-container">
        <UserCard @open-coupon-dialog="openCouponDialogFromCard" />
      </div>
    </div>

    <!-- 商品展示区 -->
    <div class="recommendation-header" v-if="!isSearching">
      <div class="icon-circle"></div>
      <div class="text-content">
        <div class="title">猜你喜欢</div>
        <div class="subtitle">精选好物推荐</div>
      </div>
    </div>

    <!-- 搜索结果区域：根据搜索类型展示 -->
    <Products v-if="!isSearching || searchType === 'item'" />
    <StoreResult v-else-if="isSearching && searchType === 'shop'" />

    <!-- 页面级弹窗：可领取优惠券 -->
    <el-dialog v-model="couponDialogVisible" title="可领取优惠券" width="520px" :close-on-click-modal="true">
      <div v-if="couponLoading" style="padding: 12px 0;">
        <el-skeleton :rows="3" animated />
      </div>
      <div v-else>
        <div v-if="(availableCoupons || []).length === 0" style="color:#666; text-align:center; padding:16px;">暂无可领取优惠券</div>
        <div v-else class="coupon-list">
          <div class="coupon-item" v-for="c in availableCoupons" :key="c.id">
            <div class="coupon-main">
              <div class="coupon-title">{{ formatCouponLabel(c) }}</div>
              <div class="coupon-sub" v-if="c.minSpend && Number(c.minSpend) > 0">门槛：满 ¥{{ formatMoney(c.minSpend) }} 可用</div>
              <div class="coupon-sub" v-if="c.startTime || c.endTime">有效期：{{ formatPeriod(c.startTime, c.endTime) }}</div>
              <div class="coupon-sub" v-if="isCouponClaimed(c)">
                <el-tag type="success" size="small">已领</el-tag>
              </div>
            </div>
            <div class="coupon-actions">
              <el-button
                type="primary"
                size="small"
                :disabled="isCouponClaimed(c) || claimingCouponId === c.id"
                :loading="claimingCouponId === c.id"
                @click="claimCouponFromList(c)"
              >{{ isCouponClaimed(c) ? '已领' : '领取' }}</el-button>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="refreshCoupons" size="small">刷新</el-button>
        <el-button type="primary" @click="couponDialogVisible=false" size="small">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import Carousel from '@/components/Home/Carousel.vue';
import Category from '@/components/Home/Category.vue';
import Products from './Indexdown/Products.vue';
import StoreResult from './Indexdown/StoreResult.vue';
import UserCard from '@/components/Home/UserCard.vue';
import Navbar from '@/components/Home/Navbar.vue';
import Search from '@/components/Home/Search.vue';
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { listAvailableCoupons, claimCoupon, listMyCoupons } from '@/api/discount';

// 根据路由查询参数判断是否处于搜索态
const route = useRoute();
const isSearching = computed(() => {
  const q = route.query.q;
  const cidRaw = route.query.cid;
  const hasQ = typeof q === 'string' && q.trim().length > 0;
  const cidNum = Number(cidRaw);
  const hasCid = Number.isFinite(cidNum) && cidNum > 0;
  // 只要存在关键词或有效分类ID，即视为处于搜索页
  return hasQ || hasCid;
});

// 搜索类型：item 或 shop
const searchType = computed(() => {
  const t = route.query.type;
  return typeof t === 'string' && t.trim().length > 0 ? t : 'item';
});

// 页面级：平台优惠券弹窗逻辑
const couponDialogVisible = ref(false);
const couponLoading = ref(false);
const availableCoupons = ref([]);
const myCoupons = ref([]);
const claimingCouponId = ref(null);

// 判断优惠券是否已领取
const isCouponClaimed = (coupon) => {
  if (!coupon || !coupon.id) return false;
  
  // 检查我的优惠券列表中是否有相同id的优惠券
  return myCoupons.value.some(myCoupon => 
    myCoupon.couponId === coupon.id || myCoupon.id === coupon.id
  );
};

const openCouponDialogFromCard = async () => {
  couponDialogVisible.value = true;
  couponLoading.value = true;
  try {
    const [mine, avail] = await Promise.all([
      listMyCoupons(),
      listAvailableCoupons()
    ]);
    myCoupons.value = Array.isArray(mine?.data) ? mine.data : [];
    availableCoupons.value = Array.isArray(avail?.data) ? avail.data : [];
    console.log('myCoupons:', myCoupons.value);
    console.log('availableCoupons:', availableCoupons.value);
  } catch (e) {
    console.error('加载优惠券弹窗数据失败', e);
    availableCoupons.value = [];
  } finally {
    couponLoading.value = false;
  }
};

const refreshCoupons = async () => {
  couponLoading.value = true;
  try {
    const [avail, mine] = await Promise.all([
      listAvailableCoupons(),
      listMyCoupons()
    ]);
    availableCoupons.value = Array.isArray(avail?.data) ? avail.data : [];
    myCoupons.value = Array.isArray(mine?.data) ? mine.data : myCoupons.value;
  } catch (e) {
    console.error('加载优惠券数据失败', e);
    availableCoupons.value = [];
  } finally {
    couponLoading.value = false;
  }
};

async function claimCouponFromList(coupon) {
  if (!coupon || !coupon.id) return;
  
  try {
    claimingCouponId.value = coupon.id;
    const r = await claimCoupon(coupon.id);
    
    if (r && r.code === 200) {
      alert('领取成功');
      // 领取成功后刷新我的优惠券列表
      try {
        const mine = await listMyCoupons();
        myCoupons.value = Array.isArray(mine?.data) ? mine.data : myCoupons.value;
      } catch (refreshError) {
        console.error('刷新我的优惠券失败', refreshError);
      }
    } else {
      alert(r && r.message ? r.message : '领取失败，请稍后重试');
      // 即使领取失败也尝试刷新，以防状态不一致
      try {
        const mine = await listMyCoupons();
        myCoupons.value = Array.isArray(mine?.data) ? mine.data : myCoupons.value;
      } catch (refreshError) {
        console.error('刷新我的优惠券失败', refreshError);
      }
    }
  } catch (e) {
    alert('领取失败，请稍后重试');
  } finally {
    claimingCouponId.value = null;
  }
}

function formatMoney(n) {
  if (n == null) return '0.00';
  const num = Number(n);
  if (Number.isNaN(num)) return '0.00';
  return num.toFixed(2);
}

function formatPeriod(start, end) {
  const fmt = (v) => {
    if (!v) return '';
    try {
      return new Date(v).toLocaleDateString();
    } catch {
      return String(v);
    }
  };
  const s = fmt(start);
  const e = fmt(end);
  if (!s && !e) return '长期有效';
  if (s && e) return `${s} ~ ${e}`;
  return s || e;
}

function formatCouponLabel(c) {
  if (!c) return '优惠券';
  if (c.discountType === 1) {
    const amount = Number(c.discountValue || 0);
    return `¥${formatMoney(amount)} 优惠券`;
  }
  if (c.discountType === 2) {
    const percent = Number(c.discountValue || 0);
    const shown = Number.isFinite(percent) ? percent : 0;
    return `${shown}% 折扣券`;
  }
  return c.title || '优惠券';
}
</script>

<style scoped>
/* 原有的样式保持不变 */
.home-container {
  width: 95%;
  padding: 20px;
  min-width: 1200px;
  margin: 0 auto;
}

.header-row {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.logo img {
  height: 72px;
}

.main-content-row {
  display: flex;
  justify-content: center;
  gap: 5%;
}

.category-container {
  width: 268px;
  min-width: 268px;
  height: 400px;
  box-sizing: border-box;
  border: 1px solid #eee;
  padding: 10px;
  background-color: #fff;
  transform: translateZ(0);
  overflow: hidden;
}

.category-grid {
  display: flex;
  flex-direction: column;
  height: 85%;
  min-height: 340px;
  align-content: flex-start;
  justify-content: space-between;
  margin-top: 15px;
  width: 100%;
  overflow-y: auto;
}

.carousel-container {
  width: 700px;
  height: 400px;
  flex-shrink: 0;
}

.user-card-container {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.products-container {
  margin-top: 0px;
}

.recommendation-header {
  display: flex;
  justify-self: start;
  padding: 10px;
  width: 1350px;
  margin-left: -85px;
  margin: 0 auto;
}

.icon-circle {
  width: 40px;
  height: 40px;
  background-color: #fff1eb;
  background-size: 50%;
  background-repeat: no-repeat;
  background-position: center;
  border-radius: 50%;
  margin-right: 15px;
}

.text-content {
  display: flex;
  flex-direction: column;
}

.text-content .title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.text-content .subtitle {
  font-size: 14px;
  color: #666;
}

.coupon-list { 
  display: flex; 
  flex-direction: column; 
  gap: 10px; 
}

.coupon-item { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 10px 12px; 
  border: 1px dashed #e5e7eb; 
  border-radius: 8px; 
}

.coupon-title { 
  font-weight: 600; 
  color: #333; 
}

.coupon-sub { 
  color: #666; 
  font-size: 12px; 
  margin-top: 4px; 
}

.coupon-actions { 
  display: flex; 
  align-items: center; 
}
</style>
