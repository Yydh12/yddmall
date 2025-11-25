<template>
  <div class="sku-manage">
    <!-- 标题区域 -->
    <div class="page-header">
      <h2>商品管理</h2>
      <p>点击商品行查看对应的SKU信息</p>
    </div>

    <!-- 搜索区域 -->
    <div class="search-bar">
      <el-input 
        v-model="search.itemName" 
        placeholder="商品名称" 
        style="width: 200px; margin-right: 10px;"
        clearable
      />
      <el-input 
        v-model="search.itemId" 
        placeholder="商品ID" 
        type="number"
        style="width: 200px; margin-right: 10px;"
        clearable
      />
      <el-select 
        v-model="search.skuStatus" 
        placeholder="SKU状态" 
        style="width: 150px; margin-right: 10px;"
        clearable
      >
        <el-option label="正常" value="1" />
        <el-option label="停售" value="2" />
      </el-select>
      <el-button type="primary" @click="loadItems" icon="Search">搜索</el-button>
      <el-button @click="resetSearch" icon="RefreshRight">重置</el-button>
    </div>

    <!-- 商品与SKU列表 -->
    <div class="main-card">
      <!-- 商品表头 -->
      <div class="table-head">
        <div class="cell w120">商品编号</div>
        <div class="cell flex1 min200">商品标题</div>
        <div class="cell w150">导购标题</div>
        <div class="cell w120">品牌</div>
        <div class="cell w120">
          <el-tooltip content="商品在商城的发布状态" placement="top">
            <span>发布状态</span>
          </el-tooltip>
        </div>
        <div class="cell w180">操作</div>
      </div>

      <!-- 商品列表 -->
      <div class="item-list">
        <template v-for="item in items" :key="item.itemId">
          <!-- 商品行 -->
          <div class="item-row" :class="{ 'expanded': item.showSku }" @click="toggleSku(item)">
            <div class="cell w120">#{{ item.itemNo || item.itemId }}</div>
            <div class="cell flex1 min200 title-cell">
              <el-tooltip :content="item.title" placement="top" :show-after="500">
                <span class="item-title">{{ item.title }}</span>
              </el-tooltip>
            </div>
            <div class="cell w150">
              <el-tooltip :content="item.subtitle || '暂无导购标题'" placement="top" :show-after="500">
                <span class="subtitle">{{ item.subtitle || '-' }}</span>
              </el-tooltip>
            </div>
            <div class="cell w120">
              <el-tag size="small" effect="plain" class="brand-tag">
                {{ item.brand || '无' }}
              </el-tag>
            </div>
            <div class="cell w120">
              <el-tag 
                :type="item.status === 1 ? 'success' : 'info'" 
                effect="light"
                size="small"
                class="status-tag"
              >
                {{ item.status === 1 ? '已发布' : '未发布' }}
              </el-tag>
            </div>
            <div class="cell w180 actions">
              <el-button 
                size="small" 
                link
                :icon="item.showSku ? 'ArrowUp' : 'ArrowDown'"
                class="toggle-btn"
              >
                {{ item.showSku ? '收起' : '查看' }}
              </el-button>
              <el-button 
                size="small" 
                type="primary" 
                @click.stop="editItem(item)"
                icon="Edit"
                class="edit-btn"
              >
                编辑商品
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click.stop="delItem(item)"
                :loading="item.delLoading" 
                icon="Delete"
                class="delete-btn"
              >
                删除商品
              </el-button>
            </div>
          </div>

          <!-- SKU列表 -->
          <transition name="slide">
            <div class="sku-list" v-if="item.showSku">
              <div class="sku-table">
                <!-- SKU表头 -->
                <div class="sku-head">
                  <div class="sku-cell w120">SKU ID</div>
                  <div class="sku-cell w120">SKU图片</div>
                  <div class="sku-cell flex1 min180">SKU名称</div>
                  <div class="sku-cell w120">售价</div>
                  <div class="sku-cell w100">库存</div>
                  <div class="sku-cell w100">状态</div>
                  <div class="sku-cell w280">操作</div>
                </div>

                <!-- SKU内容 -->
                <div v-if="item.skuLoading" class="loading" v-loading="true" element-loading-text="加载中...">
                  <div style="height: 100px;"></div>
                </div>
                <div v-else-if="item.skus.length">
                  <div class="sku-row" v-for="sku in item.skus" :key="sku.skuId">
                    <div class="sku-cell w120">{{ sku.skuId }}</div>
                    <div class="sku-cell w120">
                      <el-image 
                        :src="sku.skuPic" 
                        fit="cover" 
                        width="50" 
                        height="50"
                        v-if="sku.skuPic"
                        :preview-src-list="[sku.skuPic]"
                      />
                      <span v-else>无图</span>
                    </div>
                    <div class="sku-cell flex1 min180">{{ sku.skuName }}</div>
                    <div class="sku-cell w120">{{ (sku.price || 0).toFixed(2) }}</div>
                    <div class="sku-cell w100">{{ sku.quantity }}</div>
                    <div class="sku-cell w100">
                      <el-tag :type="sku.status === 1 ? 'success' : 'warning'" effect="light">
                        {{ sku.status === 1 ? '上架' : '下架' }}
                      </el-tag>
                    </div>
                    <div class="sku-cell w280">
                      <el-button size="small" type="primary" @click.stop="editSku(sku)" icon="Edit">编辑</el-button>
                      <el-button 
                        size="small" 
                        :type="sku.status === 1 ? 'warning' : 'success'"
                        @click.stop="changeStatus(sku)"
                        :icon="sku.status === 1 ? 'SwitchButton' : 'Check'"
                      >
                        {{ sku.status === 1 ? '下架' : '上架' }}
                      </el-button>
                      <el-button 
                        size="small" 
                        type="danger" 
                        @click.stop="delSku(sku, item)"
                        :disabled="sku.status === 1"
                        icon="Delete"
                      >
                        删除
                      </el-button>
                    </div>
                  </div>
                </div>
                <div v-else class="empty"><el-empty description="暂无SKU数据" /></div>

                <!-- SKU分页 -->
                <div class="sku-page" v-if="item.skus.length">
                  <el-pagination
                    v-model:current-page="item.skuPage.current"
                    v-model:page-size="item.skuPage.size"
                    :page-sizes="[5, 10, 20]"
                    :total="item.skuPage.total"
                    layout="total, sizes, prev, pager, next"
                    @size-change="(s) => changeSkuPage(s, item, 'size')"
                    @current-change="(p) => changeSkuPage(p, item, 'page')"
                  />
                </div>
              </div>
            </div>
          </transition>
        </template>
      </div>

      <!-- 商品分页 -->
      <div class="page-nav">
        <el-pagination
          v-model:current-page="itemPage.current"
          v-model:page-size="itemPage.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="itemPage.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="(s) => changeItemPage(s, 'size')"
          @current-change="(p) => changeItemPage(p, 'page')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from '../../axios';

