<template>
  <div class="my-discounts-container">
    <div class="page-header">
      <h2 class="header-title">我的优惠</h2>
    </div>

    <div class="filter-card card">
      <h3 class="card-title">筛选</h3>
      <div class="filter-row">
        <span class="filter-label">状态：</span>
        <el-radio-group v-model="status" @change="reloadAll">
          <el-radio-button :label="null">全部</el-radio-button>
          <el-radio-button :label="0">未使用</el-radio-button>
          <el-radio-button :label="1">已使用</el-radio-button>
        </el-radio-group>
      </div>
      <div class="filter-row">
        <span class="filter-label">关键词：</span>
        <el-input v-model="keyword" clearable placeholder="按标题搜索" style="width: 240px;" />
        <span class="filter-label" style="margin-left:12px;">排序：</span>
        <el-select v-model="sortBy" style="width: 160px;">
          <el-option label="到期时间优先" value="expireAsc" />
          <el-option label="面值/折扣从高到低" value="valueDesc" />
        </el-select>
      </div>
    </div>

    <div class="lists-grid">
      <!-- 优惠券列表 -->
      <div class="list-card card">
        <h3 class="card-title">优惠券</h3>
        <div v-if="loadingCoupons" class="loading-box"><el-skeleton :rows="3" animated /></div>
        <div v-else>
          <div v-if="(coupons || []).length === 0" class="empty">暂无数据</div>
          <div class="list">
            <div class="list-item coupon" v-for="uc in couponsView" :key="uc.id || uc.couponId">
              <div class="item-main">
                <div class="item-title">
                  {{ uc.title || '优惠券' }} #{{ uc.couponId }}
                  <el-tag size="small" :type="uc.discountType===1?'danger':'warning'" style="margin-left:6px;">{{ uc.discountType===1?'满减':'折扣' }}</el-tag>
                  <el-tag size="small" :type="statusTag(uc.status)" style="margin-left:6px;">{{ formatStatus(uc.status) }}</el-tag>
                </div>
                <div class="item-sub" :class="expireClass(uc.endTime)">{{ expireInfo(uc.endTime) }}</div>
              </div>
              <div class="item-detail">
                <div class="detail-row">
                  <span class="label">面值/折扣</span>
                  <span class="value" v-if="uc.discountType === 1">¥{{ formatMoney(uc.discountValue) }}</span>
                  <span class="value" v-else>{{ formatPercent(uc.discountValue) }}</span>
                </div>
                <div class="detail-row" v-if="uc.minSpend && Number(uc.minSpend) > 0">
                  <span class="label">门槛</span>
                  <span class="value">满 ¥{{ formatMoney(uc.minSpend) }} 可用</span>
                </div>
                <div class="detail-row">
                  <span class="label">有效期</span>
                  <span class="value">{{ formatPeriod(uc.startTime, uc.endTime) }}</span>
                </div>
                <div class="detail-row" v-if="uc.description">
                  <span class="label">说明</span>
                  <span class="value">{{ uc.description }}</span>
                </div>
              </div>
              <div class="item-extra">
                <div v-if="uc.orderNo" class="item-sub">订单：{{ uc.orderNo }}</div>
                <div v-if="uc.usedAt" class="item-sub">使用时间：{{ formatDate(uc.usedAt) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 红包列表 -->
      <div class="list-card card">
        <h3 class="card-title">红包</h3>
        <div v-if="loadingRedPackets" class="loading-box"><el-skeleton :rows="3" animated /></div>
        <div v-else>
          <div v-if="(redPackets || []).length === 0" class="empty">暂无数据</div>
          <div class="list">
            <div class="list-item redpacket" v-for="rp in redPacketsView" :key="rp.id || rp.redPacketId">
              <div class="item-main">
                <div class="item-title">
                  {{ rp.title || '红包' }} #{{ rp.redPacketId }}
                  <el-tag size="small" type="success" style="margin-left:6px;">红包</el-tag>
                  <el-tag size="small" :type="statusTag(rp.status)" style="margin-left:6px;">{{ formatStatus(rp.status) }}</el-tag>
                </div>
                <div class="item-sub" :class="expireClass(rp.endTime)">{{ expireInfo(rp.endTime) }}</div>
              </div>
              <div class="item-detail">
                <div class="detail-row">
                  <span class="label">余额</span>
                  <span class="value">¥{{ formatMoney(rp.amount) }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">所属店铺</span>
                  <span class="value">{{ formatRedPacketShopName(rp) }}</span>
                </div>
                <div class="detail-row" v-if="rp.threshold || rp.minSpend">
                  <span class="label">门槛</span>
                  <span class="value">满 ¥{{ formatMoney(rp.threshold || rp.minSpend) }} 可用</span>
                </div>
                <div class="detail-row">
                  <span class="label">有效期</span>
                  <span class="value">{{ formatPeriod(rp.startTime, rp.endTime) }}</span>
                </div>
                <div class="detail-row" v-if="rp.description">
                  <span class="label">说明</span>
                  <span class="value">{{ rp.description }}</span>
                </div>
              </div>
              <div class="item-extra">
                <div v-if="rp.orderNo" class="item-sub">订单：{{ rp.orderNo }}</div>
                <div v-if="rp.usedAt" class="item-sub">使用时间：{{ formatDate(rp.usedAt) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { ElSkeleton } from 'element-plus';
import { listMyCouponsFiltered, listMyRedPacketsFiltered } from '@/api/discount';
import { getMerchant } from '@/api/merchant';

const route = useRoute();
const status = ref(null); // null=全部, 0=未使用, 1=已使用
const coupons = ref([]);
const redPackets = ref([]);
const loadingCoupons = ref(false);
const loadingRedPackets = ref(false);
const keyword = ref('');
const sortBy = ref('expireAsc');
const merchantNames = ref({}); // merchantId -> merchantName

const formatStatus = (s) => ({ 0: '未使用', 1: '已使用' }[s] ?? '未知');
const formatDate = (val) => {
  if (!val) return '';
  try {
    const d = typeof val === 'string' ? new Date(val) : val;
    return new Date(d).toLocaleString('zh-CN');
  } catch { return String(val); }
};

// 金额/折扣与有效期格式化
const formatMoney = (val) => {
  if (val == null) return '0.00';
  const n = Number(val);
  return Number.isNaN(n) ? String(val) : n.toFixed(2);
};
const formatPercent = (val) => {
  if (val == null) return '-';
  const n = Number(val);
  return Number.isNaN(n) ? String(val) : `${n}%`;
};
const formatPeriod = (start, end) => {
  const s = start ? formatDate(start) : '-';
  const e = end ? formatDate(end) : '-';
  if (s === '-' && e === '-') return '不限';
  return `${s} 至 ${e}`;
};

const statusTag = (s) => (s === 0 ? 'success' : 'info');
const expireInfo = (end) => {
  if (!end) return '长期有效';
  try {
    const now = Date.now();
    const t = new Date(end).getTime();
    const diffDays = Math.ceil((t - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return '已过期';
    if (diffDays === 0) return '今日到期';
    return `剩余 ${diffDays} 天到期`;
  } catch { return '—'; }
};
const expireClass = (end) => {
  if (!end) return '';
  try {
    const now = Date.now();
    const t = new Date(end).getTime();
    const diffDays = Math.ceil((t - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'expire-danger';
    if (diffDays <= 3) return 'expire-warning';
    return '';
  } catch { return ''; }
};

// 展示层：按关键词与排序生成视图数组
const couponsView = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  let arr = Array.isArray(coupons.value) ? [...coupons.value] : [];
  if (kw) arr = arr.filter((x) => String(x.title || '').toLowerCase().includes(kw));
  if (sortBy.value === 'expireAsc') {
    arr.sort((a, b) => new Date(a.endTime || 0) - new Date(b.endTime || 0));
  } else if (sortBy.value === 'valueDesc') {
    arr.sort((a, b) => Number(b.discountValue || 0) - Number(a.discountValue || 0));
  }
  return arr;
});
const redPacketsView = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  let arr = Array.isArray(redPackets.value) ? [...redPackets.value] : [];
  if (kw) arr = arr.filter((x) => String(x.title || '').toLowerCase().includes(kw));
  if (sortBy.value === 'expireAsc') {
    arr.sort((a, b) => new Date(a.endTime || 0) - new Date(b.endTime || 0));
  } else if (sortBy.value === 'valueDesc') {
    arr.sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));
  }
  return arr;
});

// 红包所属店铺显示（优先后端返回的 merchantName）
const formatRedPacketShopName = (rp) => {
  if (rp?.merchantName) return rp.merchantName;
  const mId = rp?.merchantId ?? rp?.merchant_id;
  if (mId == null) return '平台通用';
  const name = merchantNames.value?.[mId];
  return name || `ID ${mId}`;
};

// 拉取涉及到的店铺名称（若后端未返回 merchantName 时兜底）
const loadMerchantNames = async () => {
  try {
    // 若后端已返回 merchantName，则无需额外拉取
    const needFetch = (redPackets.value || []).some(r => !r?.merchantName && (r?.merchantId ?? r?.merchant_id) != null);
    if (!needFetch) return;
    const ids = Array.from(new Set(
      (redPackets.value || [])
        .map(r => r?.merchantId ?? r?.merchant_id)
        .filter(id => id != null)
    ));
    const tasks = ids.map(async (id) => {
      if (merchantNames.value[id]) return;
      try {
        const resp = await getMerchant(id);
        const data = resp?.data || resp?.data?.data || resp?.merchant || null;
        const name = data?.merchantName || data?.name || data?.merchant_name || `ID ${id}`;
        merchantNames.value[id] = name;
      } catch (_) {
        merchantNames.value[id] = `ID ${id}`;
      }
    });
    await Promise.allSettled(tasks);
  } catch (_) {}
};

const loadCoupons = async () => {
  loadingCoupons.value = true;
  try {
    const { data } = await listMyCouponsFiltered({ status: status.value });
    coupons.value = Array.isArray(data) ? data : [];
  } finally { loadingCoupons.value = false; }
};

const loadRedPackets = async () => {
  loadingRedPackets.value = true;
  try {
    const { data } = await listMyRedPacketsFiltered({ status: status.value });
    redPackets.value = Array.isArray(data) ? data : [];
    // 关联店铺名称
    await loadMerchantNames();
  } finally { loadingRedPackets.value = false; }
};

const reloadAll = () => { loadCoupons(); loadRedPackets(); };

onMounted(() => {
  // 支持从入口设置默认tab，比如 ?tab=coupons
  const initialStatus = route.query.status;
  if (initialStatus === '0' || initialStatus === 0) status.value = 0;
  else if (initialStatus === '1' || initialStatus === 1) status.value = 1;
  reloadAll();
});
</script>

<style scoped>
.my-discounts-container { padding: 24px; background: #f8f9fa; min-height: calc(100vh - 48px); }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.header-title { margin: 0; font-size: 20px; font-weight: 600; color: #1989fa; }

.card { background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.card + .card { margin-top: 12px; }
.card-title { margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #303133; }

.filter-row { display: flex; align-items: center; gap: 12px; }
.filter-label { color: #909399; }

.lists-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 12px; }
.list { display: flex; flex-direction: column; gap: 10px; }
.list-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid #eee; border-radius: 8px; background: #fff; }
.list-item.coupon { border-left: 4px solid #f56c6c; }
.list-item.redpacket { border-left: 4px solid #67c23a; }
.item-main { display: flex; flex-direction: column; gap: 4px; }
.item-title { font-weight: 600; color: #333; }
.item-sub { color: #666; font-size: 12px; }
.empty { color: #999; text-align: center; padding: 16px; }

/* 详情信息布局 */
.item-detail { display: grid; grid-template-columns: 96px 1fr; gap: 6px 12px; margin-top: 8px; }
.detail-row { display: contents; }
.label { font-size: 12px; color: #374151; }
.value { font-size: 12px; color: #111827; }

.expire-warning { color: #e6a23c; }
.expire-danger { color: #f56c6c; font-weight: 600; }

@media (max-width: 768px) {
  .lists-grid { grid-template-columns: 1fr; }
}
</style>