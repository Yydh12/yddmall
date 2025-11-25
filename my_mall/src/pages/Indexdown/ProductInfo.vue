<template>
  <Navbar />
  <div class="home-container">
    <Search />
    <div class="product-detail-container">
      <!-- 商品图片区域 -->
      <div class="product-image" @mouseleave="onMagnifyLeave">
        <!-- 店铺信息栏 -->
        <div class="store-header" aria-label="店铺信息">
          <img class="store-logo" :src="storeInfo.logo" :alt="storeInfo.name + '标志'" />
          <div class="store-meta">
            <div class="store-name">{{ storeInfo.name }}</div>
            <div class="store-id" v-if="storeInfo.id || storeInfo.no">店铺编号：{{ storeInfo.no || storeInfo.id }}</div>
            <div class="store-badges">
              <span v-if="storeBadges.official" class="badge official" aria-label="官方认证">官方</span>
              <span v-if="storeBadges.brand" class="badge brand" aria-label="品牌店铺">品牌</span>
              <span v-if="storeBadges.warranty" class="badge warranty" aria-label="支持保修">保修</span>
              <span v-if="storeBadges.return7days" class="badge return" aria-label="七天无理由">7天无理由</span>
            </div>
          </div>
          <div class="store-actions">
            <button class="store-enter-btn" v-if="storeInfo.id" @click="enterStore">进店逛逛</button>
            <button class="store-follow-btn" @click="followStore">{{ followed ? '已收藏' : '收藏店铺' }}</button>
            <button class="store-contact-btn" @click="contactStore">联系客服</button>
          </div>
        </div>
        <div class="store-stats" aria-label="店铺数据">
          <div class="store-stat">
            <span class="stat-label">评分</span>
            <span class="stat-value">{{ storeStats.rating ?? '—' }}</span>
          </div>
          <div class="store-stat">
            <span class="stat-label">粉丝</span>
            <span class="stat-value">{{ storeStats.fans ?? '—' }}</span>
          </div>
          <div class="store-stat">
            <span class="stat-label">在售商品</span>
            <span class="stat-value">{{ storeStats.goodsCount ?? '—' }}</span>
          </div>
          <div class="store-stat">
            <span class="stat-label">好评率</span>
            <span class="stat-value">{{ storeStats.favorableRate ? storeStats.favorableRate + '%' : '—' }}</span>
          </div>
        </div>
        <el-carousel :interval="4000" height="400px" v-if="picUrls.length > 0" @change="onCarouselChange">
          <el-carousel-item v-for="(pic, index) in picUrls" :key="index">
            <div class="magnify-wrap" @mousemove="onMagnifyMove" @mouseenter="onMagnifyEnter(pic)" @mouseleave="onMagnifyLeave">
              <img :src="pic" :alt="`${item.title || '商品'}图片${index+1}`" class="carousel-image" @click="openCommentImageViewer(picUrls, index)" />
            </div>
          </el-carousel-item>
        </el-carousel>
        <Teleport to="body">
          <div v-if="magnifierVisible" class="magnify-lens" :style="lensStyle"></div>
          <div v-if="magnifierVisible" class="magnify-result" :style="resultStyle"></div>
        </Teleport>
        <div v-if="picUrls.length === 0" class="no-image-placeholder">
          <img src="https://via.placeholder.com/400x400?text=暂无图片" alt="暂无图片" class="carousel-image" />
        </div>

        <!-- 商品详情标签页 -->
        <div class="product-tabs">
          <el-tabs v-model="activeTab" class="tabs-container">
            <el-tab-pane label="评论" name="comment">
              <div class="comment-section">
                <!-- 评论列表 -->
                <div class="comment-list">
                  <div v-if="commentsLoading" class="comment-loading">正在加载评论...</div>
                  <div v-else>
                    <div v-if="comments.length === 0">
                      <div class="comment-empty">暂无评论，快来抢个沙发～</div>
                      <div class="comment-pagination">
                        <el-button type="primary" @click="commentDialogVisible = true" style="margin-left: 10px;">发表评论</el-button>
                      </div>
                    </div>
                    <div v-else>
                      <div class="comment-item" v-for="c in comments" :key="c.commentId">
                        <img class="comment-avatar" :src="c.avatar || 'https://via.placeholder.com/40x40?text=U'" alt="头像" />
                        <div class="comment-content">
                          <div class="comment-header">
                            <span class="comment-user">{{ c.userName || ('用户' + (c.userId || '')) }}</span>
                            <el-rate :model-value="c.rating" disabled show-score/>
                            <span class="comment-time">{{ formatDisplayTime(c.createTime) }}</span>
                          </div>
                          <div class="comment-text">{{ c.content }}</div>
                          <div v-if="c.images && c.images.length" class="comment-image-row">
                            <template v-for="(img, idx) in c.images.slice(0, maxPreviewImages)" :key="idx">
                              <img class="comment-image" :src="img" alt="评论图片" @click="openCommentImageViewer(c.images, idx)" />
                            </template>
                            <div v-if="c.images.length > maxPreviewImages" class="comment-image-more" @click="openCommentImageViewer(c.images, maxPreviewImages)">+{{ c.images.length - maxPreviewImages }}张</div>
                          </div>
                          <div v-if="c.replyContent" class="merchant-reply">
                            <div class="reply-title">商家回复</div>
                            <div class="reply-content">{{ c.replyContent }}</div>
                            <div class="reply-time">{{ formatDisplayTime(c.replyTime) }}</div>
                          </div>
                        </div>
                      </div>

                      <div class="comment-pagination">
                        <el-pagination
                          background
                          layout="prev, pager, next"
                          :total="commentPage.total"
                          :page-size="commentPage.pageSize"
                          :current-page="commentPage.pageNum"
                          @current-change="handleCommentPageChange"
                        />
                        <el-button type="primary" @click="commentDialogVisible = true" style="margin-left: 10px;">发表评论</el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 商品信息区域 -->
      <div class="product-info">
        <h1 class="product-title">{{ item.title || '加载中...' }}</h1>
        <p class="product-subtitle">{{ item.subTitle || '' }}</p>
        
        <!-- 价格信息 -->
        <div class="price-container">
          <span class="price-label">售价：</span>
          <div class="price-content">
            <span class="current-price">¥{{ selectedSku.price.toFixed(2) }}</span>
            <span class="original-price" v-if="item.price && selectedSku.price && item.price > selectedSku.price">
              ¥{{ item.price.toFixed(2) }}
            </span>
          </div>
        </div>

        <!-- 红包展示区（抽取为独立组件） -->
        <RedPacketSection
          :redPackets="availableRedPackets"
          :myRedPacketIds="myRedPacketIds"
          :claimingRedPacketId="claimingRedPacketId"
          :onClaim="onClaimRedPacket"
          :loading="loadingDiscounts"
        />

        <!-- 售后信息 -->
        <div class="aftersale-container">
          <div class="aftersale-content">
            <p v-if="aftersaleInfo">
              <span class="aftersale-key">发货时间：</span>
              <span class="aftersale-value">{{ aftersaleInfo.deliveryTime || '暂无信息' }}</span>
            </p>
            <p v-if="aftersaleInfo">
              <span class="aftersale-key">保修服务：</span>
              <span class="aftersale-value">{{ aftersaleInfo.warranty ? '支持保修' : '不支持保修' }}</span>
            </p>
            <p v-if="aftersaleInfo">
              <span class="aftersale-key">退换政策：</span>
              <span class="aftersale-value">{{ aftersaleInfo.return7days ? '支持7天无理由退换' : '不支持7天无理由退换' }}</span>
            </p>
            <p v-else>{{ item.aftersale || '暂无售后信息' }}</p>
          </div>
        </div>
        
        <!-- 库存信息 -->
        <div class="stock-container">
          <span class="stock-label">库存：</span>
          <span class="stock-count">{{ selectedSku.quantity }}件</span>
          <span class="stock-status" :class="{'in-stock': selectedSku.quantity > 0, 'out-of-stock': selectedSku.quantity <= 0}">
            {{ selectedSku.quantity > 0 ? '有货' : '无货' }}
          </span>
        </div>
        
        <!-- SKU选择 -->
        <div class="sku-container" v-if="loading || skus.length >= 1">
          <span class="sku-label">分类：</span>
          <!-- 加载骨架 -->
          <div v-if="loading" class="sku-skeleton" aria-busy="true" aria-label="正在加载规格">
            <div class="skeleton-row" v-for="n in 3" :key="n"></div>
          </div>

          <div v-else class="sku-options" role="list" aria-label="规格列表">
            <div
              v-for="sku in skus"
              :key="sku.skuId || sku.id"
              class="sku-option"
              :class="{
                'selected': isSelected(sku),
                'disabled': isDisabled(sku)
              }"
              role="listitem"
              tabindex="0"
              @click="selectSku(sku)"
              @keydown.enter="selectSku(sku)"
              @keydown.space.prevent="selectSku(sku)"
            >
              <img
                class="sku-thumb"
                :src="sku.skuPic || picUrls[0] || 'https://via.placeholder.com/60x60?text=无图'"
                :alt="(sku.skuName || sku.name || '规格') + '图片'"
                @click="openSkuImageViewer(sku)"
              />
              <div class="sku-info">
                <div class="sku-name">{{ sku.skuName || sku.name || '规格' }}</div>
                <div class="sku-stock" v-if="typeof sku.quantity !== 'undefined'">库存：{{ sku.quantity }}</div>
              </div>
              <span v-if="sku.status !== 1 || sku.quantity <= 0" class="sku-soldout" aria-label="售罄">售罄</span>
              <span class="sku-price">¥{{ (sku.price || 0).toFixed(2) }}</span>
            </div>
          </div>
        </div>
        
        <!-- 购买区域 -->
        <div class="action-container">
          <div class="quantity-selector">
            <button 
              class="quantity-btn" 
              @click="decreaseQuantity" 
              :disabled="quantity <= 1"
            >
              -
            </button>
            <input 
              type="number" 
              v-model.number="quantity" 
              class="quantity-input"
              :min="1"
              :max="selectedSku.quantity"
              @change="handleQuantityChange"
            >
            <button 
              class="quantity-btn" 
              @click="increaseQuantity" 
              :disabled="quantity >= selectedSku.quantity"
            >
              +
            </button>
          </div>
          
          <button 
            class="add-to-cart-btn"
            :disabled="!canAddToCart"
            @click="addToCart"
          >
            加入购物车
          </button>
          
          <button 
            class="buy-now-btn"
            :disabled="!canAddToCart"
            @click="buyNow"
          >
            立即购买
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 评论弹窗 -->
  <el-dialog v-model="commentDialogVisible" title="发表评论" width="500px" @close="onCommentDialogClose">
    <div class="comment-form">
      <div class="form-row">
        <span class="form-label">评分：</span>
        <el-rate v-model="newComment.rating" :max="5" />
      </div>
      <div class="form-row">
        <span class="form-label">内容：</span>
        <el-input
          v-model="newComment.content"
          type="textarea"
          :rows="4"
          placeholder="说点什么吧..."
        />
      </div>
      <div class="form-row">
        <span class="form-label">图片：</span>
        <div class="comment-upload-and-preview">
          <el-upload
            class="comment-image-uploader"
            action="#"
            :show-file-list="false"
            :http-request="handleCommentImageUpload"
            :before-upload="validateCommentImage"
            multiple
            accept="image/*"
          >
            <el-button size="small">上传图片</el-button>
          </el-upload>
          <div class="comment-image-row" v-if="commentImages.length">
            <template v-for="(img, idx) in visibleCommentImages" :key="idx">
              <img class="comment-image" :src="img" alt="评论图片" />
            </template>
            <div v-if="commentImages.length > maxPreviewImages" class="comment-image-more">+{{ commentImages.length - maxPreviewImages }}张</div>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="onCommentDialogCancel">取消</el-button>
        <el-button type="primary" :loading="posting" @click="submitComment">发表</el-button>
      </span>
    </template>
  </el-dialog>
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
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import Navbar from '../../components/Home/Navbar.vue';
import Search from '../../components/Home/Search.vue';
import axios from '../../axios';
import { cartUtils } from '../../utils/cart';

