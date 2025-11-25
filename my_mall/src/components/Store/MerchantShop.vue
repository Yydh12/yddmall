<template>
  <Navbar />
  <div class="shop-container">
    <!-- 店铺头部信息 -->
    <div class="shop-header">
      <div class="shop-content">
        <div class="shop-basic-info">
          <div class="shop-avatar-section">
            <img class="shop-logo" :src="shopInfo.logo" :alt="shopInfo.name + '标志'" />
          </div>
          <div class="shop-meta">
            <h1 class="shop-name">{{ shopInfo.name }}</h1>
            <div class="shop-id">店铺编号：{{ shopInfo.no }}</div>
            <div class="shop-badges">
              <span v-if="shopBadges.official" class="badge official">官方认证</span>
              <span v-if="shopBadges.brand" class="badge brand">品牌店铺</span>
              <span v-if="shopBadges.warranty" class="badge warranty">支持保修</span>
              <span v-if="shopBadges.return7days" class="badge return">7天无理由</span>
            </div>
            <div class="info-card" v-if="shopInfo.address">
              <div class="card-header">
                <h3>店铺地址</h3>
              </div>
              <p class="card-content">{{ shopInfo.address }}</p>
            </div>
          </div>
        </div>
        
        <div class="shop-stats">
          <div class="stat-item" v-for="stat in formattedStats" :key="stat.label">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
        
        <div class="shop-actions">
          <button 
            class="follow-btn" 
            :class="{ 'followed': isFollowing }" 
            @click="toggleFollow"
          >
            {{ isFollowing ? '已收藏' : '收藏店铺' }}
          </button>
          <button class="contact-btn" @click="contactShop">联系客服</button>
        </div>
      </div>
    </div>
    
    <!-- 店铺信息卡片 -->
    <div class="info-cards">
      <div class="info-card" v-if="shopInfo.description">
        <div class="card-header">
          <h3>店铺介绍</h3>
        </div>
        <p class="card-content">{{ shopInfo.description }}</p>
      </div>
    </div>
    
    <!-- 顶部分类导航栏 -->
    <div class="top-category-nav">
      <div class="category-tabs">
        <div 
          v-for="category in categories" 
          :key="category.id"
          class="category-tab"
          :class="{ 'active': activeCategory === category.id }"
          @click="switchCategory(category.id)"
        >
          <span class="tab-name">{{ category.name }}</span>
          <span class="tab-count" v-if="category.count">({{ category.count }})</span>
        </div>
      </div>
      
      <div class="nav-search-section">
        <el-input
          v-model="filter.keyword"
          placeholder="搜索店内商品..."
          clearable
          @keyup.enter="searchProducts"
          class="search-input"
        >
          <template #append>
            <el-button @click="searchProducts" class="search-btn">搜索</el-button>
          </template>
        </el-input>
      </div>
    </div>
    
    <!-- 商品列表区域 -->
    <div class="product-list-section">
      <div class="section-header">
        <h2 class="section-title">{{ getActiveCategoryName() }}</h2>
        <span class="product-count">共 {{ pagination.total }} 件商品</span>
      </div>
      
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="products.length === 0" class="empty-state">
        <h3>暂无商品</h3>
        <p>店铺正在努力上架新品中...</p>
        <button class="refresh-btn" @click="loadProducts">重新加载</button>
      </div>
      
      <div v-else class="products-grid">
        <div 
          v-for="product in products" 
          :key="product.itemId" 
          class="product-card"
          @click="goToProductDetail(product.itemId)"
        >
          <div class="product-image-container">
            <img 
              :src="getProductImage(product)" 
              :alt="product.title" 
              class="product-image"
            />
            <div v-if="product.quantity <= 0" class="sold-out-badge">售罄</div>
            <div v-else-if="product.quantity < 10" class="hot-badge">热销</div>
          </div>
          
          <div class="product-info">
            <h3 class="product-name">{{ product.title }}</h3>
            
            <div class="product-price-section">
              <div class="price-main">
                <span class="current-price">¥{{ product.price?.toFixed(2) }}</span>
                <span v-if="product.originalPrice > product.price" class="original-price">
                  ¥{{ product.originalPrice?.toFixed(2) }}
                </span>
              </div>
              <div v-if="product.originalPrice > product.price" class="discount-badge">
                -{{ calculateDiscount(product.originalPrice, product.price) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分页 -->
      <div class="pagination-container" v-if="products.length > 0 && pagination.total > pagination.size">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[12, 24, 36, 48]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import Navbar from '../../components/Home/Navbar.vue'
import axios from '../../axios'

const route = useRoute()
const router = useRouter()

const shopId = computed(() => route.query.shopId || route.params.shopId || '')

const getToken = () => {
  return localStorage.getItem('token') || ''
}

const shopInfo = ref({
  id: '',
  no: '',
  name: '',
  logo: 'https://via.placeholder.com/100x100?text=店铺',
  description: '',
  address: ''
})

const shopStats = ref({
  rating: 0,
  fans: 0,
  goodsCount: 0,
  favorableRate: 0
})

const formattedStats = computed(() => [
  { label: '店铺评分', value: shopStats.value.rating ? shopStats.value.rating.toFixed(1) : '—' },
  { label: '粉丝数', value: formatNumber(shopStats.value.fans) },
  { label: '在售商品', value: formatNumber(shopStats.value.goodsCount) },
  { label: '好评率', value: shopStats.value.favorableRate ? (shopStats.value.favorableRate.toFixed(1) + '%') : '—' }
])

const shopBadges = ref({
  official: true,
  brand: true,
  warranty: true,
  return7days: true
})

const isFollowing = ref(false)
const products = ref([])
const loading = ref(true)
const activeCategory = ref('all') // 默认选中全部商品

const filter = ref({
  keyword: ''
})

const pagination = ref({
  current: 1,
  size: 12,
  total: 0
})

const categories = ref([
  { id: 'all', name: '全部商品', count: 0 },
  { id: 'popular', name: '热门商品', count: 0 },
  { id: 'newest', name: '新品上架', count: 0 }
])

const formatNumber = (num) => {
  if (!num && num !== 0) return '—'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

const getProductImage = (product) => {
  if (product && product.picUrl) {
    const images = String(product.picUrl)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    if (images.length) return images[0]
  }
  return product.skuPic || product.pic || 'https://via.placeholder.com/300x300?text=商品图片'
}

const calculateDiscount = (original, current) => {
  if (!original || !current) return 0
  return Math.round((1 - current / original) * 100)
}

const getStockText = (quantity) => {
  if (!quantity && quantity !== 0) return '未知'
  if (quantity <= 0) return '无货'
  if (quantity < 10) return '库存紧张'
  return '有货'
}

const getActiveCategoryName = () => {
  const category = categories.value.find(cat => cat.id === activeCategory.value)
  return category ? category.name : '全部商品'
}

const switchCategory = (categoryId) => {
  activeCategory.value = categoryId
  pagination.value.current = 1
  loadProducts()
}

const toggleFollow = async () => {
  try {
    const shop = shopInfo.value.id || shopId.value
    if (!shop) {
      ElMessage.warning('无法识别店铺信息')
      return
    }
    if (!isFollowing.value) {
      const { data } = await axios.post(`/favorite/merchant/${shop}`)
      if (data?.code === 200) {
        isFollowing.value = true
        ElMessage.success('已收藏店铺')
      } else {
        ElMessage.error(data?.msg || '收藏失败')
      }
    } else {
      const { data } = await axios.delete(`/favorite/merchant/${shop}`)
      if (data?.code === 200) {
        isFollowing.value = false
        ElMessage.success('已取消收藏')
      } else {
        ElMessage.error(data?.msg || '取消收藏失败')
      }
    }
  } catch (error) {
    console.error('关注操作失败:', error)
    if (error?.response?.status === 401) {
      ElMessage.error('请先登录')
      router.push('/login')
    } else {
      ElMessage.error('操作失败，请稍后重试')
    }
  }
}

const contactShop = () => {
  const contactInfo = shopInfo.value.contactPhone ? 
    `联系电话：${shopInfo.value.contactPhone}` : 
    '联系电话：13588889999'
  
  ElMessageBox.alert(contactInfo, '联系客服', {
    confirmButtonText: '确定'
  })
}

const addToCart = (product) => {
  ElMessage.success(`已添加 ${product.title} 到购物车`)
}

const searchProducts = () => {
  pagination.value.current = 1
  loadProducts()
}

const handleSizeChange = (newSize) => {
  pagination.value.size = newSize
  pagination.value.current = 1
  loadProducts()
}

const handleCurrentChange = (newPage) => {
  pagination.value.current = newPage
  loadProducts()
}

const goToProductDetail = (productId) => {
  router.push(`/productInfo/${productId}`)
}

const loadShopInfo = async () => {
  try {
    const response = await axios.get(`/merchant/getMerchant/${shopId.value}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    })
    
    const data = response.data.data || {}
    
    shopInfo.value = {
      id: data.merchantId || shopId.value,
      no: data.merchantNo || '',
      name: data.merchantName || '我的店铺',
      logo: data.merchantPic || 'https://via.placeholder.com/100x100?text=店铺',
      description: data.remark || '',
      address: `${data.province || ''} ${data.city || ''} ${data.district || ''} ${data.address || ''}`.trim(),
      contactPhone: data.contactPhone || ''
    }
    
  } catch (error) {
    console.error('加载店铺信息失败:', error)
    if (error.response?.status === 401) {
      ElMessage.error('身份验证失败，请重新登录')
      router.push('/login')
    } else {
      ElMessage.error('加载店铺信息失败: ' + (error.response?.data?.message || '未知错误'))
    }
  }
}

const loadProducts = async () => {
  try {
    loading.value = true

    let response
    const keyword = filter.value.keyword || ''

    // 根据当前选中的分类调用不同的API
    if (activeCategory.value === 'popular') {
      // 热门商品
      const params = {
        current: pagination.value.current,
        size: pagination.value.size,
        sellerId: shopId.value,
        status: 1,
        title: keyword
      }
      response = await axios.get('/item/popular', { params })
    } else if (activeCategory.value === 'newest') {
      // 新品上架
      const params = {
        current: pagination.value.current,
        size: pagination.value.size,
        sellerId: shopId.value,
        status: 1,
        title: keyword
      }
      response = await axios.get('/item/newest', { params })
    } else {
      // 全部商品
      const params = {
        current: pagination.value.current,
        size: pagination.value.size,
        sellerId: shopId.value,
        status: 1,
        title: keyword
      }
      response = await axios.get('/item', { params })
    }

    if (response.data.code === 200) {
      const data = response.data.data
      const records = data.records || []
      
      products.value = records.map(item => ({
        itemId: item.itemId,
        title: item.title,
        subtitle: item.subTitle || item.subtitle,
        itemNo: item.itemNo,
        price: item.price,
        originalPrice: item.originalPrice || item.price,
        picUrl: item.picUrl || '',
        skuPic: item.skuPic || item.pic || '',
        quantity: (item.quantity ?? item.stockQuantity) || 0,
        status: item.status,
        brand: item.brand,
        sales: item.salesCount || item.sales || 0
      }))
      
      pagination.value.total = data.total || 0
    } else {
      ElMessage.error(response.data.msg || '获取商品列表失败')
      products.value = []
      pagination.value.total = 0
    }
  } catch (error) {
    console.error('加载商品列表失败:', error)
    ElMessage.error('加载商品失败: ' + (error.response?.data?.message || '未知错误'))
    products.value = []
    pagination.value.total = 0
  } finally {
    loading.value = false
  }
}

const loadShopStats = async () => {
  try {
    const { data } = await axios.get(`/merchant/${shopId.value}/stats`)
    if (data?.code === 200) {
      const s = data.data || {}
      shopStats.value.rating = s.avgRating || 0
      shopStats.value.fans = s.fansCount || 0
      shopStats.value.goodsCount = s.onSaleCount || 0
      // 后端返回 0-1，前端显示百分比
      shopStats.value.favorableRate = s.positiveRate ? (s.positiveRate * 100) : 0
    }
  } catch (e) {
    console.warn('加载店铺统计失败:', e?.response?.data || e)
  }
}

watch(
  () => shopId.value,
  (newShopId) => {
    if (newShopId) {
      loadShopInfo()
      loadProducts()
    }
  }
)

onMounted(async () => {
  if (!getToken()) {
    ElMessage.error('请先登录')
    router.push('/login')
    return
  }
  
  if (!shopId.value) {
    ElMessage.error('未找到店铺信息')
    router.push('/')
    return
  }
  
  await loadShopInfo()
  await loadProducts()
  await loadShopStats()

  // 初始化收藏状态
  try {
    const shop = shopInfo.value.id || shopId.value
    if (shop) {
      const { data } = await axios.get(`/favorite/merchant/${shop}/exists`)
      if (data?.code === 200) {
        isFollowing.value = !!data.data
      }
    }
  } catch (e) {
    console.warn('获取收藏状态失败:', e?.response?.data || e)
  }
})
</script>

<style scoped>
.shop-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 40px;
  min-height: 100vh;
}

.shop-header {
  background: #f5f7fa;
  border-radius: 8px;
  margin: 20px 0;
  padding: 24px;
}

.shop-content {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 40px;
  align-items: start;
}

.shop-basic-info {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.shop-logo {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  background: white;
  object-fit: cover;
}

.shop-meta {
  flex: 1;
}

.shop-name {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.shop-id {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.shop-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.badge {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background: #e8f4fd;
  color: #1890ff;
}

.shop-stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.shop-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.follow-btn, .contact-btn {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  min-width: 100px;
}

.follow-btn:hover, .contact-btn:hover {
  background: #f5f7fa;
}

.follow-btn.followed {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.info-cards {
  margin-bottom: 20px;
}

.info-card {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.card-header {
  margin-bottom: 12px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.card-content {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

/* 顶部分类导航栏样式 */
.top-category-nav {
  background: white;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
}

.category-tabs {
  display: flex;
  align-items: center;
  gap: 0;
}

.category-tab {
  display: flex;
  align-items: center;
  padding: 0 24px;
  height: 60px;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
  font-size: 14px;
  color: #666;
}

.category-tab:hover {
  color: #1890ff;
  background: #f6fbff;
}

.category-tab.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
  font-weight: 500;
  background: #f6fbff;
}

.tab-name {
  margin-right: 4px;
}

.tab-count {
  font-size: 12px;
  color: #999;
}

.category-tab.active .tab-count {
  color: #1890ff;
}

.nav-search-section {
  width: 300px;
}

.search-input {
  width: 100%;
}

.search-btn {
  background: #1890ff;
  color: white;
  border: none;
}

.search-btn:hover {
  background: #40a9ff;
}

/* 商品列表区域 */
.product-list-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.product-count {
  color: #666;
  font-size: 14px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #999;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #999;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: #666;
}

.empty-state p {
  margin: 0 0 16px 0;
}

.refresh-btn {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.product-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
  cursor: pointer;
  transition: box-shadow 0.3s;
}

.product-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.product-image-container {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f5f5f5;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sold-out-badge, .hot-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: white;
}

.sold-out-badge {
  background: rgba(0, 0, 0, 0.7);
}

.hot-badge {
  background: #ff4d4f;
}

.product-info {
  padding: 16px;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 8px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  height: 2.8em;
}

.product-sku {
  font-size: 12px;
  color: #999;
  margin: 0 0 12px 0;
}

.product-price-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.price-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-price {
  font-size: 18px;
  font-weight: 600;
  color: #ff4d4f;
}

.original-price {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}

.discount-badge {
  background: #ff4d4f;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 12px;
  color: #666;
}

.low-stock {
  color: #ff4d4f;
  font-weight: 500;
}

.add-cart-btn {
  width: 100%;
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.add-cart-btn:hover {
  background: #40a9ff;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .shop-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .shop-basic-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .shop-actions {
    flex-direction: row;
    justify-content: center;
  }
  
  .top-category-nav {
    flex-direction: column;
    height: auto;
    padding: 16px;
    gap: 16px;
  }
  
  .category-tabs {
    width: 100%;
    justify-content: space-around;
  }
  
  .category-tab {
    flex: 1;
    justify-content: center;
    padding: 12px 8px;
    height: auto;
  }
  
  .nav-search-section {
    width: 100%;
  }
  
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (max-width: 480px) {
  .shop-container {
    padding: 0 16px 20px;
  }
  
  .shop-content {
    padding: 16px;
  }
  
  .category-tabs {
    flex-direction: column;
    gap: 8px;
  }
  
  .category-tab {
    width: 100%;
    border-bottom: none;
    border-left: 3px solid transparent;
  }
  
  .category-tab.active {
    border-left-color: #1890ff;
    border-bottom: none;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .product-list-section {
    padding: 16px;
  }
}
</style>