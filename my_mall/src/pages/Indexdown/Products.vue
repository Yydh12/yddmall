<template>
  <div class="products-container">
    <div class="product-grid">
      <router-link 
        class="product-item" 
        v-for="product in products" 
        :key="product.itemId"  
        :to="'/productInfo/' + product.itemId" 
      >
        <img 
          :src="getProductImage(product)" 
          :alt="product.title"
          class="product-image" 
          @error="handleImageError"
        />
        <div class="product-name">{{ product.title }}</div>
        <div class="product-info">
          <div class="product-price">
            <span class="price">¥{{ product.price.toFixed(2) }}</span>
          </div>
          <div class="product-subtitle" v-if="product.subTitle">{{ product.subTitle }}</div>
        </div>
      </router-link>
    </div>
    <div v-if="isLoading" class="loading-indicator">加载中...</div>
    <div v-if="!hasMore && products.length > 0" class="no-more-products">没有更多商品了</div>
    <div v-if="!isLoading && products.length === 0" class="no-products">暂无商品</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from '../../axios';
import avatarUrl from '@/assets/images/avatar.png';

const products = ref([]);
const currentPage = ref(1);
const pageSize = 36; // 每页加载36个商品
const hasMore = ref(true);
const isLoading = ref(false);
const total = ref(0);
const route = useRoute();

// 用于缓存店铺状态，避免重复查询
const merchantStatuses = ref({});

// 获取当前路由的搜索关键词
const getSearchKeyword = () => {
  const q = route.query.q;
  return typeof q === 'string' ? q.trim() : '';
};

// 获取分类cid（用于按分类筛选商品）
const getCategoryCid = () => {
  const raw = route.query.cid;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
};

// 获取商品图片
const getProductImage = (product) => {
  if (product.picUrl) {
    // 如果有多张图片，取第一张
    const images = product.picUrl.split(',');
    return images[0];
  }
  if (product.skuPic) {
    return product.skuPic;
  }
  return avatarUrl;
};

// 处理图片加载错误
const handleImageError = (e) => {
  e.target.src = avatarUrl;
};

// ---------- 分类聚合搜索：根据关键词匹配分类并拉取上下层级商品 ----------
const didCategoryAugment = ref(false);
const categoryIndexLoaded = ref(false);
const categoryByCid = ref(new Map());
const childrenByCid = ref(new Map());
const parentByCid = ref(new Map());

const loadCategoryIndex = async () => {
  if (categoryIndexLoaded.value) return;
  try {
    const { data } = await axios.get('/item-category');
    if (data?.code === 200 && Array.isArray(data.data)) {
      const list = data.data;
      const byCid = new Map();
      const children = new Map();
      const parent = new Map();
      for (const n of list) {
        byCid.set(n.cid, n);
        parent.set(n.cid, n.parentCid);
        if (!children.has(n.parentCid)) children.set(n.parentCid, []);
        children.get(n.parentCid).push(n);
      }
      categoryByCid.value = byCid;
      childrenByCid.value = children;
      parentByCid.value = parent;
      categoryIndexLoaded.value = true;
    }
  } catch (e) {
    // 静默失败，不影响正常搜索
    console.warn('加载分类索引失败:', e);
  }
};

const normalize = (s) => (s || '').toLowerCase().trim();
const getTokens = (s) => {
  const raw = normalize(s);
  if (!raw) return [];
  // 分词：按常见分隔符拆分，包含中文/英文分隔符
  return raw.split(/[\s/\\>\-_,·、，]+/).filter(Boolean);
};
const findBestCategoryByName = (name) => {
  if (!categoryIndexLoaded.value) return null;
  const qn = normalize(name);
  if (!qn) return null;

  // 若关键词中包含纯数字，尝试按cid直接命中
  const numTokens = (qn.match(/\d+/g) || []).map(Number).filter(n => Number.isFinite(n));
  for (const t of numTokens) {
    const direct = categoryByCid.value.get(t);
    if (direct) return direct;
  }

  // 精确匹配
  for (const n of categoryByCid.value.values()) {
    if (normalize(n.name) === qn) return n;
  }

  // 模糊匹配：整词包含优先
  let candidate = null;
  const tokens = getTokens(name);
  const scoreOf = (node) => {
    const nn = normalize(node.name);
    let score = 0;
    for (const tk of tokens) {
      if (!tk) continue;
      if (nn.includes(tk)) score += 2; // 词命中加权
      if (nn.startsWith(tk)) score += 1; // 前缀轻权
    }
    const leaf = node.isLeaf === 1 || node.isLeaf === true;
    if (leaf) score += 1;
    // 长名称轻权
    score += Math.min(nn.length, 20) / 20;
    return score;
  };
  for (const n of categoryByCid.value.values()) {
    const nn = normalize(n.name);
    if (nn.includes(qn) || tokens.some(tk => tk && nn.includes(tk))) {
      if (!candidate) candidate = n;
      else {
        const cScore = scoreOf(candidate);
        const nScore = scoreOf(n);
        if (nScore > cScore) candidate = n;
      }
    }
  }
  return candidate;
};

