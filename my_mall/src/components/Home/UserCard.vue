<template>
  <div class="user-card">
    <!-- 用户信息区域 -->
    <div class="user-info">
      <div class="avatar-container">
        <img class="avatar" :src="user.avatar || defaultAvatar" alt="用户头像" />
        <span class="online-indicator"></span>
      </div>
      <div class="details">
        <a href="/userInfo" class="name-link">
          <h3 class="name">{{ user.username || user.userNo || '游客' }}</h3>
        </a>
        <div class="actions">
          <a href="#" class="action-link" @click.prevent="goToFavorites">关注店铺</a>
          <span class="separator">|</span>
          <a href="/userInfo" class="action-link">收货地址</a>
        </div>
      </div>
    </div>

    <!-- 订单状态区域 -->
    <div class="order-status">
      <a href="#" class="status-item" @click.prevent="goToCart">
        <span class="count">{{ cartCount }}</span>
        <span>购物车</span>
      </a>
      <a href="#" class="status-item" @click.prevent="goToAwaitReceipt">
        <span class="count">{{ shippedCount }}</span>
        <span>待收货</span>
      </a>
      <a href="#" class="status-item" @click.prevent="goToAwaitShipment">
        <span class="count">{{ paidCount }}</span>
        <span>待发货</span>
      </a>
      <a href="#" class="status-item" @click.prevent="goToPendingPayment">
        <span class="count">{{ pendingPaymentCount }}</span>
        <span>待付款</span>
      </a>
      <a href="#" class="status-item" @click.prevent="goToAwaitReview">
        <span class="count">0</span>
        <span>待评价</span>
      </a>
    </div>

    <!-- 资产区域 -->
    <div class="my-assets">
      <div class="asset-links">
        <a href="#" class="asset-item" @click.prevent="goToMyDiscounts('red')">
          <span class="count">¥{{ highestRedPacketYuan }}</span>
          <span>红包</span>
        </a>
        <a href="#" class="asset-item" @click.prevent="goToMyDiscounts('coupon')">
          <span class="count">{{ couponCount }}张</span>
          <span>优惠券</span>
        </a>
        <a href="#" class="asset-item" @click.prevent="doCoinSignin">
          <span class="count">¥{{ coinYuan }}</span>
          <span>金币抵现</span>
        </a>
      </div>
      
      <!-- 平台优惠券领取区：点击弹窗展示可领取优惠券，按钮立即领取当前展示优惠券 -->
      <div class="red-packet" @click="openCouponDialog">
        <div class="red-packet-inner">
          <img src="@/assets/images/usercard/money.png" class="red-packet-icon" />
          <div class="red-packet-info">
            <div class="amount">{{ featuredLabel }}</div>
            <div class="expiry">点击查看可领取优惠券</div>
          </div>
          <button class="claim-btn" @click.stop="claimCurrentCoupon">立即领取</button>
        </div>
      </div>

      <!-- 页面级弹窗：已迁移到 Index.vue，通过事件触发 -->
    </div>

    <!-- 服务区域 -->
    <div class="my-services">
      <div class="service-links">
        <a href="#"  @click.prevent="goToAwaitReview" class="service-item">
          <div class="service-icon">
            <img src="@/assets/images/usercard/card1.png" alt="已买到" />
          </div>
          <span>已买到</span>
        </a>
        <a href="#" class="service-item" @click.prevent="goToFavorites">
          <div class="service-icon">
            <img src="@/assets/images/usercard/card2.png" alt="收藏夹" />
          </div>
          <span>收藏夹</span>
        </a>
        <a href="#" @click.prevent="goToAwaitReview" class="service-item">
          <div class="service-icon">
            <img src="@/assets/images/usercard/card3.png" alt="买过的" />
          </div>
          <span>买过的</span>
        </a>
        <a href="#" class="service-item" @click.prevent="goToFootprints">
          <div class="service-icon">
            <img src="@/assets/images/usercard/card4.png" alt="足迹" />
          </div>
          <span>足迹</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import { cartUtils } from '@/utils/cart';
import { getOrderStatistics } from '@/api/order';
import { listAvailableCoupons, claimCoupon, getCoinWallet, dailySignIn, getDiscountStats, listMyRedPacketsFiltered } from '@/api/discount';

const user = JSON.parse(localStorage.getItem('user') || '{}');
const defaultAvatar = 'https://picsum.photos/200/200?random=1';

const router = useRouter();
const cartCount = ref(0);
const pendingPaymentCount = ref(0);
const paidCount = ref(0);
const shippedCount = ref(0);

