<template>
  <div class="favorites-page">
    <Navbar />
    <div class="content">
      <h1>收藏的店铺</h1>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else>
        <div v-if="favorites.length === 0" class="empty">暂无收藏店铺</div>
        <div class="favorites-list" v-else>
          <div class="favorite-card" v-for="m in favorites" :key="m.merchantId">
            <div class="header">
              <div class="name">{{ m.merchantName || '未命名店铺' }}</div>
              <div :class="['status', statusClass(m.status)]">{{ statusLabel(m.status) }}</div>
            </div>
            <div class="meta">
              <div class="no">编号：{{ m.merchantNo || '—' }}</div>
              <div class="contact">联系人：{{ m.contactPerson || '—' }}</div>
              <div class="address">地址：{{ m.address || '—' }}</div>
            </div>
            <div class="actions">
              <button @click="goToShop(m)">进入店铺</button>
              <button class="danger" @click="unfavorite(m)">取消收藏</button>
            </div>
          </div>
        </div>

        <div class="pager" v-if="page.total > page.size">
          <el-pagination
            v-model:current-page="page.current"
            v-model:page-size="page.size"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="page.total"
            @current-change="loadFavorites"
            @size-change="(s) => { page.size = s; page.current = 1; loadFavorites(); }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '../../axios'
import Navbar from '../../components/Home/Navbar.vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const favorites = ref([])
const page = ref({ current: 1, size: 10, total: 0 })

const statusLabel = (s) => {
  if (s === 1) return '正常'
  if (s === 2) return '待审核'
  if (s === 0) return '禁用'
  return '未知'
}
const statusClass = (s) => (s === 1 ? 'ok' : s === 2 ? 'pending' : 'disabled')

const loadFavorites = async () => {
  try {
    loading.value = true
    const { data } = await axios.get('/favorite/merchant', {
      params: { current: page.value.current, size: page.value.size }
    })
    if (data && data.code === 200) {
      favorites.value = data.data.records || []
      page.value.total = data.data.total || favorites.value.length
    } else {
      favorites.value = []
      page.value.total = 0
    }
  } catch (e) {
    console.error('加载收藏店铺失败:', e)
    ElMessage.error('加载收藏店铺失败')
  } finally {
    loading.value = false
  }
}

const goToShop = (m) => {
  router.push({ path: '/merchantshop', query: { shopId: m.merchantId } })
}

const unfavorite = async (m) => {
  try {
    const { data } = await axios.delete(`/favorite/merchant/${m.merchantId}`)
    if (data && data.code === 200) {
      ElMessage.success('已取消收藏')
      // 重新加载当前页
      await loadFavorites()
    } else {
      ElMessage.error(data?.msg || '取消收藏失败')
    }
  } catch (e) {
    console.error('取消收藏失败:', e)
    ElMessage.error('取消收藏失败')
  }
}

onMounted(() => {
  loadFavorites()
})
</script>

<style scoped>
.favorites-page { min-height: 100vh; background: #f5f7fa; }
.content { max-width: 1100px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
h1 { margin: 0 0 16px; font-size: 22px; color: #2c3e50; }
.loading { padding: 20px; text-align: center; color: #888; }
.empty { padding: 40px; text-align: center; color: #777; }
.favorites-list { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.favorite-card { border: 1px solid #eee; border-radius: 10px; padding: 12px; background: #fff; }
.header { display: flex; align-items: center; justify-content: space-between; }
.name { font-weight: 600; font-size: 16px; color: #333; }
.status { font-size: 12px; padding: 2px 8px; border-radius: 20px; }
.status.ok { background: #e8f7ee; color: #2f9e44; }
.status.pending { background: #fff4e6; color: #d9480f; }
.status.disabled { background: #f3f0ff; color: #7048e8; }
.meta { color: #666; font-size: 13px; margin-top: 8px; display: grid; grid-template-columns: 1fr; gap: 4px; }
.actions { display: flex; gap: 8px; margin-top: 10px; }
.actions button { height: 32px; padding: 0 12px; border: none; border-radius: 6px; cursor: pointer; background: #409EFF; color: #fff; }
.actions .danger { background: #ff4d4f; }
.pager { margin-top: 16px; display: flex; justify-content: center; }
</style>