<template>

</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '../../axios'
import { useRouter } from 'vue-router'

const items = ref([])

onMounted(async () => {
  try {
    // 修正接口路径为 /item，并对齐 MyBatis-Plus 分页参数 current/size
    const response = await axios.get('/item', {
      params: { current: 1, size: 10 }
    })
    if (response?.data?.code === 200) {
      const d = response.data.data || {}
      // 兼容 records / list / 直接数组三种返回结构
      items.value = d.records || d.list || (Array.isArray(d) ? d : [])
    } else {
      console.error('加载商品失败:', response?.data?.msg || '未知错误')
    }
  } catch (e) {
    console.error('加载商品失败:', e)
  }
})
</script>

<style scoped>
    .items-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
    }
</style>

