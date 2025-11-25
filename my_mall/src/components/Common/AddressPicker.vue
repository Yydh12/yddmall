<template>
  <div class="address-picker">
    <!-- 地址输入区域 -->
    <div class="address-input-section">
      <div class="form-row">
        <el-cascader
          v-model="selectedRegion"
          :options="regionOptionsComputed"
          :props="cascaderProps"
          placeholder="请选择省/市/区"
          clearable
          class="region-cascader"
          @change="handleRegionChange"
        />
      </div>
      
      <div class="form-row">
        <el-input
          v-model="detailAddress"
          placeholder="详细地址（街道、门牌号等）"
          clearable
          class="detail-input"
          @focus="showMapSuggestions = true"
        >
          <template #suffix>
            <el-button type="primary" text @click="openMapDialog">
              <el-icon><MapLocation /></el-icon>
              地图选点
            </el-button>
          </template>
        </el-input>
      </div>

      <!-- 地图选点建议 -->
      <div v-if="showMapSuggestions && !detailAddress" class="map-suggestions">
        <div class="suggestion-item" @click="openMapDialog">
          <el-icon><MapLocation /></el-icon>
          <span>在地图上选择位置</span>
        </div>
        <div class="suggestion-item" @click="openSearchDialog">
          <el-icon><Search /></el-icon>
          <span>搜索地点</span>
        </div>
      </div>
    </div>

    <!-- 选中的地址预览 -->
    <div v-if="selectedAddress" class="address-preview">
      <div class="preview-content">
        <el-icon><Location /></el-icon>
        <span class="address-text">{{ selectedAddress }}</span>
      </div>
      <el-button type="primary" text @click="openMapDialog">修改</el-button>
    </div>

    <!-- 地图选点弹窗 -->
    <el-dialog 
      v-model="mapDialogVisible" 
      title="地图选点" 
      width="900px"
      :close-on-click-modal="false"
      destroy-on-close
      class="map-dialog"
    >
      <div class="map-dialog-content">
        <!-- 搜索栏 -->
        <div class="map-search-bar">
          <el-input
            v-model="searchQuery"
            placeholder="搜索地点或地址"
            clearable
            class="search-input"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #append>
              <el-button @click="handleSearch" :loading="searchLoading">
                搜索
              </el-button>
            </template>
          </el-input>
        </div>

        <!-- 搜索结果 -->
        <div v-if="searchResults.length > 0" class="search-results">
          <div 
            v-for="result in searchResults" 
            :key="result.id"
            class="result-item"
            @click="selectSearchResult(result)"
          >
            <div class="result-name">{{ result.name }}</div>
            <div class="result-address">{{ result.address }}</div>
          </div>
        </div>

        <!-- 地图容器 -->
        <div class="map-container-wrapper">
          <div id="address-picker-map" class="map-container"></div>
          <div class="map-tips">
            <el-icon><InfoFilled /></el-icon>
            <span>点击地图选择位置，可拖动标记调整精确位置</span>
          </div>
        </div>

        <!-- 当前位置信息 -->
        <div v-if="currentPosition" class="position-info">
          <div class="position-detail">
            <div class="position-title">当前位置</div>
            <div class="position-address">{{ currentPosition.address }}</div>
            <div class="position-coords">
              经纬度: {{ currentPosition.lat?.toFixed(6) }}, {{ currentPosition.lng?.toFixed(6) }}
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelMapSelection">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmMapSelection" 
            :disabled="!currentPosition"
            :loading="confirmLoading"
          >
            确认选择
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 搜索弹窗 -->
    <el-dialog
      v-model="searchDialogVisible"
      title="搜索地点"
      width="600px"
      class="search-dialog"
    >
      <div class="search-dialog-content">
        <el-input
          v-model="quickSearchQuery"
          placeholder="输入地点名称进行搜索"
          clearable
          @input="handleQuickSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <div v-if="quickSearchResults.length > 0" class="quick-results">
          <div 
            v-for="result in quickSearchResults"
            :key="result.id"
            class="quick-result-item"
            @click="selectQuickSearchResult(result)"
          >
            <div class="quick-result-name">{{ result.name }}</div>
            <div class="quick-result-address">{{ result.address }}</div>
          </div>
        </div>
        
        <div v-else-if="quickSearchQuery && !quickSearchLoading" class="no-results">
          未找到相关地点
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  MapLocation, 
  Search, 
  Location, 
  InfoFilled 
} from '@element-plus/icons-vue'
import * as AreaData from 'element-china-area-data'
import request from '@/utils/request'

