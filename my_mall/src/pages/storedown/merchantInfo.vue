<template>
  <div class="merchant-info-page">
    <!-- 顶部通栏 -->
    <div class="header-bar">
      <div class="header-left">
        <el-avatar :src="merchant.merchantPic || ''" :size="56" class="store-avatar">
          {{ (merchant.merchantName || '店').slice(0, 1) }}
        </el-avatar>
        <div class="store-info">
          <div class="store-name">{{ merchant.merchantName || '未命名店铺' }}</div>
          <div class="store-status" :class="merchant.status === 1 ? 'open' : 'paused'">
            {{ merchant.status === 1 ? '营业中' : '已暂停' }}
          </div>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="openEdit" class="btn-edit">编辑店铺信息</el-button>
        <el-button v-if="merchant.status === 1" type="warning" @click="toggleStatus(0)" class="btn-pause">暂停营业</el-button>
        <el-button v-if="merchant.status === 0" type="success" @click="toggleStatus(1)" class="btn-resume">恢复营业</el-button>
      </div>
    </div>

    <!-- 内容卡片区域 -->
    <div class="content-container">
      <!-- 基础信息卡片 -->
      <el-card class="info-card base-info-card" shadow="hover">
        <div class="card-header">基础信息</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="label">店铺名称</div>
            <div class="value">{{ merchant.merchantName || '暂无数据' }}</div>
          </div>
          <div class="info-item">
            <div class="label">店铺编号</div>
            <div class="value">{{ merchant.merchantNo || merchant.merchantId || '暂无数据' }}</div>
          </div>
          <div class="info-item">
            <div class="label">联系人</div>
            <div class="value">{{ merchant.contactPerson || '暂无数据' }}</div>
          </div>
          <div class="info-item">
            <div class="label">联系电话</div>
            <div class="value">{{ merchant.contactPhone || '暂无数据' }}</div>
          </div>
        </div>
      </el-card>

      <!-- 地址信息卡片 -->
      <el-card class="info-card address-card" shadow="hover">
        <div class="card-header">联系地址</div>
        <div class="info-grid address-grid">
          <div class="info-item address-item">
            <div class="label">详细地址</div>
            <div class="value">{{ merchant.address || '暂无数据' }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editVisible" title="编辑店铺信息" width="520px" :close-on-click-modal="false" class="edit-dialog">
      <div v-loading="editLoading">
        <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="96px">
          <el-form-item label="店铺头像">
            <div class="avatar-upload">
              <el-avatar :src="editForm.merchantPic || merchant.merchantPic || ''" :size="64" class="avatar-preview">
                {{ (merchant.merchantName || '店').slice(0, 1) }}
              </el-avatar>
              <div class="avatar-actions">
                <el-upload
                  class="avatar-uploader"
                  :show-file-list="false"
                  :http-request="uploadAvatar"
                  :before-upload="beforeAvatarUpload"
                  :disabled="editLoading || avatarUploading"
                >
                  <el-button type="primary" :loading="avatarUploading" :disabled="editLoading">更换头像</el-button>
                </el-upload>
                <div v-if="avatarError" class="avatar-error">{{ avatarError }}</div>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="店铺名称" prop="merchantName">
            <el-input v-model="editForm.merchantName" placeholder="请输入店铺名称" :disabled="editLoading" class="form-input" />
          </el-form-item>
          <el-form-item label="联系人" prop="contactPerson">
            <el-input v-model="editForm.contactPerson" placeholder="请输入联系人" :disabled="editLoading" class="form-input" />
          </el-form-item>
          <el-form-item label="联系电话" prop="contactPhone">
            <el-input v-model="editForm.contactPhone" placeholder="请输入联系电话" :disabled="editLoading" class="form-input" />
          </el-form-item>
          <!-- 地址输入统一使用地图地址选择器 -->
          <el-form-item label="地址">
            <AddressPicker 
              v-model="addressPicker"
              :region-options="regionOptions"
              v-model:detailAddress="addressForm.detailAddress"
              @update:modelValue="handleAddressPickerChange"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="onEditCancel" :disabled="editLoading" class="btn-cancel">取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="editLoading" class="btn-save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from '../../axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import AddressPicker from '@/components/Common/AddressPicker.vue'
import { useRegionPicker } from '@/utils/useRegionPicker'

const user = JSON.parse(localStorage.getItem('user') || '{}')

const merchant = ref({
  merchantId: undefined,
  merchantName: '',
  contactPerson: '',
  contactPhone: '',
  address: '',
  status: 1,
  merchantPic: ''
})

const editVisible = ref(false)
const editLoading = ref(false)
const editFormRef = ref()
const editForm = ref({
  merchantName: '',
  contactPerson: '',
  contactPhone: '',
  regionCodes: [],
  addressDetailed: '',
  merchantPic: '',
  lat: null,
  lng: null
})

// ****** 1. 编辑弹窗地址表单（同结算页） ******
const addressForm = reactive({
  receiverName: '',          // 联系人 <=> editForm.contactPerson
  receiverPhone: '',         // 手机号 <=> editForm.contactPhone
  region: [],                // 省市区编码
  detailAddress: '',         // 详细地址
  lat: null,
  lng: null
})

// ****** 2. 地图选择器（同结算页） ******
const { regionOptions, labelsFromPath, pathFromLabels, createAddressPicker, bindPickerToForm } = useRegionPicker()
const addressPicker = createAddressPicker({
  selected: { value: [] },
  onAreaChange: (codes) => { addressForm.region = codes }
})
bindPickerToForm(addressPicker, addressForm)   // 自动同步 region/detailAddress/lat/lng

const contactPersonPattern = /^[\u4e00-\u9fa5a-zA-Z·\s]{2,20}$/
const mobilePattern = /^1[3-9]\d{9}$/

const normalizeString = (s) => (s ?? '').toString().trim().replace(/\s+/g, ' ')
const trimPayload = (payload) => {
  const out = {}
  Object.keys(payload).forEach(k => {
    const v = payload[k]
    out[k] = typeof v === 'string' ? normalizeString(v) : v
  })
  return out
}

const validateAddressChars = (rule, value, callback) => {
  const v = normalizeString(value || '')
  const forbidden = /[<>\[\]{}!@%^*_+=?~|$]/
  if (forbidden.test(v)) {
    callback(new Error('地址不允许包含特殊符号'))
    return
  }
  callback()
}

const editRules = {
  merchantName: [
    { required: true, message: '请填写店铺名称', trigger: 'blur' },
    { min: 2, max: 30, message: '店铺名称长度为2-30字符', trigger: 'blur' }
  ],
  contactPerson: [
    { required: true, message: '请填写联系人', trigger: 'blur' },
    { pattern: contactPersonPattern, message: '联系人为中文或英文，2-20字符', trigger: 'blur' }
  ],
  contactPhone: [
    { required: true, message: '请填写联系电话', trigger: 'blur' },
    { pattern: mobilePattern, message: '请输入有效的手机号', trigger: 'blur' }
  ],
  addressDetailed: [
    { required: true, message: '请填写详细地址', trigger: 'blur' },
    { min: 5, max: 100, message: '详细地址长度为5-100字符', trigger: 'blur' },
    { validator: validateAddressChars, trigger: 'blur' }
  ]
}

const fetchMerchant = async () => {
  try {
    const { data } = await axios.get(`/merchant/getMerchant/${user.merchantId}`)
    if (data?.code === 200) {
      merchant.value = data.data || merchant.value
    }
  } catch (err) {
    console.error(err)
  }
}

const openEdit = () => {
  editForm.value = {
    merchantName: merchant.value.merchantName || '',
    contactPerson: merchant.value.contactPerson || '',
    contactPhone: merchant.value.contactPhone || '',
    regionCodes: [],
    addressDetailed: merchant.value.address || '',
    merchantPic: merchant.value.merchantPic || '',
    lat: null,
    lng: null
  }
  editVisible.value = true

  // ****** 3. 把当前地址拆成表单需要格式 ******
  addressForm.receiverName = merchant.value.contactPerson || ''
  addressForm.receiverPhone = merchant.value.contactPhone || ''
  addressForm.detailAddress = merchant.value.address || ''
  addressForm.lat = null
  addressForm.lng = null
  const { codes } = parseRegionFromText(merchant.value.address || '')
  addressForm.region = codes
  addressPicker.selected.value = codes
}

const parseRegionFromText = (text) => {
  const original = (text || '').trim()
  if (!original) return { codes: [], detail: '' }
  let forMatch = original.replace(/[,\s.。/、-]/g, '')
  let forDetail = original

  const provinces = regionOptions || []
  const pNode = longestNodeMatch(forMatch, provinces)
  if (pNode) {
    forMatch = forMatch.replace(pNode.label, '')
    forDetail = forDetail.replace(pNode.label, '')
  }

  const cities = pNode?.children || []
  const cNode = longestNodeMatch(forMatch, cities)
  if (cNode) {
    forMatch = forMatch.replace(cNode.label, '')
    forDetail = forDetail.replace(cNode.label, '')
  }

  const districts = cNode?.children || []
  const dNode = longestNodeMatch(forMatch, districts)
  if (dNode) {
    forMatch = forMatch.replace(dNode.label, '')
    forDetail = forDetail.replace(dNode.label, '')
  }

  const codes = [pNode?.value, cNode?.value, dNode?.value].filter(Boolean)
  const detail = forDetail.trim()
  return { codes, detail }
}

const longestNodeMatch = (text, nodes) => {
  let best = null
  for (const n of nodes || []) {
    const label = (n?.label || '').toString().trim()
    if (!label) continue
    if (text.includes(label)) {
      if (!best || label.length > (best.label || '').length) best = n
    }
  }
  return best
}

const onEditCancel = () => {
  editVisible.value = false
  editFormRef.value?.resetFields()
}

const submitEdit = () => {
  editFormRef.value?.validate(async (valid) => {
    if (!valid) return
    editLoading.value = true

    // ****** 4. 把 addressForm 同步回 editForm ******
    const labels = labelsFromPath(addressForm.region)
    editForm.value.regionCodes = addressForm.region
    editForm.value.addressDetailed = addressForm.detailAddress
    editForm.value.lat = addressForm.lat
    editForm.value.lng = addressForm.lng

    const regionText = labels.join(' ')
    const addressCombined = [regionText, addressForm.detailAddress]
                              .filter(Boolean)
                              .join(' ')
    const payload = trimPayload({
      merchantId: merchant.value.merchantId,
      merchantName: editForm.value.merchantName,
      contactPerson: addressForm.receiverName,
      contactPhone: addressForm.receiverPhone,
      address: addressCombined
    })

    try {
      const { data } = await axios.put('/merchant', payload)
      if (data?.code === 200) {
        merchant.value = { ...merchant.value, ...payload }
        ElMessage.success('店铺信息已更新')
        editVisible.value = false
      } else {
        ElMessage.error(data?.msg || '更新失败')
      }
    } catch (e) {
      ElMessage.error('更新失败')
    } finally {
      editLoading.value = false
    }
  })
}

const toggleStatus = async (nextStatus) => {
  const text = nextStatus === 1 ? '恢复营业' : '暂停营业'
  try {
    await ElMessageBox.confirm(`确定${text}吗？`, '提示', { type: 'warning' })
    const { data } = await axios.put('/merchant', { merchantId: merchant.value.merchantId, status: nextStatus })
    if (data?.code === 200) {
      merchant.value.status = nextStatus
      ElMessage.success(`${text}成功`)
    } else {
      ElMessage.error(data?.msg || `${text}失败`)
    }
  } catch (err) {
    // 点击取消或异常
  }
}

onMounted(() => {
  fetchMerchant()
})

const avatarUploading = ref(false)
const avatarError = ref('')

const beforeAvatarUpload = (file) => {
  const isImg = /^image\/(png|jpeg|jpg|webp)$/.test(file.type)
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImg) ElMessage.error('仅支持 PNG/JPEG/WEBP 图片')
  if (!isLt2M) ElMessage.error('图片大小需小于 2MB')
  return isImg && isLt2M
}