// 路由参数获取
const route = useRoute();
const router = useRouter();

// 状态管理
import RedPacketSection from '../../components/Product/RedPacketSection.vue'

const item = ref({
  title: '',
  subTitle: '',
  price: 0,
  picUrl: '',
  aftersale: '',
  brand: '',
  itemId: '',
  listTime: null,
  lastUpdate: ''
});
const skus = ref([]);
const merchant = ref({});
const selectedSku = ref({ 
  price: 0, 
  quantity: 0, 
  status: 0, 
  skuPic: '', 
  skuName: '默认规格', 
  skuId: '',
  id: ''
});
const quantity = ref(1);
const activeTab = ref('comment');
const categoryName = ref('智能穿戴');
const loading = ref(true);
const followed = ref(false);

// 优惠展示相关状态
// 原始列表（不筛选）
const allRedPackets = ref([]);
const allCoupons = ref([]);
// 展示列表（按价格门槛筛选）
const availableRedPackets = ref([]);
const availableCoupons = ref([]);
// 已领取集合（用于显示“已领取”并隐藏按钮）
const myRedPacketIds = ref([]);
const myCouponIds = ref([]);
const claimingRedPacketId = ref(null);
const claimingCouponId = ref(null);
const loadingDiscounts = ref(false);

// 评论相关状态
const comments = ref([]);
const commentsLoading = ref(false);
const posting = ref(false);
const commentPage = ref({ pageNum: 1, pageSize: 5, total: 0 });
const newComment = ref({ rating: 5, content: '' });
const currentUser = ref(null);
const commentDialogVisible = ref(false);
// 评论图片相关
const commentImages = ref([]); // 上传后返回的访问URL
const uploadedImageFiles = ref([]); // { url, fileName }
const maxPreviewImages = 5;
const visibleCommentImages = computed(() => commentImages.value.slice(0, maxPreviewImages));
const commentPublished = ref(false);
// 图片查看器状态与打开方法
const imageViewerVisible = ref(false);
const imageViewerImages = ref([]);
const imageViewerIndex = ref(0);
const openCommentImageViewer = (imgs, startIdx = 0) => {
  if (!Array.isArray(imgs) || !imgs.length) return;
  imageViewerImages.value = imgs;
  imageViewerIndex.value = Math.min(Math.max(startIdx, 0), imgs.length - 1);
  imageViewerVisible.value = true;
};
// SKU图片查看器：点击SKU缩略图可查看SKU图片，若SKU无图则回退到主图
const openSkuImageViewer = (sku) => {
  const skuPics = (skus.value || []).map(s => s?.skuPic).filter(Boolean);
  if (skuPics.length) {
    const startIdx = Math.max(0, skuPics.indexOf(sku?.skuPic));
    openCommentImageViewer(skuPics, startIdx);
    return;
  }
  if (picUrls.value?.length) openCommentImageViewer(picUrls.value, 0);
};
// 主图放大镜：鼠标悬停显示放大区域，支持跟随移动
const magnifierVisible = ref(false);
const magnifierSrc = ref('');
const lensStyle = ref({});
const resultStyle = ref({});
const magnifierZoom = ref(2); // 放大倍数
const LENS_W = 360;
const LENS_H = 360;
const RESULT_W = 560;
const RESULT_H = 560;
// 桌面环境标识：统一判断，无触控且宽度>992
const isDesktop = ref(true);
const updateDesktopFlag = () => {
  try {
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0 || (navigator.msMaxTouchPoints || 0) > 0;
    const prefersFinePointer = window.matchMedia ? window.matchMedia('(pointer: fine)').matches : true;
    const prefersHover = window.matchMedia ? window.matchMedia('(hover: hover)').matches : true;
    const width = window.innerWidth || document.documentElement.clientWidth || 0;
    isDesktop.value = !hasTouch && prefersFinePointer && prefersHover && width > 992;
  } catch {
    isDesktop.value = true;
  }
};
onMounted(() => {
  updateDesktopFlag();
  window.addEventListener('resize', updateDesktopFlag);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDesktopFlag);
});
const onCarouselChange = (currentIndex) => {
  // 轮播切换时同步当前放大源，避免图片错位
  const idx = typeof currentIndex === 'number' ? currentIndex : 0;
  magnifierSrc.value = picUrls.value[idx] || magnifierSrc.value;
};
// 样式计算辅助：统一更新镜片与结果视图样式
const updateMagnifierStyles = (rect, lx, ly) => {
  const zoom = magnifierZoom.value;
  lensStyle.value = {
    left: `${rect.left + lx}px`,
    top: `${rect.top + ly}px`,
    width: `${LENS_W}px`,
    height: `${LENS_H}px`
  };
  resultStyle.value = {
    position: 'fixed',
    left: `${rect.right + 16}px`,
    top: `${rect.top}px`,
    width: `${RESULT_W}px`,
    height: `${RESULT_H}px`,
    backgroundImage: `url(${magnifierSrc.value})`,
    backgroundSize: `${rect.width * zoom}px ${rect.height * zoom}px`,
    backgroundPosition: `-${lx * zoom}px -${ly * zoom}px`,
    zIndex: 3999
  };
};
const onMagnifyEnter = (src) => {
  if (!isDesktop.value) { magnifierVisible.value = false; return; }
  magnifierSrc.value = src || '';
  magnifierVisible.value = !!magnifierSrc.value;
};
const onMagnifyMove = (e) => {
  if (!magnifierVisible.value || !isDesktop.value) return;
  const el = e.currentTarget;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const lx = Math.max(0, Math.min(x - LENS_W / 2, rect.width - LENS_W));
  const ly = Math.max(0, Math.min(y - LENS_H / 2, rect.height - LENS_H));
  updateMagnifierStyles(rect, lx, ly);
};
const onMagnifyLeave = () => {
  magnifierVisible.value = false;
};