// 配置数据
const mapConfig = ref({
  TDT_BROWSER_KEY: '0e49bcbfd2a87d8226f4fa0e99c52e52',
  DEFAULT_CENTER: [39.9042, 116.4074],
  MAP_ZOOM_LEVEL: 13
})

// 配置加载状态
const configLoaded = ref(false)

// 加载配置
const loadConfig = async () => {
  try {
    const response = await request({
      url: '/config/map',
      method: 'get'
    })
    
    if (response.data) {
      mapConfig.value = {
        TDT_BROWSER_KEY: response.data.tiandituBrowserKey || mapConfig.value.TDT_BROWSER_KEY,
        DEFAULT_CENTER: response.data.defaultCenter || mapConfig.value.DEFAULT_CENTER,
        MAP_ZOOM_LEVEL: response.data.defaultZoom || mapConfig.value.MAP_ZOOM_LEVEL
      }
      console.log('地图配置加载成功:', mapConfig.value)
    }
  } catch (error) {
    console.warn('无法从后端获取配置，使用默认配置:', error)
    // 使用默认配置
  } finally {
    configLoaded.value = true
  }
}

// 在组件挂载时加载配置
onMounted(() => {
  loadConfig()
})

// Props
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  regionOptions: Array
})

// Emits
const emit = defineEmits(['update:modelValue'])

// 响应式数据
const selectedRegion = ref([])
const detailAddress = ref('')
const selectedAddress = ref('')
const mapDialogVisible = ref(false)
const searchDialogVisible = ref(false)
const showMapSuggestions = ref(false)

// 搜索相关
const searchQuery = ref('')
const quickSearchQuery = ref('')
const searchResults = ref([])
const quickSearchResults = ref([])
const searchLoading = ref(false)
const quickSearchLoading = ref(false)
const confirmLoading = ref(false)

// 地图相关
const currentPosition = ref(null)
let map = null
let marker = null
let leafletReady = false

// 计算属性
const regionOptionsComputed = computed(() => 
  props.regionOptions?.length ? props.regionOptions : (AreaData.regionData || [])
)

const cascaderProps = computed(() => ({
  value: 'value',
  label: 'label',
  children: 'children',
  checkStrictly: false,
  emitPath: true
}))

// 监听值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedRegion.value = newValue.region || []
    detailAddress.value = newValue.detailAddress || ''
    selectedAddress.value = newValue.fullAddress || ''
    currentPosition.value = newValue.position || null
  }
}, { immediate: true })

// 方法 - 地址处理
const handleRegionChange = (value) => {
  updateSelectedAddress()
}

const updateSelectedAddress = () => {
  if (selectedRegion.value.length === 3 && detailAddress.value) {
    const regionText = getRegionText(selectedRegion.value)
    selectedAddress.value = `${regionText}${detailAddress.value}`
    emitUpdate()
  }
}

const getRegionText = (regionCodes) => {
  if (regionCodes.length !== 3) return ''
  
  const opts = regionOptionsComputed.value
  const province = opts.find(p => p.value === regionCodes[0])
  const city = province?.children?.find(c => c.value === regionCodes[1])
  const district = city?.children?.find(d => d.value === regionCodes[2])
  
  return `${province?.label || ''}${city?.label || ''}${district?.label || ''}`
}

const emitUpdate = () => {
  emit('update:modelValue', {
    region: selectedRegion.value,
    detailAddress: detailAddress.value,
    fullAddress: selectedAddress.value,
    position: currentPosition.value
  })
}