const collectDescendantLeafCids = (cid) => {
  const res = new Set();
  const stack = [cid];
  while (stack.length) {
    const cur = stack.pop();
    const node = categoryByCid.value.get(cur);
    if (!node) continue;
    const isLeaf = node.isLeaf === 1 || node.isLeaf === true;
    const children = childrenByCid.value.get(cur) || [];
    if (isLeaf || children.length === 0) {
      res.add(node.cid);
    } else {
      for (const ch of children) stack.push(ch.cid);
    }
  }
  return res;
};

// 收集父链各层的所有叶子（用于“上层级”的聚合）
const collectAncestorsDescendantLeaves = (cid) => {
  const res = new Set();
  let cur = parentByCid.value.get(cid);
  const seen = new Set();
  let depth = 0;
  // 最多向上追溯3层，防止过度聚合
  while (cur && cur !== 0 && depth < 3) {
    if (seen.has(cur)) break;
    seen.add(cur);
    const set = collectDescendantLeafCids(cur);
    for (const x of set) res.add(x);
    cur = parentByCid.value.get(cur);
    depth++;
  }
  return res;
};

const ensureMerchantStatusesForItems = async (items) => {
  const sellerIds = [...new Set(items.map(p => p.sellerId))];
  const merchantsToFetch = sellerIds.filter(id => merchantStatuses.value[id] === undefined);
  if (merchantsToFetch.length > 0) {
    const merchantStatusPromises = merchantsToFetch.map(id =>
      axios.get(`/merchant/getMerchant/${id}`).then(res => {
        if (res.data.code === 200 && res.data.data) {
          merchantStatuses.value[id] = res.data.data.status;
        } else {
          merchantStatuses.value[id] = -1;
        }
      }).catch(() => {
        merchantStatuses.value[id] = -1;
      })
    );
    await Promise.all(merchantStatusPromises);
  }
};

const mergeDedupProducts = (listA, listB) => {
  const map = new Map();
  for (const p of listA) map.set(p.itemId, p);
  for (const p of listB) if (!map.has(p.itemId)) map.set(p.itemId, p);
  return Array.from(map.values());
};

// ---------- 首页随机排序（Fisher-Yates 洗牌） ----------
const shuffleProducts = () => {
  const arr = [...products.value];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  products.value = arr;
};

// ---------- 关键词模糊搜索（仅取第一页用于融合） ----------
const fetchKeywordFirstPage = async (keyword, markAugmented) => {
  if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) return;
  try {
    const { data } = await axios.get('/item', { params: { current: 1, size: pageSize, status: 1, title: keyword } });
    if (data?.code === 200) {
      const recs = data?.data?.records || [];
      if (Array.isArray(recs) && recs.length > 0) {
        await ensureMerchantStatusesForItems(recs);
        const filtered = recs.filter(p => merchantStatuses.value[p.sellerId] === 1);
        for (const it of filtered) it._augmented = !!markAugmented;
        products.value = mergeDedupProducts(products.value, filtered);
      }
    }
  } catch (e) {
    console.warn('关键词模糊搜索融合失败:', e);
  }
};

