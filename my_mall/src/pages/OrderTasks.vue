<template>
  <Navbar />
  <div class="order-tasks">

    <el-tabs v-model="activeTab">
      <el-tab-pane label="待付款" name="pendingPayment" />
      <el-tab-pane label="待发货" name="awaitShipment" />
      <el-tab-pane label="待收货" name="awaitReceipt" />
      <el-tab-pane label="待评价" name="awaitReview" />
    </el-tabs>

<div class="main-card">
      <!-- 加载与空态 -->
      <div v-if="loading" class="loading-box">
        <el-skeleton :rows="3" animated />
      </div>

      <template v-else>
        <div v-if="orders.length === 0" class="empty-box">
          <el-empty description="暂无订单数据" />
        </div>

        <!-- 订单列表（商品卡片样式） -->
        <div v-else class="orders">
          <div class="order-card" v-for="order in orders" :key="order.orderId">
            <div class="order-header">
              <div class="order-basic">
                <span class="order-no mono">订单号：{{ order.orderNo }}</span>
                <span class="order-time">{{ formatDate(order.createTime) }}</span>
              </div>
              <div class="order-amount">应付：¥{{ ((order.payAmount ?? order.totalAmount) ?? 0).toFixed(2) }}</div>
              <el-tag :type="getStatusType(order.orderStatus)" size="small">{{ getStatusText(order.orderStatus) }}</el-tag>
            </div>

            <div class="order-body">
              <!-- 买家备注 -->
              <div class="buyer-message">备注：{{ order.buyerMessage || '无' }}</div>

              <div class="product-list">
                <div class="product-item" v-for="item in order.orderItems || []" :key="item.orderItemId">
                  <img class="product-image" :src="item.itemPic" :alt="item.itemName" />
                  <div class="product-info">
                    <div class="product-title">
                      {{ item.itemName }}
                      <el-tag v-if="item.isOffline" type="danger" size="small" style="margin-left: 8px;">已下架</el-tag>
                    </div>
                    <div class="product-subtitle">{{ item.subTitle || item.subtitle || item.skuName || '' }}</div>
                  </div>
                  <div class="product-price">
                    <span class="price">¥{{ (item.price ?? 0).toFixed(2) }}</span>
                    <span class="quantity">×{{ item.quantity ?? 1 }}</span>
                  </div>
                </div>
              </div>

              <div class="order-actions">
                <el-button v-if="activeTab === 'pendingPayment'" size="small" type="primary" plain @click="goToPay(order)">去付款</el-button>
                <el-button v-if="activeTab === 'pendingPayment'" size="small" type="danger" plain @click="doCancelOrder(order)">取消订单</el-button>
                <el-tag v-if="activeTab === 'awaitShipment'" type="info" size="small">待商家发货</el-tag>
                <el-button v-if="activeTab === 'awaitShipment'" size="small" type="danger" plain @click="applyOrderRefund(order)">申请退款</el-button>
                <el-button v-if="activeTab === 'awaitReceipt'" size="small" type="success" plain @click="doConfirmReceipt(order)">确认收货</el-button>
                <el-button v-if="activeTab === 'awaitReview'" size="small" type="success" plain @click="goToReview(order)">去评价</el-button>
                <el-button size="small" type="default" plain @click="viewOrderDetail(order)">订单详情</el-button>
              </div>
            </div>
          </div>
        </div>
        <!-- 分页 -->
        <div class="pagination-container" style="margin-top: 12px; text-align: center;">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            :page-sizes="[5, 10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </template>
    </div>
  </div>
  
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getOrderList, confirmReceipt, applyRefund, getOrdersByStatus, getOrderDetail, cancelOrder } from '@/api/order';
import Navbar from '@/components/Home/Navbar.vue';
import axios from '../axios';

const router = useRouter();
const route = useRoute();