// 智能地址解析方法
const smartAddressParse = (addressText) => {
  console.log('开始智能地址解析:', addressText)
  
  if (!addressText?.trim()) {
    return { regionCodes: [], detail: '' }
  }

  const opts = regionOptionsComputed.value
  let remainingText = addressText.trim()
  let bestMatch = null
  let bestMatchDepth = 0

  // 深度优先搜索，找到最深的匹配节点
  const dfsSearch = (nodes, currentPath = [], depth = 0) => {
    if (!nodes || depth > 3) return

    for (const node of nodes) {
      const label = node.label || node.name || ''
      if (!label) continue

      // 检查是否匹配
      if (remainingText.includes(label)) {
        const newPath = [...currentPath, node.value]
        
        // 如果这个匹配更深，更新最佳匹配
        if (newPath.length > bestMatchDepth) {
          bestMatchDepth = newPath.length
          bestMatch = {
            path: newPath,
            matchedLabel: label
          }
        }

        // 继续搜索子节点
        if (node.children && node.children.length > 0) {
          dfsSearch(node.children, newPath, depth + 1)
        }
      }
    }
  }

  // 执行搜索
  dfsSearch(opts)

  if (bestMatch) {
    console.log('找到最佳匹配:', bestMatch)
    
    // 从剩余文本中移除匹配的部分
    let detail = remainingText.replace(bestMatch.matchedLabel, '')
    
    // 清理分隔符
    const separators = [',', '，', ' ', '　', ';', '；', '、']
    for (const sep of separators) {
      detail = detail.replace(new RegExp(`^${sep}+`), '').replace(new RegExp(`${sep}+$`), '')
    }

    // 如果路径不完整，自动补全
    let regionCodes = bestMatch.path
    if (regionCodes.length < 3) {
      regionCodes = completeRegionPath(regionCodes)
    }

    console.log('解析结果 - 区域代码:', regionCodes, '详细地址:', detail)
    return { regionCodes, detail }
  }

  console.log('未找到匹配')
  return { regionCodes: [], detail: remainingText }
}

// 路径补全方法
const completeRegionPath = (codes) => {
  if (!codes || codes.length === 0) return []
  
  // 如果已经是完整的三级路径，直接返回
  if (codes.length === 3) return [...codes]
  
  const opts = regionOptionsComputed.value
  let result = [...codes]
  
  // 查找省份
  const province = opts.find(p => p.value === codes[0])
  if (!province) return result
  
  // 如果只有省份，补全市和区
  if (codes.length === 1) {
    const firstCity = province.children?.[0]
    if (firstCity) {
      result.push(firstCity.value)
      const firstDistrict = firstCity.children?.[0]
      if (firstDistrict) {
        result.push(firstDistrict.value)
      }
    }
  }
  // 如果有省份和城市，补全区
  else if (codes.length === 2) {
    const city = province.children?.find(c => c.value === codes[1])
    if (city) {
      const firstDistrict = city.children?.[0]
      if (firstDistrict) {
        result.push(firstDistrict.value)
      }
    }
  }
  
  console.log('路径补全:', codes, '->', result)
  return result
}

// 方法 - 地图相关
const loadLeafletAssets = () => {
  return new Promise((resolve) => {
    if (leafletReady || window.L) {
      leafletReady = true
      resolve()
      return
    }

    const loadScript = () => {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => { 
        leafletReady = true
        resolve() 
      }
      script.onerror = () => { 
        ElMessage.error('地图资源加载失败')
        resolve()
      }
      document.body.appendChild(script)
    }

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.onload = loadScript
      link.onerror = loadScript
      document.head.appendChild(link)
    } else {
      loadScript()
    }
  })
}

const initializeMap = () => {
  if (!window.L) return null

  const mapInstance = window.L.map('address-picker-map', {
    zoomControl: true,
    scrollWheelZoom: true,
    doubleClickZoom: true
  })

  // 添加天地图图层 - 使用动态配置
  const vecLayer = window.L.tileLayer(
    `https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${mapConfig.value.TDT_BROWSER_KEY}`,
    { 
      maxZoom: 18, 
      attribution: '© 天地图', 
      subdomains: ['0','1','2','3','4','5','6','7'] 
    }
  )

  const cvaLayer = window.L.tileLayer(
    `https://t{s}.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${mapConfig.value.TDT_BROWSER_KEY}`,
    { 
      maxZoom: 18, 
      attribution: '© 天地图', 
      subdomains: ['0','1','2','3','4','5','6','7'] 
    }
  )

  vecLayer.addTo(mapInstance)
  cvaLayer.addTo(mapInstance)

  return mapInstance
}