const router = useRouter();

// 搜索条件数据结构
const search = ref({
  itemId: '',      // 商品ID
  itemName: '',    // 商品标题 -> 对应后端的title字段
  skuStatus: '',   // 商品状态 -> 对应后端的status字段
  brand: '',       // 品牌 -> 对应后端的brand字段
  subTitle: ''     // 副标题 -> 对应后端的subTitle字段
});

// 商品数据
const items = ref([]);
const itemLoading = ref(false);
// 分页数据结构
const itemPage = ref({
  current: 1,
  size: 10,
  total: 0
});
const activeItem = ref(null); // 当前展开的商品

// 加载商品列表
const loadItems = async () => {
  try {
    itemLoading.value = true;
    const params = {
      // 对齐后端 MyBatis-Plus 分页参数
      current: itemPage.value.current,
      size: itemPage.value.size,
      // 根据后端接口调整搜索参数
      ...(search.value.itemId && { itemId: Number(search.value.itemId) }),
      ...(search.value.itemName && { title: search.value.itemName }),
      ...(search.value.skuStatus && { status: Number(search.value.skuStatus) }),
      // 添加其他可能的搜索条件
      ...(search.value.brand && { brand: search.value.brand }),
      ...(search.value.subTitle && { subTitle: search.value.subTitle })
    };

    // 移除空参数
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    const { data } = await axios.get('/item/merchant', { params });
    if (data.code === 200) {
      items.value = data.data.records.map(item => ({
        ...item,
        showSku: false,       // 是否显示SKU
        skus: [],             // SKU列表
        skuLoading: false,    // SKU加载状态
        skuPage: { current: 1, size: 10, total: 0 }, // SKU分页
        delLoading: false     // 商品删除加载状态
      }));
      itemPage.value.total = data.data.total;
      activeItem.value = null;
    } else {
      ElMessage.error(data.msg || '获取商品失败');
    }
  } catch (err) {
    console.error('加载商品失败:', err);
    ElMessage.error('加载商品失败，请重试');
  } finally {
    itemLoading.value = false;
  }
};

// 重置搜索
const resetSearch = () => {
  // 重置所有搜索项，避免隐藏字段残留影响查询
  search.value = { itemId: '', itemName: '', skuStatus: '', brand: '', subTitle: '' };
  itemPage.value.current = 1;
  itemPage.value.size = 10;
  loadItems();
};