const uploadAvatar = async ({ file, onSuccess, onError }) => {
  try {
    avatarError.value = ''
    avatarUploading.value = true
    const oldPic = merchant.value.merchantPic || ''
    const fd = new FormData()
    fd.append('file', file)
    fd.append('merchantId', merchant.value.merchantId)
    if (merchant.value.merchantNo) {
      fd.append('merchantNo', merchant.value.merchantNo)
    }
    const res = await axios.post('/merchant/image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true
    })
    if (res?.data?.code === 200) {
      const url = res.data.data
      editForm.value.merchantPic = url
      merchant.value.merchantPic = url
      ElMessage.success('头像更新成功')
      onSuccess && onSuccess(res.data)

      try {
        if (oldPic && !oldPic.startsWith('data:image') && oldPic !== url) {
          const fileName = oldPic.substring(oldPic.lastIndexOf('/') + 1)
          const sessionUser = JSON.parse(sessionStorage.getItem('user') || '{}')
          await axios.delete('/merchant/image', {
            params: {
              imageUrl: oldPic,
              fileName,
              userId: sessionUser.userId
            },
            withCredentials: true
          })
        }
      } catch (delErr) {
        console.warn('原头像删除失败:', delErr)
      }
    } else {
      const msg = res?.data?.message || res?.data?.msg || res?.data?.error || '上传失败'
      avatarError.value = msg
      ElMessage.error(msg)
      onError && onError(new Error(msg))
    }
  } catch (e) {
    avatarError.value = '上传失败，请重试'
    ElMessage.error(avatarError.value)
    onError && onError(e)
  } finally {
    avatarUploading.value = false
  }
}

