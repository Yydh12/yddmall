<template>
  <div class="publish-coupon">
    <div class="card">
      <h2>发布平台优惠券</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入优惠券标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" placeholder="可填写优惠说明" />
        </el-form-item>
        <el-form-item label="优惠类型" prop="discountType">
          <el-radio-group v-model="form.discountType">
            <el-radio :label="1">固定金额</el-radio>
            <el-radio :label="2">折扣百分比</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="form.discountType === 2 ? '折扣百分比(%)' : '优惠金额(元)'" prop="discountValue">
          <el-input-number v-model="form.discountValue" :min="minDiscount" :max="maxDiscount" :step="form.discountType === 2 ? 1 : 0.5" :precision="form.discountType === 2 ? 0 : 2" />
        </el-form-item>
        <el-form-item label="使用门槛(元)">
          <el-input-number v-model="form.minSpend" :min="0" :step="1" :precision="2" />
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
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { createCoupon } from '@/api/discount'

const formRef = ref()
const submitting = ref(false)

const form = ref({
  title: '',
  description: '',
  discountType: 1,
  discountValue: 10,
  minSpend: 0,
  totalCount: 100,
  perUserLimit: 1,
  startTime: null,
  endTime: null,
  status: 1
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

const minDiscount = computed(() => form.value.discountType === 2 ? 1 : 0.01)
const maxDiscount = computed(() => form.value.discountType === 2 ? 99 : 100000)

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  discountType: [{ required: true, message: '请选择优惠类型', trigger: 'change' }],
  discountValue: [{ required: true, message: '请输入优惠值', trigger: 'change' }],
  totalCount: [{ required: true, message: '请输入总数量', trigger: 'change' }],
  perUserLimit: [{ required: true, message: '请输入每用户限领', trigger: 'change' }],
}

const onSubmit = async () => {
  try { await formRef.value.validate() } catch { return }
  submitting.value = true
  try {
    // 折扣百分比后端以整数传入，例如 15 表示15%
    const payload = { ...form.value }
    const res = await createCoupon(payload)
    console.log("发布优惠券响应:", res)
    if (res && res.code === 200) {
      ElMessage.success('优惠券发布成功')
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
    title: '', description: '', discountType: 1, discountValue: 10,
    minSpend: 0, totalCount: 100, perUserLimit: 1,
    startTime: null, endTime: null, status: 1
  }
  enabled.value = true
  timeRange.value = []
}
</script>

<style scoped>
.publish-coupon { padding: 16px; }
.card {
  max-width: 720px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}
.card h2 { margin: 0 0 16px; }
</style>