const activeTab = ref('pendingPayment'); // pendingPayment | awaitShipment | awaitReceipt | awaitReview
const orders = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 待付款超时自动取消（与订单确认页30分钟一致）
const PAYMENT_TIMEOUT_MS = 30 * 60 * 1000; // 30分钟
const autoCancelExpiredOrders = async () => {
  if (activeTab.value !== 'pendingPayment') return;
  const now = Date.now();
  const list = Array.isArray(orders.value) ? orders.value : [];
  const expired = list.filter(o => {
    if (Number(o?.orderStatus) !== 0 || !o?.createTime) return false;
    try {
      const t = new Date(o.createTime).getTime();
      return isFinite(t) && (now - t) > PAYMENT_TIMEOUT_MS;
    } catch { return false; }
  });
  if (!expired.length) return;

  // 批量取消，错误不阻断整体流程
  const results = await Promise.all(expired.map(o => cancelOrder(o.orderNo)
    .then(() => ({ ok: true }))
    .catch(err => ({ ok: false, err }))));
  const okCount = results.filter(r => r.ok).length;
  if (okCount > 0) {
    ElMessage.info(`已自动取消 ${okCount} 个超时未付款订单`);
  }
  // 刷新列表以反映最新状态（避免递归，直接调用一次）
  await loadOrders();
};

// 映射与工具
const statusTagMap = { 0: 'warning', 1: 'info', 2: 'primary', 3: 'success', 4: 'info', 5: 'warning' };
const statusOptions = { 0: '待付款', 1: '已支付', 2: '已发货', 3: '已完成', 4: '已取消', 5: '申请中' };
const payTypeMap = { 1: '支付宝', 2: '微信', 3: '银行卡' };
const getStatusText = (s) => statusOptions[s] ?? '未知';
const getStatusType = (s) => statusTagMap[s] ?? 'info';
const getPayTypeText = (p) => payTypeMap[p] ?? '未知';
const formatDate = (val) => {
  if (!val) return '';
  try {
    const d = typeof val === 'string' ? new Date(val) : val;
    return new Date(d).toLocaleString('zh-CN');
  } catch { return String(val); }
};

// 加载数据
const loadOrders = async () => {
  loading.value = true;
  try {
    // 合并待发货与申请中（1 + 5）
    if (activeTab.value === 'awaitShipment') {
      const [resPaid, resApplied] = await Promise.all([
        getOrdersByStatus(1),
        getOrdersByStatus(5)
      ]);
      let list = [
        ...(resPaid?.data || []),
        ...(resApplied?.data || [])
      ].sort((a, b) => {
        const ta = new Date(a?.createTime || 0).getTime();
        const tb = new Date(b?.createTime || 0).getTime();
        return (tb || 0) - (ta || 0);
      });
      total.value = list.length;
      const start = (currentPage.value - 1) * pageSize.value;
      let pageList = list.slice(start, start + pageSize.value);

      // 回填缺失的订单项，确保商品图片/标题/价格可见
      const needDetails = (pageList || []).filter(o => !Array.isArray(o.orderItems) || o.orderItems.length === 0);
      if (needDetails.length) {
        const details = await Promise.all(needDetails.map(o => getOrderDetail(o.orderNo)));
        details.forEach((resp, idx) => {
          const ordNo = needDetails[idx].orderNo;
          const target = (pageList || []).find(x => x.orderNo === ordNo);
          if (target && resp?.data) {
            target.orderItems = resp.data.orderItems || [];
          }
        });
      }
      orders.value = pageList;
      await markOrderItemsOffline();
      return;
    }

    // 其他状态使用后端分页
    const statusMap = { pendingPayment: 0, awaitReceipt: 2, awaitReview: 3 };
    const status = statusMap[activeTab.value];
    const { data } = await getOrderList({ status, current: currentPage.value, size: pageSize.value });
    const records = Array.isArray(data?.records) ? data.records : (Array.isArray(data?.list) ? data.list : []);
    orders.value = records || [];
    total.value = Number(data?.total ?? (records?.length || 0));

    // 回填缺失的订单项，确保商品图片/标题/价格可见
    const needDetails = (orders.value || []).filter(o => !Array.isArray(o.orderItems) || o.orderItems.length === 0);
    if (needDetails.length) {
      const details = await Promise.all(needDetails.map(o => getOrderDetail(o.orderNo)));
      details.forEach((resp, idx) => {
        const ordNo = needDetails[idx].orderNo;
        const target = (orders.value || []).find(x => x.orderNo === ordNo);
        if (target && resp?.data) {
          target.orderItems = resp.data.orderItems || [];
        }
      });
    }
    await markOrderItemsOffline();
  } catch (err) {
    console.error('获取订单列表失败:', err);
    ElMessage.error('获取订单列表失败');
  } finally {
    loading.value = false;
  }
};