// 计算属性
const picUrls = computed(() => {
  if (item.value.picUrl) {
    return item.value.picUrl.split(',').map(pic => `${pic.trim()}`).filter(Boolean);
  }
  return [];
});

const storeInfo = computed(() => {
  const name = item.value.brand || '官方店铺';
  const id = merchant.value.merchantNo || '';
  const logo = (picUrls.value[0] || 'https://via.placeholder.com/40x40?text=店');
  return { name, id, logo };
});

const storeStats = ref({
  rating: 0,
  fans: 0,
  goodsCount: 0,
  favorableRate: 0,
  contact: ''
});

const storeBadges = computed(() => {
  const official = !!(item.value.officialShop ?? item.value.isOfficial);
  const brand = !!(item.value.brand);
  const warranty = !!(aftersaleInfo.value && aftersaleInfo.value.warranty);
  const return7days = !!(aftersaleInfo.value && aftersaleInfo.value.return7days);
  return { official, brand, warranty, return7days };
});

const aftersaleInfo = computed(() => {
  try {
    if (!item.value.aftersale) return null;
    const info = JSON.parse(item.value.aftersale);
    return typeof info === 'object' && info !== null ? info : null;
  } catch (e) {
    console.error('售后信息解析失败:', e);
    return null;
  }
});

