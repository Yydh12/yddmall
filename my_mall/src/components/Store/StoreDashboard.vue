<template>
  <div class="dashboard">
    <div class="header">
      <h2>店铺首页 · 订单概览</h2>
      <span class="tip">统计口径：当前账号“已支付”订单与退单/退款</span>
    </div>

    <!-- 店铺与商品概览 -->
    <div class="charts-row">
      <el-card shadow="hover" class="card">
        <div class="card-body">
          <div class="card-title">店铺概览</div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">店铺评分</div>
              <div class="stat-value">{{ formatRating(storeStats.avgRating) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">粉丝数</div>
              <div class="stat-value">{{ formatNumber(storeStats.fansCount) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">在售商品</div>
              <div class="stat-value">{{ formatNumber(storeStats.onSaleCount) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">好评率</div>
              <div class="stat-value">{{ formatPercent(storeStats.positiveRate) }}</div>
            </div>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover" class="card">
        <div class="card-body">
          <div class="card-title">商品概览</div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">全部商品</div>
              <div class="stat-value">{{ formatNumber(productStats.totalCount) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">在售商品</div>
              <div class="stat-value">{{ formatNumber(storeStats.onSaleCount) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">停售商品</div>
              <div class="stat-value">{{ formatNumber(productStats.offSaleCount) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">新品上架</div>
              <div class="stat-value">{{ formatNumber(productStats.newestCount) }}</div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 今日账单卡片（合并：成交订单/金额/退单退款/净收入） -->
    <div class="cards">
      <el-card shadow="hover" class="card today-card">
        <div class="card-body">
          <div class="card-title">今日账单</div>
          <div class="today-summary">
            <div class="summary-row"><span>成交订单</span><span>{{ todayPaidCount }} 单</span></div>
            <div class="summary-row"><span>成交金额</span><span>¥ {{ formatAmount(todayPaidAmount) }}</span></div>
            <div class="summary-row"><span>退单/退款</span><span>{{ todayCancelledCount }} 单 · 退款 ¥ {{ formatAmount(todayRefundAmount) }}</span></div>
            <div class="summary-row net"><span>净收入</span><span>¥ {{ formatAmount(todayNetAmount) }}</span></div>
          </div>
          <div class="today-spark-row">
            <div class="spark-block">
              <div class="spark-title">订单成交小时分布</div>
              <svg :width="sparkWidth" :height="sparkHeight" @mouseenter="onPaidEnter" @mousemove="onPaidMove" @mouseleave="onPaidLeave">
                <polyline
                  :points="hourlyPaidPoints"
                  fill="none"
                  stroke="#67C23A"
                  stroke-width="2"
                />
                <g v-for="(p,i) in hourlyPaidCoords" :key="'pp'+i">
                  <circle
                    :cx="p.x"
                    :cy="p.y"
                    r="2.5"
                    fill="#67C23A"
                    @mouseenter="showPaidTip($event, p)"
                    @mouseleave="hidePaidTip"
                    @mousemove="movePaidTip"
                  />
                </g>
              </svg>
              <div
                v-if="paidTip.visible"
                class="spark-tooltip"
                :style="{ left: paidTip.x + 'px', top: paidTip.y + 'px' }"
              >
                <span class="dot" style="background:#67C23A;"></span>
                <span>{{ paidTip.hour }} 点 · {{ paidTip.value }} 单 · {{ paidTip.ratio }}%</span>
              </div>
            </div>
            <div class="spark-block">
              <div class="spark-title">订单取消/退款小时分布</div>
              <svg :width="sparkWidth" :height="sparkHeight" @mouseenter="onCancelEnter" @mousemove="onCancelMove" @mouseleave="onCancelLeave">
                <polyline
                  :points="hourlyCancelPoints"
                  fill="none"
                  stroke="#F56C6C"
                  stroke-width="2"
                />
                <g v-for="(p,i) in hourlyCancelCoords" :key="'cc'+i">
                  <circle
                    :cx="p.x"
                    :cy="p.y"
                    r="2.5"
                    fill="#F56C6C"
                    @mouseenter="showCancelTip($event, p)"
                    @mouseleave="hideCancelTip"
                    @mousemove="moveCancelTip"
                  />
                </g>
              </svg>
              <div
                v-if="cancelTip.visible"
                class="spark-tooltip"
                :style="{ left: cancelTip.x + 'px', top: cancelTip.y + 'px' }"
              >
                <span class="dot" style="background:#F56C6C;"></span>
                <span>{{ cancelTip.hour }} 点 · {{ cancelTip.value }} 单 · {{ cancelTip.ratio }}%</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 本月账单统计卡片（去重：不重复展示今日数据） -->
    <el-card shadow="hover" class="bill-card">
      <div class="card-body">
        <div class="card-title">本月账单统计</div>
        <div class="bill-grid">
          <div class="bill-group">
            <div class="bill-label">本月</div>
            <div class="bill-row"><span>收入</span><span>¥ {{ formatAmount(monthPaidAmount) }}</span></div>
            <div class="bill-row"><span>退款</span><span>¥ {{ formatAmount(monthRefundAmount) }}</span></div>
            <div class="bill-row net"><span>净收入</span><span>¥ {{ formatAmount(monthNetAmount) }}</span></div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 订单状态分布 与 最近7天趋势 并排展示 -->
    <div class="charts-row">
      <el-card shadow="hover" class="card">
        <div class="card-body">
          <div class="card-title">订单状态分布</div>
          <div class="status-grid">
            <div class="status-item" v-for="s in statusList" :key="s.key">
              <div class="status-name">{{ s.name }}</div>
              <div class="status-bar">
                <div class="status-fill" :style="{ width: s.percent + '%' }"></div>
              </div>
              <div class="status-value">{{ s.count }}</div>
            </div>
          </div>
        </div>
      </el-card>

      <el-card shadow="never" class="card">
        <div class="card-body">
          <div class="card-title">最近 7 天成交趋势（按支付时间）</div>
          <div class="trend">
            <svg :width="trendWidth" :height="trendHeight">
              <polyline
                :points="paidTrendPoints"
                fill="none"
                stroke="#409EFF"
                stroke-width="2"
              />
            </svg>
            <div class="trend-labels">
              <span v-for="(d,i) in last7DaysLabels" :key="i">{{ d }}</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 热销商品 Top5 -->
    <div class="cards">
      <el-card shadow="hover" class="card">
        <div class="card-body">
          <div class="card-title">热销商品 Top 5</div>
          <div v-if="popularItems.length === 0" class="empty-tip">暂无数据</div>
          <div class="popular-list" v-else>
            <div class="popular-item" v-for="p in popularItems" :key="p.itemId">
              <img :src="getProductImage(p)" class="popular-thumb" @error="onImgError" />
              <div class="popular-info">
                <div class="popular-title">{{ p.title }}</div>
                <div class="popular-meta">销量：{{ formatNumber(p.salesCount) }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import avatarUrl from '@/assets/images/avatar.png';
import { getOrdersByStatus, getOrderStatistics } from '@/api/order';
import axios from '../../axios';

// 店铺/商品统计
const user = JSON.parse(localStorage.getItem('user') || '{}');
const merchantId = ref(user?.merchantId || 0);
const storeStats = ref({ avgRating: 0, fansCount: 0, onSaleCount: 0, positiveRate: 0 });
const productStats = ref({ totalCount: 0, offSaleCount: 0, newestCount: 0 });
const popularItems = ref([]);

const formatNumber = (num) => {
  const n = Number(num || 0);
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return n.toString();
};
const formatRating = (r) => {
  const v = Number(r || 0);
  return v > 0 ? v.toFixed(1) : '—';
};
const formatPercent = (p) => {
  const v = Number(p || 0);
  // 后端为 0-1，若已是百分比则保留
  return v <= 1 ? (v * 100).toFixed(1) + '%' : v.toFixed(1) + '%';
};
const getProductImage = (product) => {
  const pics = String(product?.picUrl || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return product?.skuPic || pics[0] || avatarUrl;
};
const onImgError = (e) => { e.target.src = avatarUrl; };

const loadStoreAndProductStats = async () => {
  try {
    if (!merchantId.value) {
      const mLocal = JSON.parse(localStorage.getItem('merchant') || '{}');
      merchantId.value = mLocal?.merchantId || 0;
    }
    if (!merchantId.value) return;

    const tasks = [
      axios.get(`/merchant/${merchantId.value}/stats`),
      axios.get('/item', { params: { current: 1, size: 1, sellerId: merchantId.value } }),
      axios.get('/item', { params: { current: 1, size: 1, sellerId: merchantId.value, status: 2 } }),
      axios.get('/item/newest', { params: { current: 1, size: 1, sellerId: merchantId.value, status: 1 } }),
      axios.get('/item/popular', { params: { current: 1, size: 5, sellerId: merchantId.value, status: 1 } })
    ];
    const [statsResp, allResp, offResp, newestResp, popularResp] = await Promise.all(tasks);

    // 店铺统计
    if (statsResp?.data?.code === 200) {
      const s = statsResp.data.data || {};
      storeStats.value = {
        avgRating: s.avgRating || 0,
        fansCount: s.fansCount || 0,
        onSaleCount: s.onSaleCount || 0,
        positiveRate: s.positiveRate || 0
      };
    }

    // 商品统计（利用分页 total）
    productStats.value.totalCount = allResp?.data?.data?.total ?? 0;
    productStats.value.offSaleCount = offResp?.data?.data?.total ?? 0;
    productStats.value.newestCount = newestResp?.data?.data?.total ?? 0;

    // 热销Top5
    popularItems.value = Array.isArray(popularResp?.data?.data?.records)
      ? popularResp.data.data.records.map(item => ({
          itemId: item.itemId,
          title: item.title,
          skuPic: item.skuPic,
          picUrl: item.picUrl,
          salesCount: item.salesCount || 0
        }))
      : [];
  } catch (err) {
    console.error('加载店铺/商品统计失败:', err);
  }
};

// 今日：已支付（1）且 pay_time 是今天
const todayPaidCount = ref(0);
const todayPaidAmount = ref(0);
const hourlyPaidCounts = ref(Array.from({ length: 24 }, () => 0));

// 今日退单/退款：已取消（4），以 update_time 为时间依据；退款按已支付金额估算
const todayCancelledCount = ref(0);
const todayRefundAmount = ref(0);
const hourlyCancelCounts = ref(Array.from({ length: 24 }, () => 0));
const todayNetAmount = ref(0);

// 本月账单统计
const monthPaidAmount = ref(0);
const monthRefundAmount = ref(0);
const monthNetAmount = ref(0);

// 状态分布
const statistics = ref({ totalCount: 0, pendingPaymentCount: 0, paidCount: 0, shippedCount: 0, completedCount: 0, cancelledCount: 0 });
const statusList = computed(() => {
  const total = statistics.value.totalCount || 0;
  const entries = [
    { key: 'pendingPaymentCount', name: '待付款', count: statistics.value.pendingPaymentCount || 0 },
    { key: 'paidCount', name: '已支付', count: statistics.value.paidCount || 0 },
    { key: 'shippedCount', name: '已发货', count: statistics.value.shippedCount || 0 },
    { key: 'completedCount', name: '已完成', count: statistics.value.completedCount || 0 },
    { key: 'cancelledCount', name: '已取消', count: statistics.value.cancelledCount || 0 }
  ];
  return entries.map(e => ({ ...e, percent: total > 0 ? Math.round(e.count * 100 / total) : 0 }));
});

// 最近7天趋势（按已支付 pay_time）
const last7DaysLabels = ref([]);
const last7DaysPaidCounts = ref([]);

// 简易图表尺寸
const sparkWidth = 360;
const sparkHeight = 80;
const barWidth = 12;
const barGap = 3;
const barMax = computed(() => Math.max(1, Math.max(...hourlyPaidCounts.value, ...hourlyCancelCounts.value)));
const barHeight = (v) => Math.round((v / barMax.value) * (sparkHeight - 8));

const trendWidth = 520;
const trendHeight = 120;
const trendPadding = 10;
const paidTrendPoints = computed(() => {
  if (!last7DaysPaidCounts.value.length) return '';
  const max = Math.max(1, ...last7DaysPaidCounts.value);
  const stepX = (trendWidth - trendPadding * 2) / (last7DaysPaidCounts.value.length - 1);
  return last7DaysPaidCounts.value.map((v, i) => {
    const x = trendPadding + i * stepX;
    const y = trendHeight - trendPadding - (v / max) * (trendHeight - trendPadding * 2);
    return `${x},${y}`;
  }).join(' ');
});

// 小型折线图（今日小时分布）
const sparkPadding = 6;
const hourlyPaidPoints = computed(() => {
  const counts = hourlyPaidCounts.value || [];
  if (!counts.length) return '';
  const max = Math.max(1, ...counts);
  const stepX = (sparkWidth - sparkPadding * 2) / (counts.length - 1);
  return counts.map((v, i) => {
    const x = sparkPadding + i * stepX;
    const y = sparkHeight - sparkPadding - (v / max) * (sparkHeight - sparkPadding * 2);
    return `${x},${y}`;
  }).join(' ');
});

const hourlyCancelPoints = computed(() => {
  const counts = hourlyCancelCounts.value || [];
  if (!counts.length) return '';
  const max = Math.max(1, ...counts);
  const stepX = (sparkWidth - sparkPadding * 2) / (counts.length - 1);
  return counts.map((v, i) => {
    const x = sparkPadding + i * stepX;
    const y = sparkHeight - sparkPadding - (v / max) * (sparkHeight - sparkPadding * 2);
    return `${x},${y}`;
  }).join(' ');
});

// 坐标数组（用于渲染圆点与悬停）
const hourlyPaidCoords = computed(() => {
  const counts = hourlyPaidCounts.value || [];
  if (!counts.length) return [];
  const max = Math.max(1, ...counts);
  const stepX = (sparkWidth - sparkPadding * 2) / (counts.length - 1);
  return counts.map((v, i) => {
    const x = sparkPadding + i * stepX;
    const y = sparkHeight - sparkPadding - (v / max) * (sparkHeight - sparkPadding * 2);
    return { x, y, value: v, hour: i };
  });
});

const hourlyCancelCoords = computed(() => {
  const counts = hourlyCancelCounts.value || [];
  if (!counts.length) return [];
  const max = Math.max(1, ...counts);
  const stepX = (sparkWidth - sparkPadding * 2) / (counts.length - 1);
  return counts.map((v, i) => {
    const x = sparkPadding + i * stepX;
    const y = sparkHeight - sparkPadding - (v / max) * (sparkHeight - sparkPadding * 2);
    return { x, y, value: v, hour: i };
  });
});

// 悬浮提示状态与事件处理
const paidTip = ref({ visible: false, x: 0, y: 0, hour: 0, value: 0, ratio: 0 });
const cancelTip = ref({ visible: false, x: 0, y: 0, hour: 0, value: 0, ratio: 0 });

const showPaidTip = (evt, p) => {
  const host = evt.currentTarget.closest('.spark-block');
  const rect = host ? host.getBoundingClientRect() : evt.currentTarget.getBoundingClientRect();
  const sx = evt.clientX - rect.left;
  const sy = evt.clientY - rect.top;
  const max = Math.max(1, ...hourlyPaidCounts.value);
  paidTip.value = {
    visible: true,
    x: sx,
    y: sy,
    hour: p?.hour ?? 0,
    value: p?.value ?? 0,
    ratio: Math.round(((p?.value || 0) * 100) / max)
  };
};
const movePaidTip = (evt) => {
  if (!paidTip.value.visible) return;
  const host = evt.currentTarget.closest('.spark-block');
  const rect = host ? host.getBoundingClientRect() : evt.currentTarget.getBoundingClientRect();
  paidTip.value.x = evt.clientX - rect.left;
  paidTip.value.y = evt.clientY - rect.top;
};
const hidePaidTip = () => { paidTip.value.visible = false; };

const showCancelTip = (evt, p) => {
  const host = evt.currentTarget.closest('.spark-block');
  const rect = host ? host.getBoundingClientRect() : evt.currentTarget.getBoundingClientRect();
  const sx = evt.clientX - rect.left;
  const sy = evt.clientY - rect.top;
  const max = Math.max(1, ...hourlyCancelCounts.value);
  cancelTip.value = {
    visible: true,
    x: sx,
    y: sy,
    hour: p?.hour ?? 0,
    value: p?.value ?? 0,
    ratio: Math.round(((p?.value || 0) * 100) / max)
  };
};
const moveCancelTip = (evt) => {
  if (!cancelTip.value.visible) return;
  const host = evt.currentTarget.closest('.spark-block');
  const rect = host ? host.getBoundingClientRect() : evt.currentTarget.getBoundingClientRect();
  cancelTip.value.x = evt.clientX - rect.left;
  cancelTip.value.y = evt.clientY - rect.top;
};
const hideCancelTip = () => { cancelTip.value.visible = false; };

// 在 SVG 内根据鼠标位置选取最近点并显示提示
const pickNearest = (coords, mx, my) => {
  if (!coords || !coords.length) return null;
  let best = Infinity; let nearest = coords[0];
  for (const p of coords) {
    const dx = p.x - mx; const dy = p.y - my;
    const d = dx * dx + dy * dy;
    if (d < best) { best = d; nearest = p; }
  }
  return nearest;
};

const onPaidEnter = (evt) => { onPaidMove(evt); };
const onPaidMove = (evt) => {
  const svg = evt.currentTarget;
  const block = svg.closest('.spark-block');
  if (!svg || !block) return;
  const svgRect = svg.getBoundingClientRect();
  const blockRect = block.getBoundingClientRect();
  const mx = evt.clientX - svgRect.left;
  const my = evt.clientY - svgRect.top;
  const p = pickNearest(hourlyPaidCoords.value, mx, my);
  if (!p) return;
  const offsetX = svgRect.left - blockRect.left;
  const offsetY = svgRect.top - blockRect.top;
  const max = Math.max(1, ...hourlyPaidCounts.value);
  paidTip.value = {
    visible: true,
    x: offsetX + p.x,
    y: offsetY + p.y,
    hour: p.hour,
    value: p.value,
    ratio: Math.round(((p.value || 0) * 100) / max)
  };
};
const onPaidLeave = () => { paidTip.value.visible = false; };

const onCancelEnter = (evt) => { onCancelMove(evt); };
const onCancelMove = (evt) => {
  const svg = evt.currentTarget;
  const block = svg.closest('.spark-block');
  if (!svg || !block) return;
  const svgRect = svg.getBoundingClientRect();
  const blockRect = block.getBoundingClientRect();
  const mx = evt.clientX - svgRect.left;
  const my = evt.clientY - svgRect.top;
  const p = pickNearest(hourlyCancelCoords.value, mx, my);
  if (!p) return;
  const offsetX = svgRect.left - blockRect.left;
  const offsetY = svgRect.top - blockRect.top;
  const max = Math.max(1, ...hourlyCancelCounts.value);
  cancelTip.value = {
    visible: true,
    x: offsetX + p.x,
    y: offsetY + p.y,
    hour: p.hour,
    value: p.value,
    ratio: Math.round(((p.value || 0) * 100) / max)
  };
};
const onCancelLeave = () => { cancelTip.value.visible = false; };

const formatAmount = (n) => (n || 0).toFixed(2);

const isToday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
};

const getHour = (dateStr) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 0;
  return d.getHours();
};

const isSameMonth = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};

const computeLast7DaysPaid = (orders) => {
  const days = [];
  const counts = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(today);
    dt.setDate(today.getDate() - i);
    days.push(`${dt.getMonth() + 1}/${dt.getDate()}`);
    counts.push(0);
  }
  // 累加（按 pay_time 日期匹配）
  orders.forEach(o => {
    const rt = o?.payTime;
    if (!rt) return;
    const d = new Date(rt);
    if (Number.isNaN(d.getTime())) return;
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const idx = days.indexOf(label);
    if (idx >= 0) counts[idx]++;
  });
  last7DaysLabels.value = days;
  last7DaysPaidCounts.value = counts;
};

const loadData = async () => {
  try {
    // 状态分布
    const statsRes = await getOrderStatistics();
    statistics.value = statsRes?.data || statistics.value;

    // 已支付订单（用于今日与7天趋势）
    const paidRes = await getOrdersByStatus(1);
    const paidOrders = Array.isArray(paidRes?.data) ? paidRes.data : [];

    // 今日（按 pay_time）
    let paidCount = 0;
    let paidAmount = 0;
    const paidHours = Array.from({ length: 24 }, () => 0);
    paidOrders.forEach(o => {
      const pt = o?.payTime;
      if (!pt || !isToday(pt)) return;
      paidCount++;
      const pay = Number(o?.payAmount) || 0;
      paidAmount += pay;
      const h = getHour(pt);
      paidHours[h]++;
    });
    todayPaidCount.value = paidCount;
    todayPaidAmount.value = paidAmount;
    hourlyPaidCounts.value = paidHours;

    // 最近7天（按 pay_time）
    computeLast7DaysPaid(paidOrders);

    // 本月收入（按 pay_time）
    let mPaidAmount = 0;
    paidOrders.forEach(o => {
      const pt = o?.payTime;
      if (!pt || !isSameMonth(pt)) return;
      const pay = Number(o?.payAmount) || 0;
      mPaidAmount += pay;
    });

    // 今日退单/退款（已取消，按 update_time；退款按 payAmount>0 汇总）
    const cancelRes = await getOrdersByStatus(4);
    const cancelledOrders = Array.isArray(cancelRes?.data) ? cancelRes.data : [];
    let cancelCount = 0;
    let refundAmount = 0;
    const cancelHours = Array.from({ length: 24 }, () => 0);
    cancelledOrders.forEach(o => {
      const ut = o?.updateTime;
      if (!ut || !isToday(ut)) return;
      cancelCount++;
      const pay = Number(o?.payAmount) || 0;
      if (pay > 0) refundAmount += pay;
      const h = getHour(ut);
      cancelHours[h]++;
    });
    todayCancelledCount.value = cancelCount;
    todayRefundAmount.value = refundAmount;
    hourlyCancelCounts.value = cancelHours;
    // 今日净收入（成交金额 - 退款金额）
    todayNetAmount.value = (todayPaidAmount.value || 0) - (todayRefundAmount.value || 0);

    // 本月退款（按 update_time）
    let mRefundAmount = 0;
    cancelledOrders.forEach(o => {
      const ut = o?.updateTime;
      if (!ut || !isSameMonth(ut)) return;
      const pay = Number(o?.payAmount) || 0;
      if (pay > 0) mRefundAmount += pay;
    });

    monthPaidAmount.value = mPaidAmount;
    monthRefundAmount.value = mRefundAmount;
    monthNetAmount.value = (monthPaidAmount.value || 0) - (monthRefundAmount.value || 0);
  } catch (err) {
    console.error('加载店铺首页数据失败:', err);
    ElMessage.error('加载店铺首页数据失败');
  }
};

onMounted(async () => {
  await Promise.allSettled([
    loadStoreAndProductStats(),
    loadData()
  ]);
});
</script>

<style scoped>
.dashboard { padding: 12px; }
.header { display:flex; align-items:center; gap:12px; margin-bottom: 12px; }
.header h2 { margin:0; font-size: 18px; font-weight: 600; }
.tip { color:#6b7280; font-size: 12px; }

.cards { display:grid; grid-template-columns: 1fr; gap: 12px; }
.card { border-radius: 10px; }
.card-body { display:flex; flex-direction: column; gap:8px; }
.spark-block { position: relative; }
.spark-tooltip { position: absolute; pointer-events: none; z-index: 10; background: rgba(0,0,0,0.72); color: #fff; font-size: 12px; padding: 6px 8px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,.15); transform: translate(-50%, -120%); white-space: nowrap; }
.spark-tooltip .dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:6px; }
.card-title { font-size:14px; color:#374151; }
.card-value { font-size:22px; font-weight:700; color:#111827; }
.sub { font-size:12px; color:#6b7280; }

/* 概览样式 */
.stats-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.stat-item { background: #f8f9fa; border-radius: 8px; padding: 12px; display:flex; flex-direction: column; gap: 6px; }
.stat-label { font-size: 12px; color: #6b7280; }
.stat-value { font-size: 18px; font-weight: 600; color: #111827; }

/* 热销Top5 */
.popular-list { display: flex; flex-direction: column; gap: 10px; }
.popular-item { display: flex; gap: 10px; align-items: center; padding: 8px; background: #fafafa; border-radius: 8px; }
.popular-thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 6px; }
.popular-info { display:flex; flex-direction: column; }
.popular-title { font-weight: 600; color: #333; }
.popular-meta { font-size: 12px; color: #666; }
.empty-tip { color: #999; font-size: 13px; }

.sparkline { margin-top:6px; }
.spark-label { font-size:12px; color:#6b7280; margin-top:4px; }

.status-grid { display:grid; grid-template-columns: 1fr; gap:8px; }
.status-item { display:grid; grid-template-columns: 80px 1fr 48px; align-items:center; gap:8px; }
.status-name { font-size:13px; color:#374151; }
.status-bar { height:8px; background:#F3F4F6; border-radius:6px; overflow:hidden; }
.status-fill { height:100%; background:#60A5FA; }

.bill-card { margin-top:12px; }
.bill-grid { display:grid; grid-template-columns: 1fr; gap:12px; }
.bill-group { background:#F9FAFB; border-radius:8px; padding:10px; }
.bill-label { font-size:13px; font-weight:600; color:#374151; margin-bottom:6px; }
.bill-row { display:flex; justify-content:space-between; font-size:13px; color:#374151; padding:4px 0; }
.bill-row.net span:last-child { font-weight:700; color:#111827; }

/* 今日账单卡片样式 */

.today-summary { display:flex; flex-direction:column; gap:6px; }
.summary-row { display:flex; justify-content:space-between; font-size:13px; color:#374151; }
.summary-row.net span:last-child { font-weight:700; color:#111827; }
.today-spark-row { display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:8px; }

.spark-title { font-size:12px; color:#6b7280; margin-bottom:4px; }

.charts-row { display:grid; grid-template-columns: 408px 1fr; gap:12px; margin-top:12px; }
.trend { margin-top:6px; }
.trend-labels { display:flex; justify-content:space-between; font-size:12px; color:#6b7280; margin-top:4px; }
</style>