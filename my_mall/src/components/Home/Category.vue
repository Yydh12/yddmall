<template>
  <div class="category-wrapper">
    <div 
      ref="anchor" 
      class="category-container"
      @mouseenter="handleCategoryEnter"
      @mouseleave="handleCategoryLeave"
    >
      <div class="category-title">分类</div>
      <div class="category-grid">
        <template v-for="(parentCategory, parentIndex) in categories" :key="parentCategory.cid">
          <div 
            @mouseenter="updateFloat(parentCategory)"
            class="category-parent-row"
          >
            <div class="category-icon" :style="{ backgroundImage: `url('/category/category${parentIndex+1}.png')` }"></div>
            <template v-for="(childCategory, index) in parentCategory.children" :key="childCategory.cid">
              <div 
                class="category-item"
                :class="{
                  'category-item-two-cols': parentIndex === 0,
                  'category-item-four-cols': parentIndex !== 0
                }"
              >
                <div class="category-text" @click="handleCategoryClick(parentIndex, childCategory)">
                  <span>{{ childCategory.name }}</span>
                </div>
              </div>
              <div 
                class="category-separator"
                v-if="index < parentCategory.children.length - 1"
              >
                /
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>
    
    <!-- 浮层组件，传递事件回调 -->
    <FloatLayer
      v-if="floatContent"
      :anchor="anchor"
      :content="floatContent"
      :is-visible="isVisible"
      @float-enter="handleFloatEnter"
      @float-leave="handleFloatLeave"
    />
  </div>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import { useRouter } from 'vue-router';
import axios from '../../axios';
import FloatLayer from './FloatLayer.vue';

const anchor = ref(null);
const categories = ref([]);
const floatContent = ref(null);
const isVisible = ref(false); // 浮层显示状态
let leaveTimer = null;
const router = useRouter();

onBeforeMount(async () => {
  const { data } = await axios.get('/item-category');
  categories.value = listToTree(data.data);
});

function listToTree(list, root = 0) {
  const map = new Map(list.map(n => [n.cid, { ...n, children: [] }]));
  const res = [];
  for (const node of map.values()) {
    if (node.parentCid === root) {
      res.push(node);
    } else {
      map.get(node.parentCid)?.children.push(node);
    }
  }
  return res;
}

function updateFloat(category) {
  floatContent.value = category;
  isVisible.value = true;
  clearTimeout(leaveTimer);
}

// 点击分类：第一行跳转页面，其余进行商品搜索
function handleCategoryClick(parentIndex, childCategory) {
  // 仅同步分类名称文本到搜索页（与手动输入一致）
  const q = (childCategory?.name || '').trim();
  router.push(q ? { path: '/index', query: { type: 'item', q } } : { path: '/index', query: { type: 'item' } });
}

// 分类区域鼠标进入
function handleCategoryEnter() {
  clearTimeout(leaveTimer);
  isVisible.value = true;
}

// 分类区域鼠标离开
function handleCategoryLeave() {
  // 延迟隐藏，给鼠标移动到浮层的时间
  leaveTimer = setTimeout(() => {
    isVisible.value = false;
  }, 30); // 稍微延长延迟时间，使缩小效果更明显
}

// 浮层鼠标进入
function handleFloatEnter() {
  clearTimeout(leaveTimer);
  isVisible.value = true;
}

// 浮层鼠标离开
function handleFloatLeave() {
  leaveTimer = setTimeout(() => {
    isVisible.value = false;
    floatContent.value = null;
  }, 30); // 缩短延迟
}
</script>

<style scoped>
.category-container {
  position: relative; /* 添加相对定位 */
  width: 268px;
  min-width: 268px; /* 添加最小宽度防止挤压 */
  height: 400px;
  box-sizing: border-box;
  border: 1px solid #eee;
  border-radius: 15px;
  padding: 10px;
  background-color: #fff;
  transform: translateZ(0);
  overflow: hidden; /* 防止内容溢出 */
}

.category-grid {
  display: flex;
  flex-direction: column;
  height: 85%;
  min-height: 340px; /* 添加最小高度 */
  align-content: flex-start;
  justify-content: space-between;
  margin-top: 15px;
  width: 100%;
  overflow-y: auto; /* 添加垂直滚动条 */
}

.category-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}

.category-parent-row {
  display: flex;
  align-items: center;
  width: 100%;
  flex-wrap: wrap;
  justify-content: flex-start;

}

.category-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  padding: 2px 5px; /* 减小内边距 */
  cursor: pointer;
  box-sizing: border-box;
  justify-content: center;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
}

.category-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
  min-width: 0;
  max-width: 100%; /* 确保文本不超过容器宽度 */
}

.category-icon {
  width: 22px;
  height: 22px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  margin-right: 8px;
  flex-shrink: 0; /* 防止图标被压缩 */
}

.category-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}


</style>