// ---------- 批量按 cidList 查询（后端支持则走一趟，否则回退逐个 cid） ----------
const tryBatchFetchItemsByCids = async (cidList) => {
  try {
    const { data } = await axios.get('/item', { params: { current: 1, size: pageSize, status: 1, cidList: cidList.join(',') } });
    if (data?.code === 200) {
      const recs = data?.data?.records || [];
      return Array.isArray(recs) && recs.length > 0 ? recs : [];
    }
  } catch (e) {
    // ignore
  }
  return [];
};

// ---------- 排序策略 ----------
const getSortOption = () => {
  const s = route.query.sort;
  const v = typeof s === 'string' ? s.trim() : '';
  return v || 'relevance'; // 默认相关度优先（关键词命中在前、分类聚合在后）
};

const applySorting = (keyword) => {
  const opt = getSortOption();
  if (opt === 'relevance') {
    // 分组稳定排序：非聚合源在前（首批关键词结果），聚合源在后
    const primary = products.value.filter(p => !p._augmented);
    const secondary = products.value.filter(p => p._augmented);
    products.value = [...primary, ...secondary];
    return;
  }
  if (opt === 'price_asc' || opt === 'price_desc') {
    const asc = opt === 'price_asc';
    products.value = [...products.value].sort((a, b) => {
      const pa = Number(a.price || 0);
      const pb = Number(b.price || 0);
      return asc ? (pa - pb) : (pb - pa);
    });
    return;
  }
  // 其他未识别策略，保持当前顺序
};

const augmentProductsByCategoryHierarchy = async (keyword) => {
  if (didCategoryAugment.value) return;
  await loadCategoryIndex();
  const node = findBestCategoryByName(keyword);
  if (!node) return;
  // 聚合当前分类 + 下层级叶子 + 上层级各层叶子
  const cidSet = new Set();
  const isLeaf = node.isLeaf === 1 || node.isLeaf === true;
  if (isLeaf) cidSet.add(node.cid);
  const desc = collectDescendantLeafCids(node.cid);
  const ancDesc = collectAncestorsDescendantLeaves(node.cid);
  for (const x of desc) cidSet.add(x);
  for (const x of ancDesc) cidSet.add(x);
  // 限制最大数量，避免过多请求
  const cidList = Array.from(cidSet).slice(0, 30);
  if (cidList.length === 0) return;
  try {
    // 优先尝试批量查询
    let agg = await tryBatchFetchItemsByCids(cidList);
    if (!agg || agg.length === 0) {
      // 回退：并行拉取每个 cid 的第一页商品
      const promises = cidList.map(c => axios.get('/item', { params: { current: 1, size: pageSize, status: 1, cid: c } }));
      const results = await Promise.allSettled(promises);
      agg = [];
      for (const r of results) {
        if (r.status === 'fulfilled') {
          const recs = r.value?.data?.data?.records || [];
          agg.push(...recs);
        }
      }
    }
    if (agg.length > 0) {
      await ensureMerchantStatusesForItems(agg);
      const filteredAgg = agg.filter(p => merchantStatuses.value[p.sellerId] === 1);
      // 标记为聚合源，用于“相关度优先”排序
      for (const it of filteredAgg) it._augmented = true;
      products.value = mergeDedupProducts(products.value, filteredAgg);
      didCategoryAugment.value = true;
      applySorting(keyword);
    }
  } catch (e) {
    console.warn('分类聚合搜索失败:', e);
  }
};

