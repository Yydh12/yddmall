<template>
  <div class="footprints-page">
    <Navbar />
    <div class="content">
      <h1>浏览足迹</h1>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else>
        <div v-if="records.length === 0" class="empty">暂无浏览记录</div>
        <div class="list" v-else>
          <div class="item" v-for="r in records" :key="r.id || (r.itemId + '-' + r.visitedAt)">
            <router-link class="thumb" :to="'/productInfo/' + r.itemId">
              <img :src="getImage(r)" alt="商品图片" @error="onImgErr" />
            </router-link>
            <div class="info">
              <router-link class="title" :to="'/productInfo/' + r.itemId">{{ r.title || '未命名商品' }}</router-link>
              <div class="meta">
                <span class="price">¥{{ (r.price || 0).toFixed(2) }}</span>
                <span class="time">{{ formatTime(r.visitedAt) }}</span>
              </div>
            </div>
            <div class="ops">
              <button class="clear-one" @click="removeOne(r)">删除</button>
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
            @current-change="loadFootprints"
            @size-change="(s) => { page.size = s; page.current = 1; loadFootprints(); }"
          />
        </div>

        <div class="tool-bar" v-if="records.length > 0">
          <button class="danger" @click="clearAll">清空全部足迹</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '../../axios'
import avatarUrl from '@/assets/images/avatar.png'
import Navbar from '../../components/Home/Navbar.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const records = ref([])
const page = ref({ current: 1, size: 10, total: 0 })

const getImage = (r) => {
  if (r.picUrl) {
    const arr = String(r.picUrl).split(',').filter(Boolean)
    return arr[0]
  }
  if (r.skuPic) return r.skuPic
  return avatarUrl
}
const onImgErr = (e) => { e.target.src = avatarUrl }

const formatTime = (t) => {
  if (!t) return '—'
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return '—'
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  const hh = String(d.getHours()).padStart(2,'0')
  const mm = String(d.getMinutes()).padStart(2,'0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}

const loadFootprints = async () => {
  try {
    loading.value = true
    const { data } = await axios.get('/footprint/item', {
      params: { current: page.value.current, size: page.value.size }
    })
    if (data && data.code === 200) {
      records.value = data.data.records || []
      page.value.total = data.data.total || records.value.length
    } else {
      records.value = []
      page.value.total = 0
    }
  } catch (e) {
    console.error('加载浏览足迹失败:', e)
    ElMessage.error('加载浏览足迹失败')
  } finally {
    loading.value = false
  }
}

const removeOne = async (r) => {
  try {
    const { data } = await axios.delete(`/footprint/item/${r.itemId}`)
    if (data && data.code === 200) {
      ElMessage.success('已删除该足迹')
      await loadFootprints()
    } else {
      ElMessage.error(data?.msg || '删除失败')
    }
  } catch (e) {
    console.error('删除足迹失败:', e)
    ElMessage.error('删除失败')
  }
}

const clearAll = async () => {
  try {
    await ElMessageBox.confirm('确认清空全部足迹？', '提示', { type: 'warning' })
    const { data } = await axios.delete('/footprint/item')
    if (data && data.code === 200) {
      ElMessage.success('已清空足迹')
      await loadFootprints()
    } else {
      ElMessage.error(data?.msg || '清空失败')
    }
  } catch (e) {
    if (String(e).includes('cancel')) return
    console.error('清空足迹失败:', e)
    ElMessage.error('清空足迹失败')
  }
}

onMounted(() => {
  loadFootprints()
})
</script>

<style scoped>
.footprints-page { min-height: 100vh; background: #f5f7fa; }
.content { max-width: 1100px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
h1 { margin: 0 0 16px; font-size: 22px; color: #2c3e50; }
.loading { padding: 20px; text-align: center; color: #888; }
.empty { padding: 40px; text-align: center; color: #777; }
.list { display: grid; grid-template-columns: 1fr; gap: 12px; }
.item { display: grid; grid-template-columns: 100px 1fr auto; gap: 12px; align-items: center; border: 1px solid #eee; border-radius: 10px; padding: 10px; }
.thumb img { width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #f0f0f0; }
.info { display: grid; grid-template-columns: 1fr; gap: 6px; }
.title { font-weight: 600; color: #333; text-decoration: none; }
.meta { color: #666; display: flex; gap: 16px; font-size: 13px; }
.meta .price { color: #d9480f; }
.ops button { height: 32px; padding: 0 12px; border: none; border-radius: 6px; cursor: pointer; background: #ff4d4f; color: #fff; }
.tool-bar { margin-top: 16px; display: flex; justify-content: flex-end; }
.tool-bar .danger { height: 32px; padding: 0 12px; border: none; border-radius: 6px; cursor: pointer; background: #ff4d4f; color: #fff; }
.pager { margin-top: 16px; display: flex; justify-content: center; }
</style>