const canAddToCart = computed(() => {
  return selectedSku.value.status === 1 && selectedSku.value.quantity > 0 && quantity.value > 0;
});

// 方法
const getSkuKey = (s) => {
  if (!s) return null;
  return typeof s.skuId !== 'undefined' && s.skuId !== '' ? s.skuId : (typeof s.id !== 'undefined' && s.id !== '' ? s.id : null);
};

const isDisabled = (s) => {
  if (!s) return true;
  return s.status !== 1 || s.quantity <= 0;
};

const isSelected = (s) => {
  const currentKey = getSkuKey(selectedSku.value);
  const targetKey = getSkuKey(s);
  return currentKey !== null && targetKey !== null && currentKey === targetKey;
};

const selectSku = (sku) => {
  if (sku.status !== 1 || sku.quantity <= 0) return;
  selectedSku.value = sku;
  quantity.value = 1;
};

const increaseQuantity = () => {
  if (quantity.value < selectedSku.value.quantity) {
    quantity.value++;
  }
};

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};

const handleQuantityChange = () => {
  if (isNaN(quantity.value)) {
    quantity.value = 1;
    return;
  }
  quantity.value = Math.max(1, Math.min(quantity.value, selectedSku.value.quantity));
};

const addToCart = async () => {
  if (!canAddToCart.value) return;
  
  try {
    const cartItem = {
      itemId: item.value.itemId,
      skuId: selectedSku.value.skuId || selectedSku.value.id,
      productName: item.value.title,
      skuName: selectedSku.value.skuName || selectedSku.value.name,
      price: selectedSku.value.price,
      productImage: selectedSku.value.skuPic || item.value.image,
      quantity: quantity.value,
      stock: selectedSku.value.quantity
    };

    const result = await cartUtils.addToCart(cartItem);
    
    if (result.success) {
      ElMessage.success(`已添加 ${quantity.value} 件 ${selectedSku.value.skuName || selectedSku.value.name} 到购物车`);
    } else {
      ElMessage.error(result.message || '添加失败');
    }
  } catch (error) {
    console.error('添加到购物车失败:', error);
    ElMessage.error('添加到购物车失败');
  }
};

const enterStore = () => {
  if (!storeInfo.value.id) return;
  router.push({
    path: `/merchantshop`,
    query: { shopId: merchant.value.merchantId }
  });
};

const followStore = async () => {
  try {
    const shopId = merchant.value.merchantId || item.value.sellerId;
    if (!shopId) {
      ElMessage.warning('无法识别店铺信息');
      return;
    }
    if (!followed.value) {
      const { data } = await axios.post(`/favorite/merchant/${shopId}`);
      if (data?.code === 200) {
        followed.value = true;
        ElMessage.success('已收藏店铺');
      } else {
        ElMessage.error(data?.msg || '收藏失败');
      }
    } else {
      const { data } = await axios.delete(`/favorite/merchant/${shopId}`);
      if (data?.code === 200) {
        followed.value = false;
        ElMessage.success('已取消收藏');
      } else {
        ElMessage.error(data?.msg || '取消收藏失败');
      }
    }
  } catch (e) {
    console.error('收藏操作失败:', e);
    if (e?.response?.status === 401) {
      ElMessage.error('请先登录');
      router.push('/login');
    } else {
      ElMessage.error('操作失败，请稍后重试');
    }
  }
};

const contactStore = () => {
  const c = storeStats.value.contact;
  if (!c) {
    ElMessage.warning('暂无联系方式');
    return;
  }
  try {
    // window.location.href = `tel:${c}`;
    ElMessage.info(`联系方式：${c}`);
  } catch {
    ElMessage.info(`联系方式：${c}`);
  }
};

const loadStoreStats = async () => {
  try {
    const shopId = merchant.value.merchantId || item.value.sellerId;
    if (!shopId) return;
    const { data } = await axios.get(`/merchant/${shopId}/stats`);
    if (data?.code === 200) {
      const s = data.data || {};
      storeStats.value.rating = s.avgRating.toFixed(2) || 0;
      storeStats.value.fans = s.fansCount || 0;
      storeStats.value.goodsCount = s.onSaleCount || 0;
      // 后端返回 0-1，小数，前端显示百分比
      storeStats.value.favorableRate = s.positiveRate ? (s.positiveRate * 100).toFixed(2) : '0.00';
    }
  } catch (e) {
    console.warn('加载店铺统计失败:', e?.response?.data || e);
  }
};

