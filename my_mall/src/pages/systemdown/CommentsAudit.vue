<template>
  <div class="audit-container">
    <div class="toolbar">
      <h2>评论审核</h2>
      <div class="filters">
        <el-select v-model="statusFilter" placeholder="筛选状态" size="small" style="width: 140px" @change="applyFilter">
          <el-option label="全部" :value="'all'" />
          <el-option label="正常" :value="'1'" />
          <el-option label="隐藏" :value="'0'" />
        </el-select>
        <el-button size="small" type="primary" @click="refresh">刷新</el-button>
      </div>
    </div>

    <el-table :data="displayRecords" v-loading="loading" border style="width: 100%">
      <el-table-column prop="userName" label="用户" width="160" />
      <el-table-column label="商品" min-width="240">
        <template #default="{ row }">
          <div class="item-info">
            <span class="item-title">{{ row.itemTitle }}</span>
            <span class="item-no" v-if="row.itemNo">[{{ row.itemNo }}]</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="rating" label="评分" width="90" />
      <el-table-column prop="content" label="评论内容" min-width="260" />
      <el-table-column prop="replyContent" label="商家回复" min-width="220" />
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '正常' : '隐藏' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="时间" width="180">
        <template #default="{ row }">
          <span>{{ formatTime(row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="success" @click="approve(row)" :disabled="row.status === 1">通过</el-button>
          <el-button size="small" @click="reject(row)" :disabled="row.status === 0">隐藏</el-button>
          <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        background
        layout="prev, pager, next, sizes, total"
        :total="total"
        :current-page="page"
        :page-size="size"
        @current-change="onPageChange"
        @size-change="onSizeChange"
      />
    </div>
  </div>
  
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from '../../axios.js';
import { ElMessage, ElMessageBox } from 'element-plus';

const loading = ref(false);
const records = ref([]);
const displayRecords = computed(() => {
  if (statusFilter.value === 'all') return records.value;
  const target = Number(statusFilter.value);
  return records.value.filter(r => r.status === target);
});
const total = ref(0);
const page = ref(1);
const size = ref(10);
const statusFilter = ref('all');

const fetchComments = async () => {
  try {
    loading.value = true;
    const { data } = await axios.get('/comment/store/all', { params: { current: page.value, size: size.value } });
    // 后端统一返回 { code, message, data }
    const res = data?.data || {};
    records.value = res.records || [];
    total.value = res.total || 0;
    console.log('Fetched comments:', records.value); // 添加日志输出
  } catch (e) {
    ElMessage.error('加载评论失败');
  } finally {
    loading.value = false;
  }
};

const approve = async (row) => {
  try {
    const { data } = await axios.post(`/comment/${row.commentId}/approve`);
    if (data?.code === 200) {
      ElMessage.success('已通过');
      statusFilter.value = 'all'; // 重置筛选器为全部
      await fetchComments();
    } else {
      ElMessage.error(data?.message || '操作失败');
    }
  } catch (e) {
    ElMessage.error('操作失败');
  }
};

const reject = async (row) => {
  try {
    const { data } = await axios.post(`/comment/${row.commentId}/reject`);
    if (data?.code === 200) {
      ElMessage.success('已隐藏');
      statusFilter.value = 'all'; // 重置筛选器为全部
      await fetchComments();
    } else {
      ElMessage.error(data?.message || '操作失败');
    }
  } catch (e) {
    ElMessage.error('操作失败');
  }
};

const remove = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该评论吗？此操作不可恢复', '删除确认', { type: 'warning' });
    const { data } = await axios.delete(`/comment/${row.commentId}`);
    if (data?.code === 200) {
      ElMessage.success('删除成功');
      await fetchComments();
    } else {
      ElMessage.error(data?.message || '删除失败');
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败');
  }
};

const refresh = () => fetchComments();
const applyFilter = () => { page.value = 1; fetchComments(); };
const onPageChange = (p) => { page.value = p; fetchComments(); };
const onSizeChange = (s) => { size.value = s; fetchComments(); };

const formatTime = (t) => {
  if (!t) return '-';
  // 兼容 ISO 字符串或本地时间格式
  try { return new Date(t).toLocaleString(); } catch { return String(t); }
};

onMounted(fetchComments);
</script>

<style scoped>
.audit-container { padding: 12px; }
.toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.filters { display: flex; gap: 8px; align-items: center; }
.item-info { display: flex; gap: 6px; align-items: center; }
.item-title { font-weight: 500; }
.item-no { color: #64748b; }
.pagination { display: flex; justify-content: flex-end; margin-top: 12px; }
</style>