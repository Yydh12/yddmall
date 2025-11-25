<template>
  <div class="order-manage">
    <!-- 标题 -->
    <div class="page-header">
      <h2>订单管理</h2>
      <p>支持搜索、筛选、查看详情、发货与取消订单</p>
    </div>

    <!-- 搜索筛选区域 -->
    <div class="search-bar">
      <el-input
        v-model="search.orderNo"
        placeholder="订单编号"
        clearable
        class="mr10 w220"
        @input="triggerSearch"
        @clear="handleSearch"
      />
      <el-select
        v-model="search.status"
        placeholder="订单状态"
        clearable
        class="mr10 w180"
        @change="handleSearch"
        @clear="handleSearch"
      >
        <el-option v-for="(label, val) in statusOptions" :key="val" :label="label" :value="val" />
      </el-select>
      <el-date-picker
        v-model="search.dateRange"
        type="datetimerange"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        value-format="YYYY-MM-DD HH:mm:ss"
        class="mr10 w420"
        @change="handleSearch"
      />
      <el-button type="primary" @click="handleSearch" icon="Search">搜索</el-button>
      <el-button @click="handleReset" icon="RefreshRight">重置</el-button>
      <el-button 
        type="danger" 
        plain 
        @click="bulkDeleteCancelled" 
        :disabled="!hasCancelledInPage || loading"
      >一键删除已取消</el-button>
    </div>

    <!-- 列表卡片 -->
    <div class="main-card">
      <div class="table-head">
        <div class="cell w180">订单编号</div>
        <div class="cell w200">下单时间</div>
        <div class="cell w120">支付方式</div>
        <div class="cell w120">订单状态</div>
        <div class="cell w120">应付金额</div>
        <div class="cell w200">备注</div>
        <div class="cell flex1">操作</div>
      </div>

      <div v-if="loading" class="loading-box">
        <el-skeleton :rows="3" animated />
      </div>

      <template v-else>
        <div v-if="orders.length === 0" class="empty-box">
          <el-empty description="暂无订单数据" />
        </div>

        <div v-else class="table-body">
          <div class="row" v-for="order in orders" :key="order.orderId">
            <div class="cell w180 mono">{{ order.orderNo }}</div>
            <div class="cell w200">{{ formatDate(order.createTime) }}</div>
            <div class="cell w120">{{ getPayTypeText(order.payType) }}</div>
            <div class="cell w120">
              <el-tag :type="getStatusType(order.orderStatus)" size="small">{{ getStatusText(order.orderStatus) }}</el-tag>
            </div>
          <div class="cell w120">￥{{ (order.payAmount ?? order.totalAmount)?.toFixed?.(2) ?? order.payAmount ?? order.totalAmount }}</div>
          <div class="cell w200">{{ order.buyerMessage || '-' }}</div>
          <div class="cell flex1 actions">
            <el-button size="small" type="primary" plain @click="openDetail(order)">查看详情</el-button>
            <template v-if="order.orderStatus === 1">
              <el-button size="small" type="success" plain @click="openShip(order)">发货</el-button>
            </template>
              <template v-if="order.orderStatus === 0 && isOverdue(order)">
                <el-button size="small" type="danger" plain @click="confirmCancel(order)">取消订单</el-button>
              </template>
              <template v-if="order.orderStatus === 5">
                <el-button size="small" type="danger" plain @click="approveOrderRefund(order)">同意退款</el-button>
                <el-button size="small" type="warning" plain @click="rejectOrderRefund(order)">拒绝退款</el-button>
              </template>
              <template v-if="order.orderStatus === 4">
                <el-button size="small" type="danger" plain @click="removeCancelledOrder(order)">删除订单</el-button>
              </template>
            </div>
          </div>
        </div>
      </template>

      <!-- 分页 -->
      <div class="page-nav">
        <el-pagination
          v-model:current-page="page.current"
          v-model:page-size="page.size"
          :total="page.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="detail.visible" title="订单详情" width="800px">
      <div v-if="detail.loading" class="dialog-loading">
        <el-skeleton :rows="4" animated />
      </div>
      <template v-else>
        <div class="detail-section">
          <div class="detail-row">
            <span class="label">订单号：</span>
            <span class="value mono">{{ detail.data?.orderNo }}</span>
          </div>
          <div class="detail-row">
            <span class="label">下单时间：</span>
            <span class="value">{{ formatDate(detail.data?.createTime) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">订单状态：</span>
            <span class="value">
              <el-tag :type="getStatusType(detail.data?.orderStatus)" size="small">{{ getStatusText(detail.data?.orderStatus) }}</el-tag>
            </span>
          </div>
          <div class="detail-row">
            <span class="label">支付方式：</span>
            <span class="value">{{ getPayTypeText(detail.data?.payType) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">收货信息：</span>
            <span class="value">{{ detail.data?.receiverName }}，{{ detail.data?.receiverPhone }}，{{ detail.data?.receiverAddress }}</span>
          </div>
          <div class="detail-row">
            <span class="label">买家备注：</span>
            <span class="value">{{ detail.data?.buyerMessage || '-' }}</span>
          </div>
        </div>

        <el-divider content-position="left">商品清单</el-divider>
        <el-table :data="detail.data?.orderItems || []" border size="small">
          <el-table-column label="商品" prop="itemName" min-width="180" />
          <el-table-column label="SKU" prop="skuName" min-width="160" />
          <el-table-column label="单价" min-width="100">
            <template #default="{ row }">￥{{ row.price?.toFixed?.(2) ?? row.price }}</template>
          </el-table-column>
          <el-table-column label="数量" prop="quantity" min-width="80" />
          <el-table-column label="小计" min-width="120">
            <template #default="{ row }">￥{{ row.totalAmount?.toFixed?.(2) ?? row.totalAmount }}</template>
          </el-table-column>
        </el-table>

        <div class="amount-summary">
          <div>商品总额：￥{{ (detail.data?.totalAmount)?.toFixed?.(2) ?? detail.data?.totalAmount }}</div>
          <div>优惠：￥{{ (detail.data?.discountAmount)?.toFixed?.(2) ?? detail.data?.discountAmount }}</div>
          <div>运费：￥{{ (detail.data?.freightAmount)?.toFixed?.(2) ?? detail.data?.freightAmount }}</div>
          <div class="pay">应付金额：￥{{ (detail.data?.payAmount)?.toFixed?.(2) ?? detail.data?.payAmount }}</div>
        </div>
      </template>
      <template #footer>
        <el-button @click="detail.visible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 发货弹窗移除：改为自动填写并直接提交 -->
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getOrderList, getOrderDetail, cancelOrder, shipOrder, getOrdersByStatus, approveRefund, rejectRefund, deleteOrder } from '@/api/order';

// 搜索与分页
const search = reactive({ orderNo: '', status: null, dateRange: [] });
const page = reactive({ current: 1, size: 10, total: 0 });
const orders = ref([]);
const loading = ref(false);

// 状态与支付方式映射
const statusOptions = reactive({
  0: '待支付',
  1: '已支付',
  2: '已发货',
  3: '已完成',
  4: '已取消',
  5: '申请中'
});
const statusTagMap = {
  0: 'warning',
  1: 'success',
  2: 'primary',
  3: 'success',
  4: 'info',
  5: 'warning'
};
const payTypeMap = {
  1: '支付宝',
  2: '微信',
  3: '银行卡'
};

const getStatusText = (s) => statusOptions[s] ?? '未知';
const getStatusType = (s) => statusTagMap[s] ?? 'info';
const getPayTypeText = (p) => payTypeMap[p] ?? '未知';

// 取消超时时间（默认30分钟），可根据业务需要调整
const CANCEL_TIMEOUT_MS = 30 * 60 * 1000;

// 判断订单是否超时：无下单时间也视为可取消
const isOverdue = (order) => {
  try {
    if (!order?.createTime) return true;
    const t = new Date(order.createTime).getTime();
    if (Number.isNaN(t)) return true;
    return Date.now() - t >= CANCEL_TIMEOUT_MS;
  } catch {
    return true;
  }
};

// 工具函数：格式化时间
const formatDate = (val) => {
  if (!val) return '';
  try {
    // 兼容字符串或时间对象
    const d = typeof val === 'string' ? new Date(val) : val;
    return new Date(d).toLocaleString('zh-CN');
  } catch {
    return String(val);
  }
};

// 加载订单列表（支持搜索：订单号、状态、时间范围）
const fetchOrders = async () => {
  loading.value = true;
  try {
    const hasRange = Array.isArray(search.dateRange) && search.dateRange.length === 2;
    let list = [];

    // 优先按订单号精确查询
    if (search.orderNo) {
      const { data } = await getOrderDetail(search.orderNo);
      list = data ? [data] : [];
      // 前端时间范围过滤
      if (hasRange) {
        const [start, end] = search.dateRange;
        const startMs = new Date(start).getTime();
        const endMs = new Date(end).getTime();
        list = list.filter(o => {
          const t = new Date(o.createTime).getTime();
          return !Number.isNaN(t) && t >= startMs && t <= endMs;
        });
      }
      page.total = list.length;
      orders.value = list;
      return;
    }

    // 其次按状态查询（后端支持），并做前端时间过滤与分页
    if (search.status !== null && search.status !== undefined) {
      const { data } = await getOrdersByStatus(search.status);
      list = Array.isArray(data) ? data : [];
      if (hasRange) {
        const [start, end] = search.dateRange;
        const startMs = new Date(start).getTime();
        const endMs = new Date(end).getTime();
        list = list.filter(o => {
          const t = new Date(o.createTime).getTime();
          return !Number.isNaN(t) && t >= startMs && t <= endMs;
        });
      }
      page.total = list.length;
      const startIndex = (page.current - 1) * page.size;
      orders.value = list.slice(startIndex, startIndex + page.size);
      return;
    }

    // 默认分页列表（后端分页参数对齐：current/size）
    const { data } = await getOrderList({ current: page.current, size: page.size });
    orders.value = data?.records ?? [];
    page.total = data?.total ?? 0;
  } catch (err) {
    console.error('获取订单列表失败:', err);
    ElMessage.error('获取订单列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  page.current = 1;
  fetchOrders();
};
const handleReset = () => {
  search.orderNo = '';
  search.status = null;
  search.dateRange = [];
  page.current = 1;
  page.size = 10;
  fetchOrders();
};
const handlePageChange = (p) => {
  page.current = p;
  fetchOrders();
};
const handleSizeChange = (s) => {
  page.size = s;
  page.current = 1;
  fetchOrders();
};

// 当前页是否包含已取消订单
const hasCancelledInPage = computed(() => (orders.value || []).some(o => Number(o.orderStatus) === 4));

// 详情弹窗
const detail = reactive({ visible: false, loading: false, data: null });
const openDetail = async (order) => {
  detail.visible = true;
  detail.loading = true;
  try {
    const { data } = await getOrderDetail(order.orderNo);
    detail.data = data;
  } catch (err) {
    console.error('获取订单详情失败:', err);
    ElMessage.error('获取订单详情失败');
  } finally {
    detail.loading = false;
  }
};

// 发货：自动填写物流公司与单号并直接提交
const logisticsCompanies = ['顺丰速运','中通快递','圆通速递','申通快递','韵达快递','京东物流','菜鸟裹裹'];
const logisticsPrefixes = {
  '顺丰速运': 'SF',
  '中通快递': 'ZTO',
  '圆通速递': 'YTO',
  '申通快递': 'STO',
  '韵达快递': 'YD',
  '京东物流': 'JD',
  '菜鸟裹裹': 'CNI'
};
const genLogisticsInfo = () => {
  const idx = Math.floor(Math.random() * logisticsCompanies.length);
  const company = logisticsCompanies[idx];
  const prefix = logisticsPrefixes[company] || 'EXP';
  const suffix = `${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  const logisticsNo = `${prefix}${suffix}`;
  return { company, logisticsNo };
};

const openShip = async (order) => {
  try {
    const { company, logisticsNo } = genLogisticsInfo();
    // 请求工具已在拦截器中对非200进行reject，这里只需等待即可
    await shipOrder({
      orderId: order.orderId,
      logisticsCompany: company,
      logisticsNo
    });
    ElMessage.success(`已发货：${company}，单号 ${logisticsNo}`);
    fetchOrders();
  } catch (err) {
    console.error('自动发货失败:', err);
    ElMessage.error(err?.response?.data?.msg || '自动发货失败');
  }
};

// 取消订单
const confirmCancel = async (order) => {
  // 只有待支付且超时（或无下单时间）才允许取消
  if (order.orderStatus !== 0 || !isOverdue(order)) {
    ElMessage.warning('仅可取消已过期或缺少下单时间的待支付订单');
    return;
  }
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？取消后不可恢复。', '取消订单', { type: 'warning' });
  } catch { return; }
  try {
    await cancelOrder(order.orderNo);
    ElMessage.success('订单已取消');
    fetchOrders();
  } catch (err) {
    console.error('取消订单失败:', err);
    ElMessage.error(err?.response?.data?.msg || '取消订单失败');
  }
};

// 商家审批退款：同意 / 拒绝
const approveOrderRefund = async (order) => {
  try {
    await ElMessageBox.confirm('确认同意该订单退款吗？同意后将恢复库存并取消订单。', '同意退款', { type: 'warning' });
  } catch { return; }
  try {
    await approveRefund(order.orderNo);
    ElMessage.success('已同意退款，订单取消');
    fetchOrders();
  } catch (err) {
    console.error('同意退款失败:', err);
    ElMessage.error(err?.response?.data?.msg || '同意退款失败');
  }
};

const rejectOrderRefund = async (order) => {
  try {
    await ElMessageBox.confirm('确认拒绝该订单退款申请吗？拒绝后订单将回退为已支付状态。', '拒绝退款', { type: 'warning' });
  } catch { return; }
  try {
    await rejectRefund(order.orderNo);
    ElMessage.success('已拒绝退款，订单回退为已支付');
    fetchOrders();
  } catch (err) {
    console.error('拒绝退款失败:', err);
    ElMessage.error(err?.response?.data?.msg || '拒绝退款失败');
  }
};

// 删除订单（仅已取消）
const removeCancelledOrder = async (order) => {
  if (order.orderStatus !== 4) {
    ElMessage.warning('仅已取消的订单可删除');
    return;
  }
  try {
    await ElMessageBox.confirm('删除后将无法恢复，确认删除该订单吗？', '删除订单', { type: 'warning' });
  } catch { return; }
  try {
    await deleteOrder(order.orderNo);
    ElMessage.success('订单已删除');
    fetchOrders();
  } catch (err) {
    console.error('删除订单失败:', err);
    ElMessage.error(err?.response?.data?.msg || '删除订单失败');
  }
};

// 一键删除：批量删除当前页内所有已取消订单
const bulkDeleteCancelled = async () => {
  try {
    const targets = (orders.value || []).filter(o => Number(o.orderStatus) === 4);
    if (targets.length === 0) {
      ElMessage.info('当前页没有已取消订单');
      return;
    }
    await ElMessageBox.confirm(`确认删除当前页 ${targets.length} 个已取消订单？删除后不可恢复。`, '一键删除已取消', { type: 'warning' });
  } catch { return; }
  try {
    loading.value = true;
    const results = await Promise.all(
      (orders.value || [])
        .filter(o => Number(o.orderStatus) === 4)
        .map(o => deleteOrder(o.orderNo)
          .then(() => ({ ok: true }))
          .catch(err => ({ ok: false, err }))
        )
    );
    const okCount = results.filter(r => r.ok).length;
    const failCount = results.length - okCount;
    if (okCount > 0) ElMessage.success(`已删除 ${okCount} 个订单`);
    if (failCount > 0) ElMessage.warning(`有 ${failCount} 个订单删除失败`);
    fetchOrders();
  } catch (err) {
    console.error('批量删除失败:', err);
    ElMessage.error(err?.response?.data?.msg || '批量删除失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchOrders();
});

// 防抖：输入订单编号时自动搜索，避免频繁请求
let searchTimer;
const triggerSearch = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    handleSearch();
  }, 300);
};
</script>

<style scoped>
.order-manage {
  padding: 20px;
}
.page-header {
  margin-bottom: 16px;
}
.page-header h2 { margin: 0; }
.page-header p { margin: 6px 0 0; color: #606266; }

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.w220 { width: 220px; }
.w180 { width: 180px; }
.w420 { width: 420px; }
.mr10 { margin-right: 10px; }

.main-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
}
.table-head {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f2f5;
  padding: 10px 0;
  color: #4e5969;
  font-weight: 500;
}
.table-body .row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f2f5;
  padding: 10px 0;
}
.table-body .row:last-child { border-bottom: none; }
.cell {
  padding: 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.w120 { width: 120px; }
.w180 { width: 180px; }
.w200 { width: 200px; }
.flex1 { flex: 1; }
.mono { font-family: Monaco, monospace; color: #409EFF; }
.actions { display: flex; gap: 8px; justify-content: flex-end; }

.page-nav { display: flex; justify-content: flex-end; padding-top: 12px; }
.loading-box { padding: 24px; }
.empty-box { padding: 24px; }

.detail-section { margin-bottom: 12px; }
.detail-row { margin-bottom: 6px; }
.label { color: #909399; margin-right: 4px; }
.value { color: #303133; }
.amount-summary { margin-top: 12px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
.amount-summary .pay { grid-column: 1 / -1; font-weight: 600; color: #E6A23C; }

.dialog-loading { padding: 16px; }

:deep(.el-table) { margin-top: 6px; }
</style>