const buyNow = async () => {
  if (!canAddToCart.value) return;
  
  try {
    const checkoutItem = {
      itemId: item.value.itemId,
      skuId: selectedSku.value.skuId || selectedSku.value.id,
      productName: item.value.title,
      skuName: selectedSku.value.skuName || selectedSku.value.name,
      price: selectedSku.value.price,
      productImage: selectedSku.value.skuPic || item.value.image,
      quantity: quantity.value,
      stock: selectedSku.value.quantity
    };

    sessionStorage.setItem('checkoutItems', JSON.stringify([checkoutItem]));
    // 写入推荐优惠至会话存储，供结算页自动引导使用
    try {
      const price = Number(selectedSku.value?.price || 0);
      // 推荐优惠券：门槛满足且折扣最大
      const candidatesCp = (availableCoupons.value || []).filter(cp => !cp?.minSpend || price >= Number(cp.minSpend || 0));
      let bestCouponId = null;
      let bestCouponSave = 0;
      for (const cp of candidatesCp) {
        let save = 0;
        if (Number(cp.discountType) === 2) {
          const percent = Number(cp.discountValue || 0);
          save = price * percent / 100;
        } else {
          save = Number(cp.discountValue || 0);
        }
        if (save > bestCouponSave) {
          bestCouponSave = save;
          bestCouponId = cp.id || cp.couponId || null;
        }
      }
      // 推荐红包：门槛满足且金额最大
      const candidatesRp = (availableRedPackets.value || []).filter(rp => {
        const threshold = rp?.threshold ?? rp?.minSpend ?? 0;
        return !threshold || price >= Number(threshold || 0);
      });
      let bestRedPacketId = null;
      let bestRedPacketAmt = 0;
      for (const rp of candidatesRp) {
        const amt = Number(rp.amount || 0);
        if (amt > bestRedPacketAmt) {
          bestRedPacketAmt = amt;
          bestRedPacketId = rp.id || rp.packetId || null;
        }
      }
      const recommended = { couponId: bestCouponId, redPacketId: bestRedPacketId, ts: Date.now() };
      sessionStorage.setItem('recommendedDiscounts', JSON.stringify(recommended));
    } catch (e) {
      console.warn('写入结算推荐优惠失败:', e);
    }
    
    router.push({
      path: '/checkout',
      query: { 
        buyNow: 'true'
      }
    });
    
    ElMessage.success('正在跳转到结算页面...');
  } catch (error) {
    console.error('立即购买失败:', error);
    ElMessage.error('立即购买失败');
  }
};

const formatDate = (date) => {
  if (!date) return '未设置';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '日期无效';
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
};

const formatDisplayTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
};

const formatAmount = (n) => {
  const num = Number(n || 0);
  return num.toFixed(2);
};

const fetchComments = async () => {
  commentsLoading.value = true;
  try {
    const res = await axios.get(`/comment/item/${item.value.itemId}`, {
      params: { current: commentPage.value.pageNum, size: commentPage.value.pageSize }
    });
    const pageData = res.data.data || { records: [], total: 0, current: 1, size: commentPage.value.pageSize };
    const records = pageData.records || [];
    // 解析后端逗号分隔的图片URL到数组，供前端显示
    comments.value = records.map(r => ({
      ...r,
      images: r.imageUrls ? String(r.imageUrls).split(',').filter(Boolean) : []
    }));
    commentPage.value.total = pageData.total || 0;
    commentPage.value.pageNum = pageData.current || commentPage.value.pageNum;
  } catch (e) {
    console.error('加载评论失败：', e);
    ElMessage.error('加载评论失败');
  } finally {
    commentsLoading.value = false;
  }
};

const handleCommentPageChange = (pageNum) => {
  commentPage.value.pageNum = pageNum;
  fetchComments();
};

const submitComment = async () => {
  if (!currentUser.value) {
    ElMessage.warning('请先登录再发表评论');
    return;
  }
  if (!newComment.value.content || newComment.value.content.trim().length < 2) {
    ElMessage.warning('评论内容至少2个字符');
    return;
  }
  posting.value = true;
  try {
    await axios.post('/comment', {
      itemId: item.value.itemId,
      skuId: selectedSku.value.skuId || selectedSku.value.id || null,
      rating: newComment.value.rating,
      content: newComment.value.content.trim(),
      imageUrls: commentImages.value
    });
    ElMessage.success('评论成功');
    commentPublished.value = true; // 标记已成功发布，避免清理图片
    commentDialogVisible.value = false;
    newComment.value.content = '';
    newComment.value.rating = 5;
    commentImages.value = [];
    uploadedImageFiles.value = [];
    commentPage.value.pageNum = 1;
    await fetchComments();
  } catch (e) {
    console.error('发表评论失败：', e);
    ElMessage.error('发表评论失败');
  } finally {
    posting.value = false;
  }
};

// 上传图片（用户目录），失败则提示
const validateCommentImage = (file) => {
  const isImg = file.type?.startsWith('image/');
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isImg) ElMessage.error('只能上传图片文件');
  if (!isLt5M) ElMessage.error('图片大小不能超过5MB');
  return isImg && isLt5M;
};

const handleCommentImageUpload = async ({ file, onSuccess, onError }) => {
  if (!currentUser.value?.userId) {
    ElMessage.warning('请登录后上传图片');
    return onError?.(new Error('not_logged_in'));
  }
  if (!validateCommentImage(file)) {
    return onError?.(new Error('invalid_file'));
  }
  const fd = new FormData();
  fd.append('file', file);
  fd.append('id', currentUser.value.userId);
  if (currentUser.value.userNo) fd.append('userNo', currentUser.value.userNo);
  try {
    const res = await axios.post('/user/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    if (res.data.code === 200) {
      const url = res.data.data;
      commentImages.value.push(url);
      const parts = String(url).split('/');
      uploadedImageFiles.value.push({ url, fileName: parts.at(-1) });
      onSuccess?.(res.data);
    } else {
      ElMessage.error(`图片上传失败: ${res.data.message || '未知错误'}`);
      onError?.(new Error(res.data.message || 'upload_failed'));
    }
  } catch (e) {
    ElMessage.error('图片上传失败');
    onError?.(e);
  }
};

const deleteUserImage = async (url, fileName) => {
  if (!url || !fileName) return;
  try {
    await axios.delete('/user/image', {
      params: {
        imageUrl: url,
        fileName,
        userId: currentUser.value?.userId,
        userNo: currentUser.value?.userNo || undefined
      }
    });
  } catch (e) {
    // 静默失败，避免影响用户体验
    console.warn('删除临时图片失败', e);
  }
};