const handleAddressPickerChange = (addressData) => {
  if (addressData.selected?.value) {
    addressForm.region = addressData.selected.value
  }
  addressForm.lat = addressData.lat
  addressForm.lng = addressData.lng
  if (addressData.detailAddress) {
    addressForm.detailAddress = addressData.detailAddress
  }
}
</script>

<style scoped>
.merchant-info-page {
  padding: 20px;
  background-color: #F5F7FA;
  min-height: 100vh;
}

/* 顶部通栏样式 */
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #165DFF 0%, #0F48D9 100%);
  color: #fff;
  padding: 20px 30px;
  border-radius: 12px;
  margin-bottom: 24px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.store-avatar {
  border: 2px solid rgba(255,255,255,0.3);
  background-color: rgba(255,255,255,0.1);
}
.store-info .store-name {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 4px;
}
.store-status {
  padding: 3px 10px;
  border-radius: 16px;
  font-size: 13px;
  display: inline-block;
}
.store-status.open {
  background: rgba(0,180,42,0.2);
  color: #00B42A;
}
.store-status.paused {
  background: rgba(255,125,0,0.2);
  color: #FF7D00;
}
.header-actions {
  display: flex;
  gap: 12px;
}
.btn-edit, .btn-pause, .btn-resume {
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  transition: background-color 0.2s ease;
}
.btn-edit:hover {
  background-color: #0A47D0;
  border-color: #0A47D0;
}
.btn-pause:hover {
  background-color: #E67000;
  border-color: #E67000;
}
.btn-resume:hover {
  background-color: #00A329;
  border-color: #00A329;
}

