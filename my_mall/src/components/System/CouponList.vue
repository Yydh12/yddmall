<template>
  <div class="coupon-list">
    <div class="toolbar">
      <el-input v-model="searchTitle" placeholder="按标题搜索" clearable style="width: 240px" />
      <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 160px; margin-left: 12px;">
        <el-option :value="undefined" label="全部" />
        <el-option :value="1" label="启用" />
        <el-option :value="0" label="停用" />
      </el-select>
      <el-button type="primary" style="margin-left: 12px" @click="fetchCoupons">刷新</el-button>
    </div>

    <el-table :data="filteredCoupons" stripe border style="width: 100%;" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="标题" min-width="160" />
      <el-table-column label="类型" width="120">
        <template #default="{ row }">
          <el-tag :type="row.discountType === 1 ? 'success' : 'warning'">
            {{ row.discountType === 1 ? '固定金额' : '折扣百分比' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="面值/折扣" width="140">
        <template #default="{ row }">
          <span v-if="row.discountType === 1">￥{{ formatMoney(row.discountValue) }}</span>
          <span v-else>{{ formatPercent(row.discountValue) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="门槛" width="120">
        <template #default="{ row }">￥{{ formatMoney(row.minSpend) }}</template>
      </el-table-column>
      <el-table-column prop="totalCount" label="总量" width="100" />
      <el-table-column prop="remainingCount" label="剩余" width="100" />
      <el-table-column prop="perUserLimit" label="每人限领" width="120" />
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="有效期" min-width="220">
        <template #default="{ row }">
          <span>{{ formatPeriod(row.startTime, row.endTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" min-width="180">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="success" :disabled="row.status === 1" @click="enable(row)">启用</el-button>
          <el-button size="small" type="danger" :disabled="row.status === 0" @click="disable(row)">停用</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="editVisible" title="编辑优惠券" width="640px" :close-on-click-modal="false">
      <el-form :model="editForm" label-width="110px">
        <el-form-item label="标题">
          <el-input v-model="editForm.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="描述（可选）" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="editForm.discountType">
            <el-radio :label="1">固定金额</el-radio>
            <el-radio :label="2">折扣百分比</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="面值/折扣">
          <el-input-number v-model="editForm.discountValue" :min="0" :precision="editForm.discountType === 1 ? 2 : 0" :step="editForm.discountType === 1 ? 1 : 1" />
          <span class="input-hint" v-if="editForm.discountType === 2" style="margin-left:8px;">单位：%</span>
        </el-form-item>
        <el-form-item label="使用门槛">
          <el-input-number v-model="editForm.minSpend" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="总量">
          <el-input-number v-model="editForm.totalCount" :min="1" />
        </el-form-item>
        <el-form-item label="每人限领">
          <el-input-number v-model="editForm.perUserLimit" :min="1" />
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker v-model="dateRange" type="datetimerange" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEdit" :loading="saving">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { listAllCoupons, updateCoupon, enableCoupon, disableCoupon } from '../../api/discount';

const loading = ref(false);
const coupons = ref([]);
const searchTitle = ref('');
// undefined 表示全部
const filterStatus = ref(undefined);

const editVisible = ref(false);
const editForm = ref({});
const dateRange = ref([]);
const saving = ref(false);

const fetchCoupons = async () => {
  loading.value = true;
  try {
    const res = await listAllCoupons();
    coupons.value = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
  } catch (e) {
    ElMessage.error('获取优惠券列表失败');
  } finally {
    loading.value = false;
  }
};

const filteredCoupons = computed(() => {
  return coupons.value.filter(c => {
    const matchTitle = !searchTitle.value || (c.title || '').includes(searchTitle.value);
    const matchStatus = filterStatus.value === undefined || c.status === filterStatus.value;
    return matchTitle && matchStatus;
  });
});

const openEdit = (row) => {
  editForm.value = {
    id: row.id,
    title: row.title,
    description: row.description,
    discountType: row.discountType,
    discountValue: normalizeNumber(row.discountValue),
    minSpend: normalizeNumber(row.minSpend),
    totalCount: row.totalCount,
    perUserLimit: row.perUserLimit,
    startTime: row.startTime,
    endTime: row.endTime,
  };
  dateRange.value = [row.startTime || '', row.endTime || ''].filter(Boolean);
  editVisible.value = true;
};

const submitEdit = async () => {
  if (!editForm.value.id) {
    ElMessage.error('缺少优惠券ID');
    return;
  }
  // 写回时间范围
  if (Array.isArray(dateRange.value) && dateRange.value.length === 2) {
    editForm.value.startTime = dateRange.value[0];
    editForm.value.endTime = dateRange.value[1];
  } else {
    editForm.value.startTime = null;
    editForm.value.endTime = null;
  }

  saving.value = true;
  try {
    const payload = { ...editForm.value };
    // 后端不允许直接更新 remainingCount/createdBy，这里不传
    delete payload.remainingCount;
    delete payload.createdBy;
    const res = await updateCoupon(payload);
    if (res && (res.code === 200 || res?.data?.code === 200)) {
      ElMessage.success('保存成功');
      editVisible.value = false;
      await fetchCoupons();
    } else {
      ElMessage.error(res?.message || res?.data?.message || '保存失败');
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

const enable = async (row) => {
  try {
    await ElMessageBox.confirm(`确认启用优惠券「${row.title}」?`, '提示', { type: 'warning' });
    const res = await enableCoupon(row.id);
    if (res && (res.code === 200 || res?.data?.code === 200)) {
      ElMessage.success('已启用');
      await fetchCoupons();
    } else {
      ElMessage.error(res?.message || res?.data?.message || '操作失败');
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e?.response?.data?.message || e.message || '操作失败');
  }
};

const disable = async (row) => {
  try {
    await ElMessageBox.confirm(`确认停用优惠券「${row.title}」?`, '提示', { type: 'warning' });
    const res = await disableCoupon(row.id);
    if (res && (res.code === 200 || res?.data?.code === 200)) {
      ElMessage.success('已停用');
      await fetchCoupons();
    } else {
      ElMessage.error(res?.message || res?.data?.message || '操作失败');
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e?.response?.data?.message || e.message || '操作失败');
  }
};

const formatMoney = (val) => {
  if (val == null) return '0.00';
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  return n.toFixed(2);
};

const formatPercent = (val) => {
  if (val == null) return '-';
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  return `${n}%`;
};

const formatDate = (ts) => {
  if (!ts) return '-';
  try {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}`;
  } catch {
    return String(ts);
  }
};

const formatPeriod = (start, end) => {
  const s = formatDate(start);
  const e = formatDate(end);
  if (s === '-' && e === '-') return '不限';
  return `${s} 至 ${e}`;
};

const normalizeNumber = (val) => {
  if (val == null) return null;
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
};

fetchCoupons();
</script>

<style scoped>
.coupon-list {
  display: flex;
  flex-direction: column;
}
.toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
</style>