// 资产区域：优惠券数量、红包余额（元）、金币余额（枚）
const couponCount = ref(0);
const redPacketBalance = ref(0);
const coinBalance = ref(0);
// 我的未使用红包中的最高金额
const topUnusedRedPacketAmount = ref(0);
const redPacketYuan = computed(() => {
  try { return Number(redPacketBalance.value || 0).toFixed(2); } catch { return '0.00'; }
});
const highestRedPacketYuan = computed(() => {
  try { return Number(topUnusedRedPacketAmount.value || 0).toFixed(2); } catch { return '0.00'; }
});
const coinYuan = computed(() => {
  try { return (Number(coinBalance.value || 0) / 1000).toFixed(2); } catch { return '0.00'; }
});

const updateCartCount = async () => {
  try {
    cartCount.value = await cartUtils.getCartItemCount();
  } catch (error) {
    console.error('更新购物车数量失败:', error);
    cartCount.value = 0;
  }
};

const goToCart = () => {
  router.push('/cart');
};

// 跳转到订单任务页并激活对应标签
const goToPendingPayment = () => {
  router.push({ path: '/orderTasks', query: { tab: 'pendingPayment' } });
};
const goToAwaitShipment = () => {
  router.push({ path: '/orderTasks', query: { tab: 'awaitShipment' } });
};
const goToAwaitReceipt = () => {
  router.push({ path: '/orderTasks', query: { tab: 'awaitReceipt' } });
};
const goToAwaitReview = () => {
  router.push({ path: '/orderTasks', query: { tab: 'awaitReview' } });
};

// 平台优惠券：弹窗与立即领取当前展示优惠券
const availableCoupons = ref([]);
const couponLoading = ref(false);
// 弹窗由父页面控制
const emit = defineEmits(['open-coupon-dialog']);

// 选择“最优券”：按预期优惠额（在门槛金额处）降序，门槛升序，快到期优先
function getMinSpend(c) {
  const v = Number(c?.minSpend ?? c?.threshold ?? 0);
  return Number.isFinite(v) && v > 0 ? v : 0;
}
function getDiscountRate(c) {
  if (c?.discountType !== 2) return null;
  let rate = Number(c?.discountValue ?? 0);
  if (!Number.isFinite(rate)) return null;
  // 兼容 80/0.8 两种写法
  if (rate > 1) rate = rate / 100;
  // 合法折扣区间 (0,1)
  if (rate <= 0 || rate >= 1) return null;
  return rate;
}
function estimateSavings(c) {
  const type = c?.discountType;
  if (type === 1) {
    const amt = Number(c?.discountValue ?? 0);
    return Number.isFinite(amt) && amt > 0 ? amt : 0;
  }
  if (type === 2) {
    const spend = getMinSpend(c) || 100; // 无门槛时用基准 100
    const rate = getDiscountRate(c);
    if (rate == null) return 0;
    return spend * (1 - rate);
  }
  return 0;
}
function getEndTs(c) {
  const v = c?.endTime;
  const t = v ? Date.parse(v) : NaN;
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
}
const featuredCoupon = computed(() => {
  const list = availableCoupons.value || [];
  if (!list.length) return null;
  const sorted = [...list].sort((a, b) => {
    const sa = estimateSavings(a);
    const sb = estimateSavings(b);
    if (sb !== sa) return sb - sa;                 // 优惠额大者优先
    const ma = getMinSpend(a);
    const mb = getMinSpend(b);
    if (ma !== mb) return ma - mb;                 // 门槛更低者优先
    const ea = getEndTs(a);
    const eb = getEndTs(b);
    if (ea !== eb) return ea - eb;                 // 更快到期者优先
    return String(b?.title || '').localeCompare(String(a?.title || ''));
  });
  return sorted[0] || null;
});
const featuredLabel = computed(() => {
  const c = featuredCoupon.value;
  if (!c) return '平台优惠券';
  if (c.discountType === 1) {
    const amount = Number(c.discountValue || 0);
    return `¥${formatMoney(amount)} 优惠券`;
  }
  if (c.discountType === 2) {
    const percent = Number(c.discountValue || 0);
    const shown = Number.isFinite(percent) ? percent : 0;
    return `${shown}% 折扣券`;
  }
  return c.title || '平台优惠券';
});

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