/* 内容容器样式 */
.content-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}
.info-card {
  border: 1px solid #E8EBF2;
  border-radius: 8px;
  padding: 20px;
  background-color: #fff;
  transition: all 0.3s ease;
}
.info-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}
.card-header {
  font-size: 18px;
  font-weight: 600;
  color: #1D2129;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #F0F2F5;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 24px;
}
.info-item .label {
  color: #666;
  font-size: 12px;
  margin-bottom: 6px;
}
.info-item .value {
  color: #1D2129;
  font-size: 14px;
  line-height: 1.5;
}
.address-grid {
  grid-template-columns: 1fr;
}
.address-item .value {
  white-space: pre-line;
  word-break: break-all;
}

/* 编辑弹窗样式优化 */
.edit-dialog .el-dialog__body {
  padding: 20px;
}
.edit-dialog .el-dialog__header {
  border-bottom: 1px solid #F0F2F5;
  padding-bottom: 12px;
}
.edit-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 600;
  color: #1D2129;
}
.form-input {
  border-radius: 6px;
  border-color: #E8EBF2;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.form-input:focus {
  border-color: #165DFF;
  box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1);
}
.avatar-upload {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}
.avatar-preview {
  border: 1px solid #E8EBF2;
  border-radius: 8px;
}
.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}
.avatar-error {
  color: #d03050;
  font-size: 12px;
  margin-top: 4px;
}
.btn-cancel, .btn-save {
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  transition: background-color 0.2s ease;
}
.btn-save:hover {
  background-color: #0A47D0;
  border-color: #0A47D0;
}
.btn-cancel:hover {
  background-color: #F5F7FA;
  color: #1D2129;
}

</style>