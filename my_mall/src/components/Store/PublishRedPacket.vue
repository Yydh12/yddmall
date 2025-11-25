<template>
  <div class="publish-redpacket">
    <Navbar />
    <div class="card">
      <h2>发布红包</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入红包标题" />
        </el-form-item>
        <el-form-item label="金额(元)" prop="amount">
          <el-input-number v-model="form.amount" :min="0.01" :step="0.5" :precision="2" />
        </el-form-item>
        <el-form-item label="总数量" prop="totalCount">
          <el-input-number v-model="form.totalCount" :min="1" />
        </el-form-item>
        <el-form-item label="每用户限领" prop="perUserLimit">
          <el-input-number v-model="form.perUserLimit" :min="1" />
        </el-form-item>
        <el-form-item label="有效期" prop="timeRange">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            :unlink-panels="true"
          />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="enabled" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="onSubmit">发布</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import Navbar from '@/components/Home/Navbar.vue'
import { createRedPacket } from '@/api/discount'

const formRef = ref()
const submitting = ref(false)

const form = ref({
  title: '',
  amount: 10.00,
  totalCount: 100,
  perUserLimit: 1,
  startTime: null,
  endTime: null,
  status: 1,
  merchantId: null // 管理员发布时可在高级入口指定；商家无需填写
})

const enabled = ref(true)
watch(enabled, (val) => { form.value.status = val ? 1 : 0 })

const timeRange = ref([])
watch(timeRange, (val) => {
  if (Array.isArray(val) && val.length === 2) {
    form.value.startTime = val[0]
    form.value.endTime = val[1]
  } else {
    form.value.startTime = null
    form.value.endTime = null
  }
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'change' }],
  totalCount: [{ required: true, message: '请输入总数量', trigger: 'change' }],
  perUserLimit: [{ required: true, message: '请输入每用户限领', trigger: 'change' }],
}

const onSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }
  submitting.value = true
  try {
    const payload = { ...form.value }
    const res = await createRedPacket(payload)
    console.log("发布红包响应:", res)
    if (res && (res.code === 200 || res?.data)) {
      ElMessage.success('红包发布成功')
      onReset()
    } else {
      ElMessage.error(res?.message || res?.msg || '发布失败')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e.message || '发布失败')
  } finally {
    submitting.value = false
  }
}

const onReset = () => {
  form.value = {
    title: '', amount: 10.00, totalCount: 100, perUserLimit: 1,
    startTime: null, endTime: null, status: 1, merchantId: null
  }
  enabled.value = true
  timeRange.value = []
}
</script>

<style scoped>
.publish-redpacket { padding: 16px; }
.card {
  max-width: 720px;
  margin: 16px auto;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}
.card h2 { margin: 0 0 16px; }
</style>