// 商品分页变化
const changeItemPage = (val, type) => {
  if (type === 'page') {
    itemPage.value.current = val;
  } else {
    itemPage.value.size = val;
    itemPage.value.current = 1; // 切换每页显示数量时重置到第一页
  }
  loadItems();
};

// SKU分页变化
const changeSkuPage = (val, item, type) => {
  item.skuPage[type === 'page' ? 'current' : 'size'] = val;
  loadSkus(item);
};

// 加载SKU列表
const loadSkus = async (item) => {
  try {
    item.skuLoading = true;
    const params = {
      itemId: item.itemId,
      current: item.skuPage.current,
      size: item.skuPage.size
    };
    const { data } = await axios.get('/item-sku', { params });
    if (data.code === 200) {
      const records = data.data?.records || [];
      item.skus = records;
      item.skuPage.total = data.data?.total ?? records.length;
      item.skuCount = item.skuPage.total;
    } else {
      ElMessage.error(data.msg || '获取SKU失败');
    }
  } catch (err) {
    console.error('加载SKU失败:', err);
    ElMessage.error('加载SKU失败，请重试');
  } finally {
    item.skuLoading = false;
  }
};

// 切换SKU显示
const toggleSku = (item) => {
  // 关闭其他商品的SKU
  if (activeItem.value && activeItem.value !== item) {
    activeItem.value.showSku = false;
  }
  // 切换当前商品的SKU显示状态
  item.showSku = !item.showSku;
  activeItem.value = item.showSku ? item : null;
  // 加载SKU数据（首次展开时）
  if (item.showSku && !item.skus.length) loadSkus(item);
};

// 编辑SKU
const editSku = (sku) => {
  router.push(`/store/releaseProduct/${sku.itemId}`);
};

// 编辑商品
const editItem = (item) => {
  router.push(`/store/releaseProduct/${item.itemId}`);
};

// 变更SKU状态（上下架）
const changeStatus = async (sku) => {
  try {
    const newStatus = sku.status === 1 ? 2 : 1;
    const { data } = await axios.put(`/item-sku/status/${sku.skuId}/${newStatus}`);
    if (data.code === 200) {
      ElMessage.success(`已${newStatus === 1 ? '上架' : '下架'}`);
      sku.status = newStatus;
    } else ElMessage.error(data.msg || '操作失败');
  } catch (err) {
    console.error('状态变更失败:', err);
    ElMessage.error('操作失败，请重试');
  }
};

// 删除SKU
const delSku = async (sku, item) => {
  try {
    await ElMessageBox.confirm('确定删除该SKU？', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    const { data } = await axios.delete(`/item-sku/sku/${sku.skuId}`);
    if (data.code === 200) {
      ElMessage.success('删除成功');
      loadSkus(item);
      item.skuCount = Math.max(0, item.skuCount - 1);
    } else ElMessage.error(data.msg || '删除失败');
  } catch (err) {
    if (err.name !== 'Error') {
      console.error('删除SKU失败:', err);
      ElMessage.error('删除失败，请重试');
    } else ElMessage.info('已取消删除');
  }
};

// 删除商品（含SKU）
const delItem = async (item) => {
  try {
    await ElMessageBox.confirm(
      '删除商品会同步删除所有SKU，且不可恢复，确定删除？', 
      '危险操作', 
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'error', danger: true }
    );
    item.delLoading = true;

    // 1. 删除所有关联SKU
    const { data: skuRes } = await axios.get('/item-sku', {
      params: { itemId: item.itemId, current: 1, size: 9999 }
    });
    if (skuRes.code === 200 && skuRes.data.records.length) {
      await Promise.all(skuRes.data.records.map(sku => axios.delete(`/item-sku/sku/${sku.skuId}`)));
    }

    // 2. 删除商品
    const { data: itemRes } = await axios.delete(`/item/${item.itemId}`);
    if (itemRes) {
      ElMessage.success('商品及SKU删除成功');
      loadItems();
    } else {
      ElMessage.error(itemRes.msg || '删除商品失败');
      item.delLoading = false;
    }
  } catch (err) {
    if (err.name !== 'Error') {
      console.error('删除商品失败:', err);
      ElMessage.error('操作失败，请重试');
      item.delLoading = false;
    } else ElMessage.info('已取消删除');
  }
};

// 初始化加载
onMounted(() => loadItems());
</script>

