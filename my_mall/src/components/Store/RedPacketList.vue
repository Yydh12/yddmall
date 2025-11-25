<template>
  <div class="redpacket-list">
    <div class="card">
      <div class="header">
        <h2>红包列表 / 发布记录</h2>
        <el-button type="primary" @click="refresh" :loading="loading">刷新</el-button>
      </div>
      <el-table :data="rows" v-loading="loading" border style="width: 100%">
        <el-table-column prop="title" label="标题" min-width="140" />
        <el-table-column prop="amount" label="金额(元)" width="120">
          <template #default="{ row }">
            <span>¥{{ Number(row.amount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalCount" label="总数量" width="100" />
        <el-table-column prop="remainingCount" label="剩余" width="100" />
        <el-table-column prop="perUserLimit" label="每用户限领" width="120" />
        <el-table-column prop="startTime" label="开始时间" min-width="160" />
        <el-table-column prop="endTime" label="结束时间" min-width="160" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="220">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button
              v-if="row.status === 1"
              type="warning"
              size="small"
              @click="changeStatus(row, 0)"
            >停用</el-button>
            <el-button
              v-else
              type="success"
              size="small"
              @click="changeStatus(row, 1)"
            >启用</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="editVisible" title="编辑红包" width="520">
      <el-form :model="editForm" :rules="rules" ref="editFormRef" label-width="110px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="editForm.title" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="金额(元)" prop="amount">
          <el-input-number v-model="editForm.amount" :min="0.01" :max="100000" :step="0.5" />
        </el-form-item>
        <el-form-item label="总数量" prop="totalCount">
          <el-input-number v-model="editForm.totalCount" :min="1" :max="100000" />
        </el-form-item>
        <el-form-item label="每用户限领" prop="perUserLimit">
          <el-input-number v-model="editForm.perUserLimit" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="有效期" prop="timeRange">
          <el-date-picker v-model="timeRange" type="datetimerange" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="enabled" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
  
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { listPublishedRedPackets, updateRedPacket, enableRedPacket, disableRedPacket } from '@/api/discount'

const rows = ref([])
const loading = ref(false)

const editVisible = ref(false)
const saving = ref(false)
const editFormRef = ref()
const editForm = ref({ id: null, title: '', amount: 0, totalCount: 0, perUserLimit: 1, startTime: null, endTime: null, status: 1 })
const enabled = ref(true)
const timeRange = ref([])

watch(enabled, (val) => { editForm.value.status = val ? 1 : 0 })
watch(timeRange, (val) => {
  if (Array.isArray(val) && val.length === 2) {
    editForm.value.startTime = val[0]
    editForm.value.endTime = val[1]
  } else {
    editForm.value.startTime = null
    editForm.value.endTime = null
  }
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'change' }],
  totalCount: [{ required: true, message: '请输入总数量', trigger: 'change' }],
  perUserLimit: [{ required: true, message: '请输入每用户限领', trigger: 'change' }],
}

const refresh = async () => {
  loading.value = true
  try {
    const { data } = await listPublishedRedPackets()
    console.log("原始响应:", data)
    rows.value = data|| []
    console.log("红包列表:", rows.value)
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const openEdit = (row) => {
  editForm.value = {
    id: row.id,
    title: row.title,
    amount: row.amount,
    totalCount: row.totalCount,
    perUserLimit: row.perUserLimit,
    startTime: row.startTime,
    endTime: row.endTime,
    status: row.status ?? 1
  }
  enabled.value = editForm.value.status === 1
  timeRange.value = [row.startTime, row.endTime].filter(Boolean)
  editVisible.value = true
}

const onSave = async () => {
  try { await editFormRef.value.validate() } catch { return }
  saving.value = true
  try {
    const payload = { ...editForm.value }
    const res = await updateRedPacket(payload)
    if (res && res.code === 200) {
      ElMessage.success('保存成功')
      editVisible.value = false
      refresh()
    } else {
      ElMessage.error(res?.msg || '保存失败')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const changeStatus = async (row, status) => {
  try {
    const fn = status === 1 ? enableRedPacket : disableRedPacket
    const res = await fn(row.id)
    if (res && res.code === 200) {
      ElMessage.success('操作成功')
      refresh()
    } else {
      ElMessage.error(res?.msg || '操作失败')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e.message || '操作失败')
  }
}

onMounted(refresh)
</script>

<style scoped>
.redpacket-list { padding: 16px; }
.card { background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
.header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
</style>