const cleanupCommentImages = async () => {
  const files = [...uploadedImageFiles.value];
  for (const f of files) {
    await deleteUserImage(f.url, f.fileName);
  }
  commentImages.value = [];
  uploadedImageFiles.value = [];
};

const onCommentDialogCancel = () => {
  commentPublished.value = false;
  commentDialogVisible.value = false;
};

const onCommentDialogClose = async () => {
  if (!commentPublished.value) {
    await cleanupCommentImages();
  }
  commentPublished.value = false;
};

// 加载店铺可领取优惠（红包/优惠券）
// 根据当前 SKU 价格筛选优惠（门槛≤当前价格）
const applyPriceFilter = () => {
  const price = Number(selectedSku.value?.price || 0);
  // 红包：展示店铺所有红包，仅通过状态控制“已领取”显示，不做过滤
  availableRedPackets.value = allRedPackets.value || [];
  // 优惠券：minSpend 门槛满足则展示
  availableCoupons.value = (allCoupons.value || []).filter(cp => {
    const minSpend = cp?.minSpend ?? 0;
    return !minSpend || price >= Number(minSpend || 0);
  });
};

// 加载店铺可领取优惠（红包/优惠券）及“我的已领”
const loadAvailableDiscounts = async () => {
  const shopId = merchant.value.merchantId || item.value.sellerId;
  if (!shopId) return;
  loadingDiscounts.value = true;
  try {
    const [rpRes, cpRes] = await Promise.all([
      axios.get('/redPacket/byMerchant', { params: { merchantId: shopId } }),
      axios.get('/coupon/available', { params: { merchantId: shopId, itemId: item.value.itemId } })
    ]);
    if (rpRes?.data?.code === 200) {
      allRedPackets.value = Array.isArray(rpRes.data.data) ? rpRes.data.data : [];
    }
    if (cpRes?.data?.code === 200) {
      allCoupons.value = Array.isArray(cpRes.data.data) ? cpRes.data.data : [];
    }
    applyPriceFilter();
    // 加载“我的已领”资产，用于标记状态
    try {
      const [myRp, myCp] = await Promise.all([
        axios.get('/redPacket/mine'),
        axios.get('/coupon/mine')
      ]);
      if (Array.isArray(myRp?.data?.data)) {
        // 以 redPacketId 为准，避免与 user_red_packet 的 id 混淆
        myRedPacketIds.value = myRp.data.data.map(x => x.redPacketId ?? x.packetId ?? x.id).filter(Boolean);
      }
      if (Array.isArray(myCp?.data?.data)) {
        myCouponIds.value = myCp.data.data.map(x => x.id ?? x.couponId).filter(Boolean);
      }
      // 资产加载后再次应用过滤，隐藏已领取红包
      applyPriceFilter();
    } catch (e) {
      // 静默失败，不影响领取展示
      console.warn('加载我的优惠资产失败:', e?.response?.data || e);
    }
  } catch (e) {
    console.warn('加载优惠失败:', e?.response?.data || e);
  } finally {
    loadingDiscounts.value = false;
  }
};

// 标记是否已领取（用于展示“已领取”标签与隐藏按钮）
const isRedPacketClaimed = (rp) => {
  const id = rp?.id ?? rp?.packetId;
  if (!id) return false;
  return myRedPacketIds.value.includes(id);
};
const isCouponClaimed = (cp) => {
  const id = cp?.id ?? cp?.couponId;
  if (!id) return false;
  return myCouponIds.value.includes(id);
};

// 领取红包
const onClaimRedPacket = async (rp) => {
  try {
    if (!currentUser.value) {
      ElMessage.warning('请先登录后领取');
      router.push('/login');
      return;
    }
    const id = rp?.id || rp?.packetId;
    if (!id) return;
    claimingRedPacketId.value = id;
  const { data } = await axios.post(`/redPacket/claim/${id}`);
  console.log('领取红包响应:', data);
  if (data?.code === 200) {
    ElMessage.success('红包领取成功');
    // 领取后加入“我的已领”，保留在列表中以展示“已领取”状态
    myRedPacketIds.value = [...new Set([...myRedPacketIds.value, id])];
  } else {
    ElMessage.error(data?.msg || '领取失败');
  }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e.message || '领取失败');
    if (e?.response?.status === 401) router.push('/login');
  } finally {
    claimingRedPacketId.value = null;
  }
};

// 领取优惠券
const onClaimCoupon = async (cp) => {
  try {
    if (!currentUser.value) {
      ElMessage.warning('请先登录后领取');
      router.push('/login');
      return;
    }
    const id = cp?.id || cp?.couponId;
    if (!id) return;
    claimingCouponId.value = id;
    const { data } = await axios.post(`/coupon/claim/${id}`);
    if (data?.code === 200) {
      ElMessage.success('优惠券领取成功');
      myCouponIds.value = [...new Set([...myCouponIds.value, id])];
      availableCoupons.value = availableCoupons.value.filter(x => (x.id || x.couponId) !== id);
    } else {
      ElMessage.error(data?.msg || '领取失败');
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e.message || '领取失败');
    if (e?.response?.status === 401) router.push('/login');
  } finally {
    claimingCouponId.value = null;
  }
};

