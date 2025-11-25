<template>
  <div><Navbar /></div>

  <div class="shop-form">
    <form @submit.prevent="submitForm">
      <div class="form-item">
        <label>店铺名称：</label>
        <input
          type="text"
          v-model="form.merchantName"
          placeholder="请输入店铺名称"
          required
        />
      </div>

      <div class="form-item">
        <label>真实姓名：</label>
        <input type="text" v-model="form.contactPerson" placeholder="请输入真实姓名" required />
      </div>

      <div class="form-item">
        <label>联系电话：</label>
        <input type="tel" v-model="form.contactPhone" placeholder="请输入联系电话" required />
      </div>

      <div class="form-item">
        <label>店铺地址：</label>
        <div class="address-container">
          <AddressPicker
            v-model="addressData"
            :region-options="regionOptions"
          />
        </div>
      </div>

      <button type="submit" class="submit-btn">立即开店</button>
    </form>
  </div>
</template>

<script setup>
import axios from '../../axios'
import { ElMessage } from 'element-plus'
import Navbar from './Navbar.vue'
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import AddressPicker from '@/components/Common/AddressPicker.vue'
import { useRegionPicker } from '@/utils/useRegionPicker'

const router = useRouter()
const user = JSON.parse(localStorage.getItem('user')) || {}

/* -------- 地区选择器配置 -------- */
const { regionOptions, labelsFromPath } = useRegionPicker()

/* -------- 地址数据 -------- */
const addressData = ref({
  region: [], // 省市区代码
  detailAddress: '', // 详细地址
  fullAddress: '', // 完整地址
  position: null // 经纬度
})

/* -------- 开店表单数据 -------- */
const form = reactive({
  merchantName: `${user.username || '用户'}的小店`,
  contactPerson: user.realName || '',
  contactPhone: user.phone || '',
  address: '', // 完整地址
  province: '', // 省份
  city: '', // 城市
  district: '', // 区县
  detailAddress: '', // 详细地址
  lat: null, // 纬度
  lng: null // 经度
})

/* -------- 监听地址数据变化 -------- */
watch(addressData, (newValue) => {
  console.log('地址数据变化:', newValue)
  
  if (newValue.region && newValue.region.length === 3) {
    // 更新省市区信息
    const [provinceCode, cityCode, districtCode] = newValue.region
    const [province, city, district] = labelsFromPath(newValue.region)
    
    form.province = province || ''
    form.city = city || ''
    form.district = district || ''
  }
  
  // 更新详细地址
  form.detailAddress = newValue.detailAddress || ''
  
  // 更新完整地址
  if (newValue.fullAddress) {
    form.address = newValue.fullAddress
  } else if (form.province && form.city && form.district && form.detailAddress) {
    form.address = `${form.province} ${form.city} ${form.district} ${form.detailAddress}`
  }
  
  // 更新经纬度
  if (newValue.position) {
    form.lat = newValue.position.lat
    form.lng = newValue.position.lng
  }
}, { deep: true })

/* -------- 提交开店表单 -------- */
const submitForm = () => {
  console.log('提交表单数据:', form)
  
  // 验证地址是否完整
  if (!form.province || !form.city || !form.district || !form.detailAddress) {
    console.log('地址信息不完整:', {
      省份: form.province,
      城市: form.city,
      区县: form.district,
      详细地址: form.detailAddress
    })
    return ElMessage.warning('请选择完整的店铺地址（省市区+详细地址）')
  }
  
  if (!form.lat || !form.lng) {
    return ElMessage.warning('请通过地图选点确认地址位置')
  }

  // 确保完整地址存在
  if (!form.address) {
    form.address = `${form.province} ${form.city} ${form.district} ${form.detailAddress}`
  }

  // 提交表单
  axios.post('/merchant', form).then(res => {
    if (res.data.code === 200) {
      user.roleId = 3
      axios.put('/user', user).then(r => {
        if (r.data.code === 200) {
          localStorage.setItem('user', JSON.stringify(user));
          ElMessage.success('开店成功！')
          router.push('/store')
        }
      })
    }
  }).catch(error => {
    ElMessage.error('开店失败，请稍后重试')
    console.error('提交失败:', error)
  })
}
</script>

<style scoped>
.shop-form {
  max-width: 750px;
  margin: 40px auto;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}
.form-item {
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.form-item label {
  width: 80px;
  text-align: justify;
  text-align-last: justify;
  line-height: 40px;
  color: #606266;
  font-size: 14px;
}
.form-item input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  width: 282px;
}
.form-item input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}
.submit-btn {
  width: 100%;
  padding: 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}
.submit-btn:hover {
  background-color: #0056b3;
}

.address-container {
  flex: 1;
}
</style>