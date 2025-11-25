<template>
  <Teleport to="body">
    <div
      class="float-panel"
      :class="{ 'float-panel-visible': isVisible, 'float-panel-hidden': !isVisible }"
      :style="floatStyle"
      @mouseenter="$emit('float-enter')"
      @mouseleave="$emit('float-leave')"
      ref="floatPanelRef"
    >
      <div class="float-content">
        <!-- 遍历三级目录（level: 3） -->
        <div v-for="(thirdLevel, index) in thirdLevelCategories" :key="thirdLevel.cid" class="parent-category">
          <!-- 外层容器：使用flex布局实现标题固定宽度+内容自适应 -->
          <div class="parent-category-wrapper">
            <!-- 标题区域：固定宽度 -->
            <div class="category-title">
              <span @click="goToProducts(thirdLevel)">{{ thirdLevel.name }}></span>
            </div>
            <!-- 叶子分类区域：自适应剩余宽度 -->
            <div>
              <span v-for="(fourthLevel, subIndex) in thirdLevel.fourthLevelChildren" :key="fourthLevel.cid" class="child-category" @click="searchItem(fourthLevel)">
                {{ fourthLevel.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({ 
  anchor: { type: Object, default: null },
  content:  { type: Object, required: true },
  isVisible: { type: Boolean, default: false }
})

const thirdLevelCategories = computed(() => {
  const secondLevelItems = props.content?.children || []
  const thirdLevelItems = secondLevelItems.reduce((acc, secondItem) => {
    const thirdItems = secondItem.children?.filter(item => item.level === 3) || []
    return [...acc, ...thirdItems]
  }, [])
  return thirdLevelItems.map(thirdItem => ({
    ...thirdItem,
    fourthLevelChildren: thirdItem.children?.filter(child => child.level === 4) || []
  }))
})

const rect = ref({ top: 0, left: 0, right: 0, width: 0, height: 0 })
const floatPanelRef = ref(null)

const floatStyle = computed(() => ({
  position: 'fixed',
  top: `${rect.value.top}px`,
  left: `${rect.value.right}px`,
  zIndex: 9999
}))

function updateRect () {
  if (!props.anchor) return
  const anchorRect = props.anchor.getBoundingClientRect()
  rect.value = {
    top: anchorRect.top,
    left: anchorRect.left,
    right: anchorRect.right,
    width: anchorRect.width,
    height: anchorRect.height
  }
}

function addListeners () {
  window.addEventListener('scroll', updateRect, true)
  window.addEventListener('resize', updateRect)
}

function removeListeners () {
  window.removeEventListener('scroll', updateRect, true)
  window.removeEventListener('resize', updateRect)
}

const emit = defineEmits(['float-enter', 'float-leave'])

const router = useRouter()

const goToProducts = (thirdLevel) => {
  // 第三层分类：以第三层 cid 作为检索锚点（商品存储按三级cid）
  const q = (thirdLevel?.name || '').trim()
  const cid = Number(thirdLevel?.cid)
  const query = { type: 'item' }
  if (q) query.q = q
  if (Number.isFinite(cid) && cid > 0) query.cid = cid
  router.push({ path: '/index', query })
}

const searchItem = (leaf) => {
  // 第四层分类：通过分类链回溯到第三层的 cid 进行检索
  const q = (leaf?.name || '').trim()
  const cid = Number(leaf?.parentCid) // 叶子父节点即第三级分类
  const query = { type: 'item' }
  if (q) query.q = q
  if (Number.isFinite(cid) && cid > 0) query.cid = cid
  router.push({ path: '/index', query })
}

onMounted(() => {
  updateRect()
  addListeners()
})

onUnmounted(() => {
  removeListeners()
})

watch(() => props.anchor, () => {
  updateRect()
})

watch(() => props.content, () => {
  nextTick(() => {
    updateRect()
  })
})
</script>

<style scoped>
.float-panel {
  width: 800px; /* 固定宽度 */
  background: white;
  border: 3px solid #ff0000; /* 添加边框线 */
  border-radius: 15px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  max-height: 600px; /* 设置最大高度 */
  min-height: 370px;
  overflow-y: auto; /* 允许垂直滚动 */
  overflow-x: hidden; /* 隐藏水平滚动条 */
  padding: 15px; /* 添加内边距 */
}

/* 隐藏滚动条 */
.float-panel::-webkit-scrollbar {
  display: none;
}

.float-panel-visible {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
  transition: opacity 0.2s, transform 0.2s;
}

.float-panel-hidden {
  opacity: 0;
  transform: scale(0.95);
  pointer-events: none;
  transition: opacity 0.2s, transform 0.2s;
}

.parent-category {
  margin: 4px 0;
}

/* 外层容器：使用flex布局，设置顶端对齐 */
.parent-category-wrapper {
  display: flex;
  align-items: flex-start; /* 关键修改：设置垂直顶部对齐 */
  gap: 12px;
}

/* 标题区域：固定宽度 */
.category-title {
  width: 100px;
  flex-shrink: 0;
}

.category-title span {
  font-size: 14px;
  color: #1f1f1f;
}

.child-category {
  font-size: 14px;
  color: #1f1f1f;
  cursor: pointer;
  padding: 2px 0;
  white-space: nowrap;
  margin: 0 5px;
}

.child-category:hover {
  color: #2563eb;
  text-decoration: underline;
}
</style>
