<template>
  <div class="order-detail-container">
    <!-- 头部标题区 -->
    <div class="page-header">
      <h2 class="header-title">订单详情</h2>
      <div class="status-tag-container">
        <el-tag 
          v-if="order" 
          :type="getStatusType(order.orderStatus)" 
          size="small"
          class="status-tag"
        >
          {{ getStatusText(order.orderStatus) }}
        </el-tag>
        <el-button type="primary" size="small" @click="continueShopping" style="margin-left: 10px;">继续购物</el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-box">
      <el-skeleton :rows="6" animated class="skeleton-item" />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-box">
      <el-icon class="error-icon"><WarningFilled /></el-icon>
      <p class="error-text">{{ error }}</p>
      <el-button type="primary" size="small" @click="reloadOrder">重新加载</el-button>
    </div>

    <!-- 订单内容 -->
    <div v-else-if="order" class="order-content">
      <!-- 基础信息卡片 -->
      <div class="base-info-card card">
        <h3 class="card-title">基础信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">订单编号</span>
            <span class="info-value mono">{{ order.orderNo }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">下单时间</span>
            <span class="info-value">{{ formatDate(order.createTime) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">支付方式</span>
            <span class="info-value">{{ getPayTypeText(order.payType) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">总金额</span>
            <span class="info-value amount">¥{{ (order.totalAmount ?? 0).toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <!-- 收货信息卡片 -->
      <div class="receiver-card card">
        <h3 class="card-title">收货信息</h3>
        <div class="receiver-info">
          <div class="info-item">
            <span class="info-label">收货人</span>
            <span class="info-value">{{ order.receiverName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">联系电话</span>
            <span class="info-value">{{ order.receiverPhone }}</span>
          </div>
          <div class="info-item full-width">
            <span class="info-label">收货地址</span>
            <span class="info-value">{{ order.receiverAddress }}</span>
          </div>
        </div>
      </div>

      <!-- 商品列表卡片 -->
      <div class="goods-card card">
        <h3 class="card-title">商品列表</h3>
        <el-table 
          :data="order.orderItems" 
          style="width: 100%"
          border
          :header-cell-style="{ background: '#f8f9fa', fontWeight: 500 }"
          :row-style="{ transition: 'background-color 0.2s' }"
          @row-mouse-enter="({ $index }, row) => rowHoverIndex = $index"
          @row-mouse-leave="() => rowHoverIndex = -1"
        >
          <el-table-column prop="itemName" label="商品名称" align="left" />
          <el-table-column prop="price" label="单价" align="center">
            <template #default="scope">
              ¥{{ (scope.row.price ?? 0).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" align="center" />
          <el-table-column prop="totalAmount" label="小计" align="center" width="120">
            <template #default="scope">
              <span class="subtotal">¥{{ (scope.row.totalAmount ?? 0).toFixed(2) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 金额与优惠卡片 -->
      <div class="amount-card card">
        <h3 class="card-title">金额与优惠</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">商品总额</span>
            <span class="info-value">¥{{ (order.totalAmount ?? 0).toFixed(2) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">运费</span>
            <span class="info-value">¥{{ (order.freightAmount ?? 0).toFixed(2) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">优惠合计</span>
            <span class="info-value">-¥{{ (discountDetail?.discountAmount ?? order.discountAmount ?? 0).toFixed(2) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">应付金额</span>
            <span class="info-value amount">¥{{ (order.payAmount ?? ((order.totalAmount ?? 0) + (order.freightAmount ?? 0) - (order.discountAmount ?? 0))).toFixed(2) }}</span>
          </div>
        </div>
        <div class="discount-detail" v-if="discountDetail">
          <div class="detail-row" v-if="discountDetail.coupon && Number(discountDetail.couponDiscount || 0) > 0">
            <span class="detail-label">优惠券</span>
            <span class="detail-value">{{ discountDetail.coupon.title || '优惠券' }}：-¥{{ Number(discountDetail.couponDiscount || 0).toFixed(2) }}</span>
          </div>
          <div class="detail-row" v-if="discountDetail.redPacket && Number(discountDetail.redPacketDiscount || 0) > 0">
            <span class="detail-label">红包</span>
            <span class="detail-value">{{ discountDetail.redPacket.title || '红包' }}：-¥{{ Number(discountDetail.redPacketDiscount || 0).toFixed(2) }}</span>
          </div>
          <div class="detail-row" v-if="Number(discountDetail.coinDiscount || 0) > 0">
            <span class="detail-label">金币抵扣</span>
            <span class="detail-value">已用 {{ discountDetail.coinUsed || 0 }} 枚：-¥{{ Number(discountDetail.coinDiscount || 0).toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElSkeleton, ElTag, ElIcon, ElButton, ElTable, ElTableColumn } from 'element-plus';
import { WarningFilled } from '@element-plus/icons-vue';
import { getOrderDetail } from '@/api/order';
import { getOrderDiscountDetail } from '@/api/discount';

const route = useRoute();
const router = useRouter();
const order = ref(null);
const loading = ref(true);
const error = ref(null);
const rowHoverIndex = ref(-1);
const discountDetail = ref(null);

// ... existing code ...

// 继续购物
const continueShopping = () => {
  if (order.value && order.value.orderItems && order.value.orderItems.length > 0) {
    router.replace({ name: 'productInfo', params: { itemId: order.value.orderItems[0].itemId } });
  } else {
    router.replace('/'); // Fallback if no order items
  }
};

// ... existing code ...

// 状态映射
const statusTagMap = { 0: 'warning', 1: 'info', 2: 'primary', 3: 'success', 4: 'danger' };
const statusOptions = { 0: '待支付', 1: '已支付', 2: '已发货', 3: '已完成', 4: '已取消' };
const payTypeMap = { 1: '支付宝', 2: '微信', 3: '银行卡', undefined: '未支付' };

// 工具方法
const getStatusText = (status) => statusOptions[status] ?? '未知';
const getStatusType = (status) => statusTagMap[status] ?? 'info';
const getPayTypeText = (type) => payTypeMap[type] ?? '未知';
const formatDate = (val) => {
  if (!val) return '';
  try {
    const d = typeof val === 'string' ? new Date(val) : val;
    return new Date(d).toLocaleString('zh-CN');
  } catch { return String(val); }
};

// 加载订单详情
const fetchOrderDetail = async () => {
  loading.value = true;
  error.value = null;
  const orderNo = route.params.orderNo;
  try {
    const response = await getOrderDetail(orderNo);
    order.value = response.data;
    // 加载优惠明细
    try {
      const resp = await getOrderDiscountDetail(orderNo);
      discountDetail.value = resp?.data || null;
    } catch (e) {
      // 优惠明细失败不影响页面主流程
      discountDetail.value = null;
      console.warn('优惠明细加载失败', e);
    }
  } catch (err) {
    error.value = '加载订单详情失败，请稍后重试';
    console.error('订单详情加载失败:', err);
  } finally {
    loading.value = false;
  }
};

// 重新加载
const reloadOrder = () => {
  fetchOrderDetail();
  ElMessage.info('正在重新加载订单...');
};

// 初始化加载
onMounted(() => {
  fetchOrderDetail();
});
</script>

<style scoped>
/* 容器基础样式 */
.order-detail-container {
  padding: 24px;
  background-color: #f8f9fa;
  min-height: calc(100vh - 48px);
}

/* 头部样式 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.header-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1989fa;
}
.status-tag-container {
  display: flex;
  align-items: center;
}
.status-tag {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
}

/* 加载状态 */
.loading-box {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}
.skeleton-item {
  border-radius: 8px;
}

/* 错误状态 */
.error-box {
  background: #fff;
  border-radius: 12px;
  padding: 48px 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.error-icon {
  color: #e64340;
  font-size: 32px;
}
.error-text {
  color: #606266;
  font-size: 14px;
  margin: 0;
}

/* 订单内容容器 */
.order-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 卡片通用样式 */
.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;
}
.card:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
}
.card-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
}
.card-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 16px;
  background-color: #1989fa;
  border-radius: 2px;
  margin-right: 8px;
}

/* 信息网格布局 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.info-label {
  font-size: 12px;
  color: #909399;
}
.info-value {
  font-size: 14px;
  color: #303133;
}
.mono {
  font-family: Monaco, monospace;
  color: #409eff;
}
.amount {
  color: #e64340;
  font-weight: 500;
  font-size: 16px;
}

/* 金额与优惠样式 */
.amount-card .discount-detail {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #eee;
}
.amount-card .detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}
.amount-card .detail-label {
  color: #909399;
  font-size: 13px;
}
.amount-card .detail-value {
  color: #303133;
}

/* 收货信息样式 */
.receiver-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.full-width {
  grid-column: 1 / -1;
}

/* 商品表格样式 */
.el-table {
  border-radius: 8px;
  overflow: hidden;
}
.el-table th {
  font-size: 14px;
  color: #4e5969;
}
.el-table td {
  font-size: 14px;
  color: #303133;
}
.subtotal {
  color: #e64340;
  font-weight: 500;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>