// 生命周期
onMounted(async () => {
  const currentItemId = route.params.itemId;

  try {
    const [itemRes, skuRes] = await Promise.all([
      axios.get(`/item/${currentItemId}`),
      axios.get(`/item-sku/${currentItemId}`),
    ]);
    
    item.value = itemRes.data.data || {};
    skus.value = skuRes.data.data || [];

    const merchantRes = await axios.get(`/merchant/getMerchant/${item.value.sellerId}`)
    merchant.value = merchantRes.data.data || {};
    // 加载店铺统计信息与联系方式（优先取店铺信息的联系电话）
    storeStats.value.contact = merchant.value.contactPhone || item.value.shopContact || item.value.sellerPhone || item.value.servicePhone || '';
    await loadStoreStats();
    // 加载店铺可领取优惠资产（红包/优惠券）
    await loadAvailableDiscounts();
    
    const firstAvailableSku = skus.value.find(sku => sku.status === 1 && sku.quantity > 0);
    if (firstAvailableSku) {
      selectedSku.value = firstAvailableSku;
    } else {
      if (item.value.price) {
        selectedSku.value.price = item.value.price;
        selectedSku.value.status = item.value.status || 1;
      }
      ElMessage.warning('当前商品暂无可用库存');
    }
    loading.value = false;
    try {
      currentUser.value = JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      currentUser.value = null;
    }
    // 初始化收藏状态
    try {
      const shopId = merchant.value.merchantId || item.value.sellerId;
      if (shopId) {
        const { data } = await axios.get(`/favorite/merchant/${shopId}/exists`);
        if (data?.code === 200) {
          followed.value = !!data.data;
        }
      }
    } catch (e) {
      // 静默失败，不影响页面加载
      console.warn('获取收藏状态失败:', e?.response?.data || e);
    }
    // 记录浏览足迹
    try {
      if (currentUser.value && item.value.itemId) {
        const skuId = selectedSku.value.skuId || selectedSku.value.id || null;
        await axios.post(`/footprint/item/${item.value.itemId}`, null, { params: { skuId } });
      }
    } catch (e) {
      console.warn('记录足迹失败:', e?.response?.data || e);
    }
    await fetchComments();
  } catch (error) {
    ElMessage.error('商品数据加载失败，请稍后重试');
    console.error('数据请求错误:', error);
    loading.value = false;
  }
});

watch(activeTab, (tab) => {
  if (tab === 'comment' && item.value.itemId) {
    fetchComments();
  }
});

// 当选择不同SKU时，按价格门槛重新筛选可展示的优惠
watch(() => selectedSku.value?.price, () => {
  try { applyPriceFilter(); } catch (e) {}
});
</script>

<style scoped>
.home-container {
  width: 95%;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.product-detail-container {
  display: flex;
  gap: 40px;
  margin-bottom: 60px;
  flex-wrap: wrap;
  /* 防止两栏被拉伸为同高，避免较短一侧出现底部空白 */
  align-items: flex-start;
}

.product-image {
  flex: 1;
  min-width: 300px;
  position: sticky;
  top: 20px;
  align-self: flex-start; /* 防止被拉伸，确保sticky生效 */
  height: fit-content; /* 高度自适应内容 */
}

.store-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 12px;
  background-color: #fafafa;
}

.store-logo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.store-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.store-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.store-id {
  font-size: 12px;
  color: #999;
}

