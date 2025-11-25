<template>
  <div class="merchant-comments">
    <el-card shadow="always">
      <template #header>
        <div class="card-header">
          <span>用户评论</span>
          <div class="actions">
            <el-button size="small" type="primary" @click="fetchComments" :loading="loading">刷新</el-button>
          </div>
        </div>
      </template>

      <div v-if="loading">
        <el-empty description="正在加载评论..." />
      </div>
      <div v-else>
        <div v-if="comments.length === 0">
          <el-empty description="暂无评论" />
        </div>
        <div v-else>
          <div v-for="c in comments" :key="c.commentId" class="comment-item">
            <div class="comment-top">
              <div class="left">
                <el-avatar :size="32" :src="c.avatar" />
                <div class="user-info">
                  <div class="name">{{ c.userName || '用户' }}</div>
                  <div class="time">{{ formatTime(c.createTime) }}</div>
                </div>
              </div>
              <div class="right">
                <el-rate v-model="c.rating" disabled show-score :max="5" />
              </div>
            </div>

            <div class="item-info">
              <div class="pic" v-if="firstPic(c.itemPicUrl)">
                <img :src="firstPic(c.itemPicUrl)" alt="商品图" />
              </div>
              <div class="title">
                <span class="label">商品：</span>{{ c.itemTitle || ('#' + c.itemId) }}
                <span class="label">商品编号：</span>{{ c.itemNo || ('#' + c.itemId) }}
              </div>
            </div>

            <div class="content">{{ c.content }}</div>

            <div v-if="c.images && c.images.length" class="comment-image-row">
              <template v-for="(img, idx) in c.images.slice(0, maxPreviewImages)" :key="idx">
                <img class="comment-image" :src="img" alt="评论图片" @click="openCommentImageViewer(c.images, idx)" />
              </template>
              <div v-if="c.images.length > maxPreviewImages" class="comment-image-more" @click="openCommentImageViewer(c.images, maxPreviewImages)">+{{ c.images.length - maxPreviewImages }}张</div>
            </div>

            <div v-if="c.replyContent" class="merchant-reply">
              <div class="reply-title">商家回复</div>
              <div class="reply-content">{{ c.replyContent }}</div>
              <div class="reply-time">{{ formatTime(c.replyTime) }}</div>
            </div>

            <div class="reply-editor">
              <el-input
                v-model="replyText[c.commentId]"
                type="textarea"
                :rows="3"
                placeholder="回复该条评论..."
                clearable
                maxlength="300"
                show-word-limit
              />
              <div class="reply-actions">
                <el-button type="primary" size="small" :loading="replyPosting[c.commentId]" @click="submitReply(c)">回复</el-button>
                <el-button size="small" text @click="replyText[c.commentId] = ''">清空</el-button>
              </div>
            </div>

            <el-divider />
          </div>

          <div class="pagination-wrap">
            <el-pagination
              background
              layout="prev, pager, next"
              :page-size="pageSize"
              :total="total"
              :current-page="current"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </div>
    </el-card>
  </div>
  <!-- 图片查看器：支持左右滑动浏览该条评论的全部图片 -->
  <el-dialog v-model="imageViewerVisible" title="查看图片" width="80%">
    <el-carousel :initial-index="imageViewerIndex" height="60vh" indicator-position="outside" arrow="always">
      <el-carousel-item v-for="(src, i) in imageViewerImages" :key="i">
        <img :src="src" alt="评论图片预览" class="viewer-image" />
      </el-carousel-item>
    </el-carousel>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '../../axios.js'

const comments = ref([])
const loading = ref(false)
const replyText = ref({})
const replyPosting = ref({})
const current = ref(1)
const pageSize = ref(10)
const total = ref(0)
const maxPreviewImages = 5
// 图片查看器状态与打开方法（商家端）
const imageViewerVisible = ref(false)
const imageViewerImages = ref([])
const imageViewerIndex = ref(0)
const openCommentImageViewer = (imgs, startIdx = 0) => {
  if (!Array.isArray(imgs) || !imgs.length) return
  imageViewerImages.value = imgs
  imageViewerIndex.value = Math.min(Math.max(startIdx, 0), imgs.length - 1)
  imageViewerVisible.value = true
}