async function loadAvailableCoupons() {
  couponLoading.value = true;
  try {
    const res = await listAvailableCoupons();
    console.log('原始响应:', res);
    availableCoupons.value = (res && res.data) || [];
  } catch (e) {
    console.error('加载可领取优惠券失败', e);
    availableCoupons.value = [];
  } finally {
    couponLoading.value = false;
  }
}

// 加载未使用红包并计算最高金额（过滤有效期）
async function loadTopUnusedRedPacket() {
  try {
    const resp = await listMyRedPacketsFiltered({ status: 0 });
    const list = (resp && resp.data) || [];
    const now = Date.now();
    const validUnused = list.filter((x) => {
      const st = x?.startTime ? Date.parse(x.startTime) : null;
      const et = x?.endTime ? Date.parse(x.endTime) : null;
      const statusOk = Number(x?.status) === 0;
      const startOk = st == null || (Number.isFinite(st) && st <= now);
      const endOk = et == null || (Number.isFinite(et) && et >= now);
      return statusOk && startOk && endOk;
    });
    const maxAmt = validUnused.reduce((m, x) => {
      const amt = Number(x?.amount ?? 0);
      return Number.isFinite(amt) && amt > m ? amt : m;
    }, 0);
    topUnusedRedPacketAmount.value = maxAmt;
  } catch (e) {
    console.error('加载未使用红包失败:', e);
    topUnusedRedPacketAmount.value = 0;
  }
}

function openCouponDialog() {
  // 交由父页面打开弹窗，父页面自行拉取列表
  emit('open-coupon-dialog');
}

async function claimCurrentCoupon() {
  const c = featuredCoupon.value;
  if (!c) {
    alert('暂无可领取的优惠券');
    return;
  }
  try {
    const r = await claimCoupon(c.id || c.couponId);
    if (r && r.code === 200) {
      alert('领取成功');
      availableCoupons.value = availableCoupons.value.filter((x) => (x.id || x.couponId) !== (c.id || c.couponId));
      await loadAssets();
    } else {
      alert(r && r.message ? r.message : '领取失败，请稍后重试');
    }
  } catch (e) {
    alert('领取失败，请稍后重试');
  }
}

// 领取列表中的优惠券与刷新操作由父页面的弹窗负责

// 跳转收藏夹/足迹
const goToFavorites = () => { router.push('/favorites') }
const goToFootprints = () => { router.push('/footprints') }

// 跳转到“我的优惠”页，默认筛选未使用
const goToMyDiscounts = (tab) => {
  router.push({ path: '/myDiscounts', query: { status: '0', tab } })
}

// 点击“金币抵现”：随机签到约300金币，并展示余额与可抵金额（1000金币/元）
const doCoinSignin = async () => {
  try {
    const before = await getCoinWallet();
    const beforeBalance = Number(before?.data?.balance || 0);

    // 随机签到区间：280 ~ 320（约300）
    const gainTarget = Math.floor(280 + Math.random() * 41);
    const afterResp = await dailySignIn(gainTarget);
    const afterBalance = Number(afterResp?.data?.balance ?? beforeBalance);
    const gained = Math.max(0, afterBalance - beforeBalance);

    // 更新前端金币余额显示
    coinBalance.value = afterBalance;

    // 可抵金额：按 1000 金币 = 1 元 计算（仅展示）
    const canDeductYuan = (afterBalance / 1000).toFixed(2);

    if (gained > 0) {
      alert(`签到成功，获得 ${gained} 金币！\n当前金币：${afterBalance} 枚，可抵约 ¥${canDeductYuan}（1000 金币/元）`);
    } else {
      alert(`今日已签到或余额未变化。\n当前金币：${afterBalance} 枚，可抵约 ¥${canDeductYuan}（1000 金币/元）`);
    }
  } catch (e) {
    console.error('金币签到失败：', e);
    alert('签到失败，请稍后重试');
  }
}

// 加载优惠资产统计与金币钱包
const loadAssets = async () => {
  try {
    const [statsResp, walletResp] = await Promise.all([
      getDiscountStats(),
      getCoinWallet()
    ]);
    const stats = statsResp?.data || {};
    couponCount.value = Number(stats?.couponCount || 0);
    const rb = stats?.redPacketBalance;
    redPacketBalance.value = rb == null ? 0 : Number(rb);
    coinBalance.value = Number(walletResp?.data?.balance || 0);
  } catch (e) {
    console.error('加载资产统计失败:', e);
    couponCount.value = 0;
    redPacketBalance.value = 0;
  }
}