// 操作
const goToPay = (order) => {
  router.push({ name: 'orderConfirm', params: { orderNo: order.orderNo } });
};

const doConfirmReceipt = async (order) => {
  try {
    await ElMessageBox.confirm('确认已收到商品吗？', '确认收货', { type: 'warning' });
  } catch { return; }
  try {
    await confirmReceipt(order.orderNo);
    ElMessage.success('确认收货成功');
    loadOrders();
  } catch (err) {
    console.error('确认收货失败:', err);
    ElMessage.error(err?.response?.data?.msg || '确认收货失败');
  }
};

const applyOrderRefund = async (order) => {
  try {
    await ElMessageBox.confirm('确认申请退款吗？申请成功后订单进入申请中，商家审批后才取消。', '申请退款', { type: 'warning' });
  } catch { return; }
  try {
    await applyRefund(order.orderNo);
    ElMessage.success('申请退款成功，订单进入申请中');
    loadOrders();
  } catch (err) {
    console.error('申请退款失败:', err);
    ElMessage.error(err?.response?.data?.msg || '申请退款失败');
  }
};

// 取消订单（仅待付款）
const doCancelOrder = async (order) => {
  try {
    await ElMessageBox.confirm('确认取消该订单吗？取消后订单将关闭且无法恢复。', '取消订单', { type: 'warning' });
  } catch { return; }
  try {
    await cancelOrder(order.orderNo);
    ElMessage.success('订单已取消');
    loadOrders();
  } catch (err) {
    console.error('取消订单失败:', err);
    ElMessage.error(err?.response?.data?.msg || '取消订单失败');
  }
};

const goToReview = (order) => {
  // 跳转到商品详情页，默认使用第一个商品
  if (order.orderItems && order.orderItems.length > 0) {
    const firstItem = order.orderItems[0];
    router.push({ name: 'productInfo', params: { itemId: firstItem.itemId } });
  } else {
    // 如果没有商品信息，可以跳转到订单详情或提示错误
    ElMessage.warning('订单中没有商品信息，无法跳转到评价页面。');
    router.replace({ name: 'OrderDetail', params: { orderNo: order.orderNo } });
  }
};

const viewOrderDetail = (order) => {
  router.replace({ name: 'OrderDetail', params: { orderNo: order.orderNo } });
};

// 基于 /item/{id} 的状态标记订单商品是否已下架
const markOrderItemsOffline = async () => {
  try {
    const itemIds = [...new Set((orders.value || []).flatMap(o => (o.orderItems || []).map(i => i.itemId)).filter(Boolean))];
    if (!itemIds.length) return;
    const statusMap = {};
    const tasks = itemIds.map(id => axios.get(`/item/${id}`)
      .then(res => {
        if (res?.data?.code === 200 && res.data.data) {
          statusMap[id] = Number(res.data.data.status || 0);
        } else {
          statusMap[id] = -1;
        }
      })
      .catch(() => { statusMap[id] = -1; }));
    await Promise.all(tasks);
    (orders.value || []).forEach(o => {
      (o.orderItems || []).forEach(i => {
        const s = statusMap[i.itemId];
        i.isOffline = s === undefined ? false : (s !== 1);
      });
    });
  } catch (e) {
    console.warn('订单商品下架状态标记失败：', e?.response?.data || e);
  }
};