const setupMapEvents = (mapInstance) => {
  mapInstance.on('click', (e) => {
    const { lat, lng } = e.latlng
    updateMarkerPosition(lat, lng)
    reverseGeocode(lat, lng)
  })
}

const updateMarkerPosition = (lat, lng) => {
  if (!marker) {
    marker = window.L.marker([lat, lng], { 
      draggable: true,
      icon: window.L.divIcon({
        className: 'custom-marker',
        html: '<div class="marker-pin"></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      })
    }).addTo(map)
    
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      reverseGeocode(pos.lat, pos.lng)
    })
  } else {
    marker.setLatLng([lat, lng])
  }
}

// 方法 - 对话框控制
const openMapDialog = async () => {
  // 确保配置已加载
  if (!configLoaded.value) {
    ElMessage.info('正在加载地图配置，请稍候...')
    return
  }

  mapDialogVisible.value = true
  await nextTick()
  
  try {
    await loadLeafletAssets()
    if (!window.L) {
      ElMessage.error('地图初始化失败')
      return
    }

    map = initializeMap()
    if (!map) return

    setupMapEvents(map)
    
    // 设置初始视图 - 使用动态配置
    const initialCenter = currentPosition.value ? 
      [currentPosition.value.lat, currentPosition.value.lng] : mapConfig.value.DEFAULT_CENTER
    map.setView(initialCenter, mapConfig.value.MAP_ZOOM_LEVEL)
    
    if (currentPosition.value) {
      updateMarkerPosition(currentPosition.value.lat, currentPosition.value.lng)
    }
    
    setTimeout(() => map.invalidateSize(), 100)
    
  } catch (error) {
    console.error('地图初始化错误:', error)
    ElMessage.error('地图加载失败')
  }
}

const openSearchDialog = () => {
  searchDialogVisible.value = true
  showMapSuggestions.value = false
}

const cancelMapSelection = () => {
  mapDialogVisible.value = false
  cleanupMap()
}