onMounted(async () => {
  await updateCartCount();
  try {
    const res = await getOrderStatistics();
    const stats = res && res.data ? res.data : {};
    pendingPaymentCount.value = stats.pendingPaymentCount || 0;
    paidCount.value = stats.paidCount || 0;        // 待发货 = 已支付
    shippedCount.value = stats.shippedCount || 0;  // 待收货 = 已发货
  } catch (error) {
    console.error('获取订单统计失败:', error);
    pendingPaymentCount.value = 0;
    paidCount.value = 0;
    shippedCount.value = 0;
  }
  // 加载资产区域实时数据
  await loadAssets();
  // 加载我的未使用红包的最高金额
  await loadTopUnusedRedPacket();
  // 预加载可领取优惠券用于展示当前券
  await loadAvailableCoupons();
  window.addEventListener('cartUpdated', updateCartCount);
});

onUnmounted(() => {
  window.removeEventListener('cartUpdated', updateCartCount);
});
</script>

<style scoped>
/* 基础样式 */
.user-card {
  width: 100%;
  min-width: 260px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
}

.user-card:hover {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

/* 用户信息区域 */
.user-info {
  display: flex;
  align-items: center;
  padding: 20px 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%);
}

.avatar-container {
  position: relative;
}

.avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.avatar:hover {
  transform: scale(1.05);
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #52c41a;
  border: 2px solid #fff;
}

.details {
  margin-left: 16px;
  flex: 1;
}

.name-link {
  text-decoration: none;
}

.name {
  font-size: 19px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 6px;
  transition: color 0.2s ease;
}

.name-link:hover .name {
  color: #409eff;
}

.actions {
  font-size: 13px;
  display: flex;
  align-items: center;
}

.action-link {
  color: #409eff;
  text-decoration: none;
  padding: 2px 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.action-link:hover {
  background-color: rgba(64, 158, 255, 0.1);
}

.separator {
  margin: 0 8px;
  color: #ddd;
}

/* 订单状态区域 */
.order-status {
  display: flex;
  padding: 16px 8px;
  border-bottom: 1px solid #f5f5f5;
}

.status-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #666;
  padding: 8px 0;
  border-radius: 8px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.status-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background-color: #409eff;
  transition: width 0.3s ease;
}

.status-item:hover {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.05);
}

.status-item:hover::after {
  width: 100%;
}

.status-item .count {
  font-size: 17px;
  font-weight: 600;
  color: #333;
  margin-bottom: 3px;
}

.status-item:hover .count {
  color: #409eff;
}

/* 资产区域 */
.my-assets {
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.asset-links {
  display: flex;
  margin-bottom: 16px;
}

.asset-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #666;
  padding: 10px 0;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.asset-item:hover {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.05);
}

.asset-item .count {
  font-size: 18px;
  font-weight: 600;
  color: #ff7d00;
  margin-bottom: 4px;
  position: relative;
}

.asset-item:hover .count {
  transform: scale(1.05);
}

/* 红包区域 */
.red-packet {
  margin-top: 8px;
}

.red-packet-inner {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #fff8f0 0%, #fff1e0 100%);
  border-radius: 12px;
  border: 1px solid #fff0e0;
  transition: all 0.2s ease;
}

.red-packet:hover .red-packet-inner {
  background: linear-gradient(135deg, #fff1e0 0%, #ffe8cc 100%);
  transform: translateX(2px);
}

.red-packet-icon {
  width: 30px;
  height: 40px;
  margin-right: 12px;
  flex-shrink: 0;
  animation: float 2s infinite ease-in-out;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.red-packet-info {
  flex: 1;
}

.amount {
  font-size: 16px;
  color: #e64340;
  font-weight: 600;
  margin-bottom: 2px;
}

.expiry {
  font-size: 12px;
  color: #fa8c16;
}

.claim-btn {
  background: linear-gradient(90deg, #ff7d00 0%, #ff5722 100%);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(255, 125, 0, 0.2);
}

.claim-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 3px 8px rgba(255, 125, 0, 0.3);
}

/* 弹窗中的优惠券列表样式 */
.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.coupon-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid #eee;
  border-radius: 8px;
}
.coupon-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}
.coupon-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}
.coupon-actions {
  display: flex;
  align-items: center;
}

/* 服务区域 */
.my-services {
  padding: 16px 8px;
}

.service-links {
  display: flex;
}

.service-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #666;
  padding: 12px 0;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.service-item:hover {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.05);
  transform: translateY(-2px);
}

.service-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background-color: #f0f7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.service-item:hover .service-icon {
  background-color: #e6f7ff;
  transform: scale(1.1);
}

.service-icon img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}
</style>