// 根据路由参数设置初始活动标签
const validTabs = ['pendingPayment','awaitShipment','awaitReceipt','awaitReview'];
onMounted(() => {
  const tab = route.query.tab;
  const sizeQ = route.query.size;
  const pageQ = route.query.page;

  if (typeof sizeQ === 'string' && !isNaN(Number(sizeQ))) {
    pageSize.value = Number(sizeQ);
  }
  if (typeof pageQ === 'string' && !isNaN(Number(pageQ))) {
    currentPage.value = Number(pageQ);
  }

  if (typeof tab === 'string' && validTabs.includes(tab)) {
    activeTab.value = tab;
    loadOrders().then(autoCancelExpiredOrders);
  } else {
    router.replace({ 
      path: route.path, 
      query: { 
        ...route.query, 
        tab: activeTab.value, 
        page: String(currentPage.value), 
        size: String(pageSize.value) 
      } 
    });
    // 等待路由查询参数变更的监听触发加载
  }
});

// 监听路由参数变化以切换标签
watch(() => route.query.tab, (tab) => {
  if (typeof tab === 'string' && validTabs.includes(tab) && tab !== activeTab.value) {
    activeTab.value = tab;
    currentPage.value = 1;
    loadOrders().then(autoCancelExpiredOrders);
  }
});

// 监听标签变化，主动加载对应订单
const syncQuery = () => {
  router.replace({ 
    path: route.path, 
    query: { 
      ...route.query, 
      tab: activeTab.value, 
      page: String(currentPage.value), 
      size: String(pageSize.value) 
    } 
  });
};

watch(activeTab, () => {
  currentPage.value = 1;
  syncQuery();
  loadOrders().then(autoCancelExpiredOrders);
});

// 分页事件
const handleCurrentChange = (p) => {
  currentPage.value = p;
  syncQuery();
  loadOrders().then(autoCancelExpiredOrders);
};
const handleSizeChange = (s) => {
  pageSize.value = s;
  currentPage.value = 1;
  syncQuery();
  loadOrders().then(autoCancelExpiredOrders);
};
</script>

<style scoped>
.order-tasks { padding: 20px; }
.main-card { background: #fff; border-radius: 8px; padding: 12px; }
.loading-box { padding: 24px; }
.empty-box { padding: 24px; }
.mono { font-family: Monaco, monospace; color: #409EFF; }

/* 订单卡片样式 */
.orders { display: flex; flex-direction: column; gap: 12px; }
.order-card { border: 1px solid #f0f2f5; border-radius: 8px; overflow: hidden; }
.order-header { background: #f8f9fa; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; }
.order-basic { display: flex; gap: 12px; align-items: center; }
.order-no { font-weight: 600; color: #333; }
.order-time { color: #666; font-size: 12px; }
.order-amount { color: #ff6b6b; font-weight: 600; }

.order-body { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
.product-list { display: flex; flex-direction: column; gap: 10px; }
.product-item { display: flex; align-items: center; gap: 12px; padding: 8px; background: #fafafa; border-radius: 6px; }
.product-image { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; }
.product-info { flex: 1; }
.product-title { font-weight: 600; color: #333; margin-bottom: 4px; }
.product-subtitle { color: #666; font-size: 12px; }
.product-price { text-align: right; }
.product-price .price { color: #ff6b6b; font-weight: bold; display: block; }
.product-price .quantity { color: #666; font-size: 12px; }

.order-actions { display: flex; justify-content: flex-end; gap: 8px; }

/* 买家备注样式 */
.buyer-message { color: #666; font-size: 12px; padding: 0 12px; }
</style>