<style scoped>
/* 基础样式 */
.sku-manage {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

/* 标题样式 */
.page-header { 
  margin-bottom: 20px;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.page-header h2 { 
  margin: 0 0 10px; 
  font-size: 24px; 
  font-weight: 600; 
  color: #1d2129;
  display: flex;
  align-items: center;
}
.page-header h2::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 24px;
  background: #409eff;
  margin-right: 12px;
  border-radius: 2px;
}
.page-header p { 
  margin: 0; 
  font-size: 14px; 
  color: #86909c;
  padding-left: 16px;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 20px;
  margin-bottom: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 主内容区 */
.main-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* 表格通用样式 */
.table-head, .item-row {
  display: flex;
  padding: 16px;
  align-items: center;
  font-size: 14px;
}
.table-head {
  background: #f7f8fa;
  border-bottom: 1px solid #f0f2f5;
  font-weight: 500;
  color: #4e5969;
}
.item-row {
  border-bottom: 1px solid #f0f2f5;
  color: #1d2129;
  cursor: pointer;
  transition: all 0.3s ease;
}
.item-row:hover { 
  background: #f7f8fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.item-row.expanded {
  background: #f7f8fa;
}
.item-row:last-child { border-bottom: none; }

/* 单元格样式 */
.cell {
  padding: 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.w120 { width: 120px; }
.w150 { width: 150px; }
.w180 { width: 180px; }
.w280 { width: 280px; }
.flex1 { flex: 1; }
.min200 { min-width: 200px; }
.min180 { min-width: 180px; }

/* 商品ID样式 */
.cell.w120:first-child {
  color: #409eff;
  font-family: Monaco, monospace;
  font-weight: 500;
}

/* 标题单元格样式 */
.title-cell .item-title {
  font-weight: 500;
  color: #1d2129;
}

/* 导购标题样式 */
.subtitle {
  color: #606266;
  font-size: 13px;
}

/* 品牌标签样式 */
.brand-tag {
  font-size: 12px !important;
  padding: 0 8px !important;
}

/* 状态标签样式 */
.status-tag {
  padding: 0 8px !important;
  height: 24px !important;
  line-height: 22px !important;
  border-radius: 4px !important;
}

/* 按钮组样式 */
.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.actions .el-button {
  padding: 6px 12px !important;
  font-size: 13px !important;
}
.toggle-btn {
  min-width: 70px;
}
.edit-btn, .delete-btn {
  min-width: 90px;
}

/* SKU列表样式 */
.sku-list {
  background: #fafbfc;
  border-top: 1px dashed #e5e6eb;
  padding: 20px;
}
.sku-table { 
  width: 100%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.sku-head {
  display: flex;
  padding: 12px 16px;
  background: #f2f3f5;
  font-size: 13px;
  font-weight: 500;
  color: #606266;
}
.sku-row {
  display: flex;
  padding: 12px 16px;
  align-items: center;
  font-size: 13px;
  color: #303133;
  border-bottom: 1px solid #f0f2f5;
  transition: all 0.2s;
}
.sku-row:hover {
  background: #f7f8fa;
}
.sku-row:last-child {
  border-bottom: none;
}
.sku-cell {
  padding: 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 动画效果 */
.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease-in-out;
  overflow: hidden;
}
.slide-enter-from { 
  max-height: 0; 
  opacity: 0;
  transform: translateY(-10px);
}
.slide-enter-to { 
  max-height: 1000px; 
  opacity: 1;
  transform: translateY(0);
}
.slide-leave-from { 
  max-height: 1000px; 
  opacity: 1;
  transform: translateY(0);
}
.slide-leave-to { 
  max-height: 0; 
  opacity: 0;
  transform: translateY(-10px);
}

/* 空状态和加载 */
.empty, .loading {
  padding: 60px 0;
  text-align: center;
  color: #909399;
  background: #fff;
  border-radius: 8px;
}

/* 分页样式 */
.page-nav, .sku-page {
  padding: 16px;
  text-align: right;
  background: #fff;
}
.page-nav { 
  border-top: 1px solid #f0f2f5;
}
.sku-page { 
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid #f0f2f5;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-button--small) { 
  padding: 6px 12px;
  font-size: 13px;
  border-radius: 4px;
}
:deep(.el-button--text), :deep(.el-button.is-link) { 
  color: #409eff;
  padding: 6px 8px;
}
:deep(.el-button--text:hover), :deep(.el-button.is-link:hover) { 
  color: #66b1ff;
  background: rgba(64, 158, 255, 0.04);
}
:deep(.el-button--danger.el-button--small:hover) {
  background: #f56c6c;
  color: #fff;
}
:deep(.el-tag--small) {
  height: 24px;
  padding: 0 8px;
  font-size: 12px;
}
:deep(.el-image) {
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #f0f2f5;
}
:deep(.el-pagination) {
  justify-content: flex-end;
}
</style>