.store-badges {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.badge {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  border: 1px solid #ddd;
}

.badge.official { color: #52c41a; background-color: #f0f9eb; border-color: #b7eb8f; }
.badge.brand { color: #722ed1; background-color: #f9f0ff; border-color: #d3adf7; }
.badge.warranty { color: #13c2c2; background-color: #e6fffb; border-color: #87e8de; }
.badge.return { color: #f5222d; background-color: #fff2f0; border-color: #ffccc7; }

.store-actions { 
  margin-left: auto; 
  display: flex; 
  gap: 8px; 
}

.store-enter-btn {
  padding: 6px 12px;
  border: 1px solid #409eff;
  color: #409eff;
  background-color: #fff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.store-enter-btn:hover {
  background-color: #f0f7ff;
}

.store-follow-btn, .store-contact-btn {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  color: #555;
  background-color: #fff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.store-follow-btn:hover, .store-contact-btn:hover { 
  background-color: #fafafa; 
}

.store-stats {
  display: flex;
  gap: 16px;
  padding: 8px 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 12px;
  background-color: #fff;
}

.store-stat { 
  display: flex; 
  gap: 6px; 
  align-items: center; 
}

.stat-label { 
  color: #666; 
  font-size: 12px; 
}

.stat-value { 
  color: #333; 
  font-size: 14px; 
  font-weight: 600; 
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 主图放大镜 */
.magnify-wrap { position: relative; width: 100%; height: 100%; }
.magnify-lens { position: fixed; border: 1px solid #bbb; background: rgba(255,255,255,0.3); backdrop-filter: blur(1px); border-radius: 6px; pointer-events: none; z-index: 4000; }
.magnify-result { border: 1px solid #eee; border-radius: 8px; background-color: #fff; background-repeat: no-repeat; box-shadow: 0 4px 12px rgba(0,0,0,0.1); pointer-events: none; z-index: 3999; }
/* 移动端放大镜样式已移除，效果仅在桌面端启用 */

.no-image-placeholder {
  width: 100%;
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.product-info {
  flex: 1;
  min-width: 300px;
  position: sticky;
  top: 20px;
  align-self: flex-start; /* 防止被拉伸，确保sticky生效 */
  height: fit-content; /* 高度自适应内容 */
}

.product-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
}

.product-subtitle {
  font-size: 16px;
  color: #ff4d4f;
  margin-bottom: 30px;
  line-height: 1.5;
}

.price-container {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.price-label {
  color: #666;
  font-size: 14px;
}

.current-price {
  color: #ff4d4f;
  font-size: 28px;
  font-weight: 700;
  margin-right: 15px;
}

.original-price {
  color: #999;
  font-size: 16px;
  text-decoration: line-through;
}

.stock-container {
  display: flex;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.stock-label {
  color: #666;
  margin-right: 10px;
}

.stock-count {
  color: #333;
  margin-right: 10px;
}

.stock-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.stock-status.in-stock {
  background-color: #f0f9eb;
  color: #52c41a;
}

.stock-status.out-of-stock {
  background-color: #fff2f0;
  color: #f5222d;
}

.sku-container {
  margin-bottom: 30px;
}

.sku-label {
  display: block;
  color: #666;
  margin-bottom: 10px;
}

.sku-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sku-option {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 12px;
}

.sku-option.selected {
  border-color: #409eff;
  background-color: #e6f7ff;
  color: #409eff;
}

.sku-option.selected .sku-name,
.sku-option.selected .sku-price {
  color: #409eff;
}

.sku-option.selected .sku-thumb {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.25);
}

.sku-option.disabled {
  border-color: #eee;
  color: #ccc;
  cursor: not-allowed;
  background-color: #fafafa;
  opacity: 0.6;
  pointer-events: none;
}

.sku-option:not(.selected):not(.disabled):hover {
  border-color: #999;
  background-color: #fafafa;
}

.sku-option:focus-visible {
  outline: 2px solid rgba(64, 158, 255, 0.25);
}

.sku-thumb {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
  cursor: pointer;
}

.sku-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.sku-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.sku-stock {
  font-size: 12px;
  color: #999;
}

.sku-soldout {
  font-size: 12px;
  color: #f5222d;
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 10px;
  padding: 2px 8px;
  margin-left: auto;
}

.sku-price {
  font-size: 14px;
  font-weight: 600;
  color: #ff4d4f;
  margin-left: auto;
}

.sku-skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-row {
  height: 64px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f5f5f5 25%, #eeeeee 37%, #f5f5f5 63%);
  background-size: 400% 100%;
  animation: skeleton-loading 1.2s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

.action-container {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.quantity-selector {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.quantity-btn {
  width: 36px;
  height: 36px;
  background-color: #f5f5f5;
  border: none;
  cursor: pointer;
  font-size: 18px;
  transition: background-color 0.2s;
}

.quantity-btn:disabled {
  background-color: #eee;
  cursor: not-allowed;
  color: #999;
}

.quantity-input {
  width: 60px;
  height: 36px;
  border: none;
  text-align: center;
  outline: none;
}

.add-to-cart-btn, .buy-now-btn {
  padding: 12px 30px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.add-to-cart-btn {
  background-color: #fff;
  color: #409eff;
  border: 1px solid #409eff;
}

.add-to-cart-btn:hover:not(:disabled) {
  background-color: #f0f7ff;
}

.buy-now-btn {
  background-color: #409eff;
  color: #fff;
}

.buy-now-btn:hover:not(:disabled) {
  background-color: #1890ff;
}

.add-to-cart-btn:disabled, .buy-now-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f5f5f5 !important;
  color: #999 !important;
  border-color: #ddd !important;
}

.aftersale-container {
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.aftersale-content {
  color: #333;
  font-size: 14px;
}

.aftersale-key {
  color: #666;
  font-weight: 500;
}

.product-tabs {
  margin-top: 40px;
}

.tabs-container {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

.el-tabs__header {
  background-color: #f5f5f5;
  margin: 0;
}

.el-tabs__content {
  padding: 30px;
}

.detail-content {
  line-height: 1.8;
  color: #333;
}

.comment-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-form {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px;
  background-color: #fafafa;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.form-label {
  width: 60px;
  color: #666;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.comment-list {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px;
  background-color: #fff;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.comment-user {
  font-weight: 600;
  color: #333;
}

.comment-time {
  margin-left: auto;
  color: #999;
  font-size: 12px;
}

.comment-text {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.merchant-reply {
  margin-top: 8px;
  background: #f5f7fa;
  border-radius: 6px;
  padding: 8px;
}
.merchant-reply .reply-title {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}
.merchant-reply .reply-content {
  font-size: 14px;
  color: #333;
}
.merchant-reply .reply-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.comment-empty {
  text-align: center;
  color: #999;
  padding: 20px 0;
}

.comment-loading {
  text-align: center;
  color: #666;
  padding: 20px 0;
}

/* 评论图片预览（单行） */
.comment-upload-and-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.comment-image-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap; /* 强制单行展示 */
}
.comment-image {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #eee;
  cursor: pointer;
}
.comment-image-more {
  padding: 0 8px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border: 1px dashed #ddd;
  border-radius: 6px;
  color: #666;
  font-size: 13px;
  cursor: pointer;
}
/* 图片查看器样式 */
.viewer-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.comment-pagination {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.specification-content {
  padding: 20px 0;
}

.spec-table {
  width: 100%;
  border-collapse: collapse;
}

.spec-table tr {
  border-bottom: 1px solid #eee;
}

.spec-table td {
  padding: 12px 10px;
}

.spec-label {
  width: 120px;
  color: #666;
  background-color: #f9f9f9;
}

.aftersale-detail {
  line-height: 1.8;
}

.aftersale-info {
  margin-top: 15px;
}

.aftersale-item {
  margin-bottom: 20px;
}

.aftersale-item h4 {
  color: #333;
  margin-bottom: 5px;
}

@media (max-width: 768px) {
  .product-detail-container {
    gap: 20px;
  }
  
  .action-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .add-to-cart-btn, .buy-now-btn {
    width: 100%;
    padding: 15px 0;
  }
  
  .el-tabs__content {
    padding: 15px;
  }
}
/* 优惠券/红包展示区样式 */
.discount-container {
  margin: 12px 0 20px;
  padding: 12px;
  background-color: #fffaf0;
  border: 1px dashed #ffd591;
  border-radius: 8px;
}
.discount-label {
  font-size: 13px;
  color: #8c8c8c;
  margin-right: 8px;
}
.discount-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.discount-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  background-color: #fff;
  min-width: 220px;
}
.discount-card.redpacket {
  border-color: #ffccc7;
  background-color: #fff2f0;
}
.discount-card.coupon {
  border-color: #d9f7be;
  background-color: #f6ffed;
}
.discount-left { display: flex; flex-direction: column; gap: 4px; }
.discount-right { display: flex; align-items: center; }
.discount-amount { font-size: 14px; font-weight: 600; color: #f5222d; }
.discount-title { font-size: 13px; color: #333; }
.discount-extra { font-size: 12px; color: #8c8c8c; }
.discount-expiry { font-size: 12px; color: #8c8c8c; }

/* 缩小整体展示尺寸并靠近售价 */
.discount-container { margin-top: 6px; }
.discount-card { padding: 6px 8px; }
.discount-label { font-size: 12px; color: #666; }
.claimed-badge { font-size: 11px; }
</style>