// 方法 - 搜索功能
const handleSearch = async () => {
  if (!searchQuery.value.trim()) return
  
  searchLoading.value = true
  try {
    const res = await request({
      url: '/geo/search',
      method: 'get',
      params: { 
        q: searchQuery.value.trim(), 
        limit: 10 
      }
    })
    
    searchResults.value = parseSearchResults(res?.data)
  } catch (error) {
    console.error('搜索失败:', error)
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

const handleQuickSearch = async (query) => {
  if (!query.trim()) {
    quickSearchResults.value = []
    return
  }
  
  quickSearchLoading.value = true
  try {
    const res = await request({
      url: '/geo/search',
      method: 'get',
      params: { 
        q: query.trim(), 
        limit: 5 
      }
    })
    
    quickSearchResults.value = parseSearchResults(res?.data)
  } catch (error) {
    console.error('快速搜索失败:', error)
    quickSearchResults.value = []
  } finally {
    quickSearchLoading.value = false
  }
}

const parseSearchResults = (data) => {
  if (!data) return []
  
  let results = []
  if (typeof data === 'string') {
    try {
      results = JSON.parse(data)
    } catch {
      results = []
    }
  } else if (Array.isArray(data)) {
    results = data
  } else if (data.data) {
    results = typeof data.data === 'string' ? JSON.parse(data.data) : data.data
  }

  return results.map((item, index) => ({
    id: index,
    name: item.display_name || item.name || '',
    address: item.display_name || '',
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon)
  }))
}

const selectSearchResult = (result) => {
  if (map && window.L) {
    const latlng = window.L.latLng(result.lat, result.lng)
    map.setView(latlng, 16)
    updateMarkerPosition(result.lat, result.lng)
    reverseGeocode(result.lat, result.lng)
  }
}

const selectQuickSearchResult = (result) => {
  currentPosition.value = {
    lat: result.lat,
    lng: result.lng,
    address: result.address
  }
  
  // 解析地址并更新表单
  parseAddressAndUpdate(result.address, result.lat, result.lng)
  searchDialogVisible.value = false
}

// 方法 - 地理编码
const reverseGeocode = async (lat, lng) => {
  try {
    const res = await request({
      url: '/geo/reverse',
      method: 'get',
      params: { lat, lon: lng }
    })

    const addressData = parseReverseGeocodeResult(res?.data)
    if (addressData.display) {
      currentPosition.value = {
        lat,
        lng,
        address: addressData.display
      }
      
      // 解析地址并更新表单
      parseAddressAndUpdate(addressData.display, lat, lng)
    }
  } catch (error) {
    console.error('逆地理编码失败:', error)
  }
}

const parseReverseGeocodeResult = (data) => {
  if (!data) return {}
  
  let result = {}
  if (typeof data === 'string') {
    try {
      result = JSON.parse(data)
    } catch {
      result = {}
    }
  } else {
    result = data.data || data
  }

  return {
    display: result.display_name || result.formatted_address,
    address: result.address,
    addressComponent: result.addressComponent
  }
}

const parseAddressAndUpdate = (addressText, lat, lng) => {
  if (!addressText) return

  // 使用智能地址解析
  const { regionCodes, detail } = smartAddressParse(addressText)
  
  if (regionCodes.length === 3) {
    selectedRegion.value = regionCodes
  }
  
  if (detail) {
    detailAddress.value = detail
  }
  
  updateSelectedAddress()
}

const confirmMapSelection = () => {
  if (!currentPosition.value) {
    ElMessage.warning('请先选择位置')
    return
  }

  confirmLoading.value = true
  setTimeout(() => {
    updateSelectedAddress()
    mapDialogVisible.value = false
    ElMessage.success('地址选择成功')
    confirmLoading.value = false
    cleanupMap()
  }, 500)
}

const cleanupMap = () => {
  if (map) {
    map.remove()
    map = null
  }
  marker = null
  searchResults.value = []
  searchQuery.value = ''
}

// 生命周期
onUnmounted(() => {
  cleanupMap()
})
</script>

<style scoped>
.address-picker {
  width: 100%;
}

.address-input-section {
  margin-bottom: 16px;
}

.form-row {
  margin-bottom: 12px;
}

.region-cascader,
.detail-input {
  width: 100%;
}

.map-suggestions {
  margin-top: 8px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background-color: var(--el-fill-color-light);
}

.suggestion-item .el-icon {
  margin-right: 8px;
  color: var(--el-color-primary);
}

.address-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background-color: var(--el-fill-color-light);
  border-radius: 6px;
  border: 1px solid var(--el-border-color);
}

.preview-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.preview-content .el-icon {
  margin-right: 8px;
  color: var(--el-color-success);
}

.address-text {
  flex: 1;
  word-break: break-all;
}

/* 地图对话框样式 */
.map-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.map-search-bar {
  display: flex;
  gap: 12px;
}

.search-input {
  flex: 1;
}

.search-results {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
}

.result-item {
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color);
  transition: background-color 0.2s;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:hover {
  background-color: var(--el-fill-color-light);
}

.result-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.result-address {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.map-container-wrapper {
  position: relative;
}

.map-container {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
}

.map-tips {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.map-tips .el-icon {
  margin-right: 4px;
}

.position-info {
  padding: 16px;
  background-color: var(--el-fill-color-light);
  border-radius: 6px;
}

.position-title {
  font-weight: 500;
  margin-bottom: 8px;
}

.position-address {
  margin-bottom: 4px;
  word-break: break-all;
}

.position-coords {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 搜索对话框样式 */
.search-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quick-results {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
}

.quick-result-item {
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color);
  transition: background-color 0.2s;
}

.quick-result-item:last-child {
  border-bottom: none;
}

.quick-result-item:hover {
  background-color: var(--el-fill-color-light);
}

.quick-result-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.quick-result-address {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.no-results {
  text-align: center;
  padding: 20px;
  color: var(--el-text-color-secondary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 自定义标记样式 */
:deep(.custom-marker) {
  background: transparent;
  border: none;
}

.marker-pin {
  width: 30px;
  height: 30px;
  background: var(--el-color-primary);
  border: 3px solid white;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.marker-pin::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
}
</style>