const fetchComments = async () => {
  try {
    loading.value = true
    const { data } = await axios.get('/comment/store/recent', {
      params: { current: current.value, size: pageSize.value }
    })
    if (data && data.code === 200 && data.data) {
      const records = data.data.records || []
      // 解析后端逗号分隔的图片URL为数组，供前端展示
      comments.value = records.map(r => ({
        ...r,
        images: r.imageUrls ? String(r.imageUrls).split(',').filter(Boolean) : []
      }))
      total.value = data.data.total || 0
      current.value = data.data.current || current.value
      pageSize.value = data.data.size || pageSize.value
      console.log('comments', comments.value)
    } else {
      comments.value = []
      total.value = 0
    }
  } catch (e) {
    console.error('加载店铺最新评论失败', e)
  } finally {
    loading.value = false
  }
}

const submitReply = async (c) => {
  const content = (replyText.value[c.commentId] || '').trim()
  if (!content) return
  try {
    replyPosting.value[c.commentId] = true
    const { data } = await axios.post(`/comment/${c.commentId}/reply`, {
      replyContent: content
    })
    if (data && data.code === 200) {
      c.replyContent = content
      c.replyTime = new Date().toISOString()
      replyText.value[c.commentId] = ''
    }
  } catch (e) {
    console.error('回复评论失败', e)
  } finally {
    replyPosting.value[c.commentId] = false
  }
}

const handlePageChange = (p) => {
  current.value = p
  fetchComments()
}

const firstPic = (urlString) => {
  if (!urlString) return ''
  const arr = String(urlString).split(',').map(s => s.trim()).filter(Boolean)
  return arr[0] || ''
}

const formatTime = (t) => {
  if (!t) return ''
  try {
    const dt = typeof t === 'string' ? new Date(t) : t
    return dt.toLocaleString()
  } catch {
    return String(t)
  }
}

onMounted(fetchComments)
</script>

<style>
.merchant-comments { padding: 12px; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.comment-item { padding: 6px 0; }
.comment-top { display: flex; align-items: center; justify-content: space-between; }
.comment-top .left { display: flex; align-items: center; gap: 10px; }
.user-info .name { font-weight: 500; }
.user-info .time { font-size: 12px; color: #909399; }
.item-info { display: flex; align-items: center; gap: 12px; margin: 6px 0; }
.item-info .pic img { width: 48px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid #eee; }
.item-info .title { font-size: 14px; color: #606266; }
.item-info .label { color: #909399; }
.content { margin: 6px 0 10px; line-height: 1.6; }
.merchant-reply { background: #f5f7fa; padding: 8px; border-radius: 6px; margin: 6px 0; }
.merchant-reply .reply-title { font-size: 13px; color: #606266; margin-bottom: 4px; }
.merchant-reply .reply-content { font-size: 14px; }
.merchant-reply .reply-time { font-size: 12px; color: #909399; margin-top: 4px; }
.reply-editor { margin-top: 6px; }
.reply-actions { margin-top: 6px; display: flex; gap: 8px; }
.pagination-wrap { display: flex; justify-content: center; margin-top: 10px; }

/* 评论图片预览（单行） */
.comment-image-row { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; }
.comment-image { width: 60px; height: 60px; border-radius: 6px; object-fit: cover; border: 1px solid #eee; }
.comment-image { cursor: pointer; }
.comment-image-more { padding: 0 8px; height: 60px; display: flex; align-items: center; justify-content: center; background: #fafafa; border: 1px dashed #ddd; border-radius: 6px; color: #666; font-size: 13px; cursor: pointer; }
/* 图片查看器样式 */
.viewer-image { width: 100%; height: 100%; object-fit: contain; }
</style>