const fetchProducts = async () => {
  if (isLoading.value || !hasMore.value) return;
  isLoading.value = true;
  try {
    const cid = getCategoryCid();
    const kw = getSearchKeyword();
    const params = {
      // 后端分页参数使用 current/size（与 MyBatis-Plus Page 保持一致）
      current: currentPage.value,
      size: pageSize,
      status: 1
    };
    if (cid) {
      params.cid = cid;
    } else {
      params.title = getSearchKeyword();
    }
    const { data } = await axios.get('/item', { params });
    if (data.code === 200) {
      const newProducts = data.data.records || [];
      if (newProducts.length === 0) {
        hasMore.value = false;
        // 即使关键词没有命中，也尝试分类聚合
        const kw = getSearchKeyword();
        if (!cid && kw) {
          await augmentProductsByCategoryHierarchy(kw);
          applySorting(kw);
        }
        // 不再直接返回，允许展示聚合结果
      }
      console.log('newProducts:', newProducts);

      // 提取所有唯一的 sellerId
      const sellerIds = [...new Set(newProducts.map(p => p.sellerId))];
      const merchantsToFetch = sellerIds.filter(id => merchantStatuses.value[id] === undefined);

      if (merchantsToFetch.length > 0) {
        // 批量获取商家状态
        const merchantStatusPromises = merchantsToFetch.map(id =>
          axios.get(`/merchant/getMerchant/${id}`).then(res => {
            if (res.data.code === 200 && res.data.data) {
              merchantStatuses.value[id] = res.data.data.status;
            } else {
              merchantStatuses.value[id] = -1; // 标记为无效状态
            }
          }).catch(() => {
            merchantStatuses.value[id] = -1; // 标记为无效状态
          })
        );
        await Promise.all(merchantStatusPromises);
      }

      // 过滤商品，只显示状态为1的商家商品
      const filteredProducts = newProducts.filter(p => merchantStatuses.value[p.sellerId] === 1);

      // 标记来源：有 cid 视为分类主源（聚合源，为了让关键词排前），否则为关键词主源
      for (const it of filteredProducts) it._augmented = !!cid;
      products.value = [...products.value, ...filteredProducts];
      total.value = data.data.total;

      // 使用后端返回的 pages/size 判断是否还有下一页，避免因过滤或后端默认分页导致误判
      const serverPages = Number(data.data?.pages ?? 0);
      const serverSize = Number(data.data?.size ?? pageSize);
      if (serverPages > 0) {
        hasMore.value = currentPage.value < serverPages;
      } else {
        // 回退策略：当没有 pages 字段时，依据当页返回数量与服务端 size 判断
        hasMore.value = newProducts.length === serverSize;
      }
      if (hasMore.value) {
        currentPage.value++;
      }
      // 首页（无关键词、无分类）随机排序：每次追加后打散顺序
      if (!cid && !kw) {
        shuffleProducts();
      }
      // 若本次为按关键字搜索（无 cid），则继续尝试按分类聚合上下层级商品
      if (!cid) {
        const kw = getSearchKeyword();
        if (kw) {
          // 在同一次加载过程内继续进行分类聚合，不改变分页状态
          await augmentProductsByCategoryHierarchy(kw);
        }
      }
      // 若存在分类锚点，同时融合关键词第一页结果作为主源（不标记聚合），确保关键词排前
      if (cid && kw) {
        await fetchKeywordFirstPage(kw, /*markAugmented*/ false);
      }
      // 应用排序策略（例如价格排序），在任何一次追加后都整理顺序
      applySorting(kw);
    } else {
      hasMore.value = false;
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    hasMore.value = false;
  } finally {
    isLoading.value = false;
  }
};

const handleScroll = () => {
  const { scrollTop, clientHeight, scrollHeight } = document.documentElement || document.body;
  if (scrollTop + clientHeight >= scrollHeight - 100 && hasMore.value && !isLoading.value) {
    fetchProducts();
  }
};

onMounted(() => {
  fetchProducts();
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

// 当路由查询关键词变化时重置列表并重新加载
watch(
  () => [route.query.q, route.query.cid],
  () => {
    // 重置分页与数据
    products.value = [];
    currentPage.value = 1;
    total.value = 0;
    hasMore.value = true;
    merchantStatuses.value = {}; // 清空缓存的商家状态
    didCategoryAugment.value = false; // 重置分类聚合标记
    // 重新加载
    fetchProducts();
    // 回到顶部，避免旧滚动位置导致误触发
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  }
);
</script>

<style scoped>
.products-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 20px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.product-item {
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-radius: 8px;
  background-color: #fff;
  transition: all 0.3s ease;
  text-decoration: none;
  color: inherit;
}

.product-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 12px;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  line-clamp: 2; 
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

.product-info {
  margin-top: auto;
}

.product-price {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.price {
  color: #ff4d4f;
  font-size: 16px;
  font-weight: bold;
}

.product-subtitle {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loading-indicator,
.no-more-products,
.no-products {
  width: 100%;
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

@media (max-width: 1400px) {
  .product-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (max-width: 1200px) {
  .product-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 992px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
