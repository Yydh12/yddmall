<template>
<div class="release-product">
  <!-- 1. 锚点导航 -->
  <nav class="anchor-nav">
    <a v-for="n in navList" :key="n.id"
       :class="{active:activeSectionId===n.id}"
       @click="scrollToSection(n.id)">{{ n.name }}</a>
  </nav>

  <!-- 2. 基础信息 -->
  <section id="basic-info" class="content-section">
    <h2>基础信息</h2>
    <div class="form-container">
      <div class="form-item">
        <label class="form-label">当前类目：</label>
        <el-cascader v-model="selectedCategory" :options="categoryOptions" placeholder="请选择商品分类"
                     clearable :props="cascaderProps" class="form-input" style="width:800px"
                     @change="handleCategoryChange"/>
      </div>
      <div class="form-item">
        <label class="form-label">商品标题：</label>
        <div class="input-with-count">
          <input v-model="itemSpu.title" maxlength="60" placeholder="请输入商品标题" required
                 :class="inputLimitClass(titleLen,60)" @input="setHasChanged">
          <span class="char-count">{{ titleLen }}/60</span>
        </div>
      </div>
      <div class="form-item">
        <label class="form-label">导购标题：</label>
        <div class="input-wrapper">
          <p class="title-recommendation">标题结构：品牌+材质+适用场景+品类+利益点</p>
          <div class="input-with-count">
            <input v-model="itemSpu.subTitle" maxlength="30" placeholder="请输入导购标题"
                   :class="inputLimitClass(subTitleLen,30)" @input="setHasChanged">
            <span class="char-count">{{ subTitleLen }}/30</span>
          </div>
        </div>
      </div>
      <div class="form-item">
        <label class="form-label">品牌：</label>
        <el-input v-model="itemSpu.brand" placeholder="请输入品牌名称" clearable style="width:300px"
                  @input="setHasChanged"/>
      </div>
    </div>
  </section>

  <!-- 3. 销售信息 -->
  <section id="sales-info" class="content-section">
    <h2>销售信息</h2>
    <div class="form-container">
      <div class="form-item">
        <label class="form-label">销售属性：</label>
        <div class="input-wrapper">
          <p class="title-recommendation">SKU上限114个，属性上限4个</p>
          <div class="color-category-wrapper">
            <h6>分类（{{ itemSku.length }}）</h6>
            <div class="color-categories-grid">
              <div v-for="(sku,idx) in itemSku" :key="idx" class="color-input-group">
                <!-- SKU 图片 -->
                <div @click="triggerFileInput(idx)">
                  <img v-if="sku.skuPic" :src="sku.skuPic" width="40" height="40">
                  <div v-else class="image-upload-placeholder"><el-icon><Picture/></el-icon></div>
                  <input type="file" accept="image/*" style="display:none"
                         :ref="el=>fileInputRefs[idx]=el"
                         @change="e=>handleImageUpload(e,sku,idx)">
                </div>
                <el-input v-model="sku.skuName" placeholder="小标题（必选）" clearable class="color-name-input"
                          @input="setHasChanged"/>
                <el-button v-if="itemSku.length>1" type="danger" circle :icon="Delete"
                           @click="itemSku.splice(idx,1);setHasChanged()"/>
                <el-button v-if="idx===itemSku.length-1&&itemSku.length<114&&sku.skuName"
                           type="primary" circle :icon="Plus" @click="addSku"/>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 销售规格表格 -->
      <div class="form-item">
        <label class="form-label">销售规格：</label>
        <el-table :data="itemSku" border style="width:100%">
          <el-table-column prop="skuPic" label="图片" width="75">
            <template #default="s">
              <img v-if="s.row.skuPic" :src="s.row.skuPic" width="50" height="50">
              <span v-else>无</span>
            </template>
          </el-table-column>
          <el-table-column prop="skuName" label="分类" width="180"/>
          <el-table-column label="价格" width="100">
            <template #default="s">
              <el-input v-model="s.row.price" placeholder="价格" clearable @input="setHasChanged"/>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="100">
            <template #default="s">
              <el-input v-model="s.row.quantity" placeholder="数量" clearable @input="setHasChanged"/>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="form-item">
        <label class="form-label">一口价：</label>
        <el-input v-model="itemSpu.price" placeholder="一口价" clearable style="width:300px"
                  @input="setHasChanged"/><span>元</span>
      </div>
      <div class="form-item">
        <label class="form-label">总库存：</label>
        <el-input :model-value="totalStock" readonly style="width:300px"/><span>件</span>
      </div>
    </div>
  </section>

  <!-- 4. 物流服务 -->
  <section id="logistics-service" class="content-section">
    <h2>物流服务</h2>
    <div class="form-container">
      <div class="form-item">
        <label class="form-label">发货时间：</label>
        <el-radio-group v-model="deliveryTime" @change="setHasChanged">
          <el-radio value="today">今日发</el-radio>
          <el-radio value="24h">24小时内</el-radio>
          <el-radio value="48h">48小时内</el-radio>
          <el-radio value="gt48h">大于48小时</el-radio>
        </el-radio-group>
      </div>
    </div>
  </section>

  <!-- 5. 图文描述 -->
  <section id="graphic-description" class="content-section">
    <h2>图文描述</h2>
    <div class="form-item">
      <label class="form-label">主图：</label>
      <div class="input-wrapper">
        <p class="title-recommendation">比例1:1，推荐1440x1440以上，最多5张，可拖拽排序</p>
        <div class="main-image-upload">
          <VueDraggable v-model="itemSpu.picUrl" class="draggable-image-list" :animation="200"
                        :forceFallback="true" @end="setHasChanged">
            <div v-for="(f,i) in itemSpu.picUrl" :key="f.url" class="draggable-image-item">
              <el-image :src="f.url" fit="cover" class="uploaded-image"/>
              <div class="image-actions">
                <el-button type="primary" size="small" circle @click="triggerReplaceMainImage(i)">
                  <el-icon><Refresh/></el-icon>
                </el-button>
                <el-button type="danger" size="small" circle @click="removeMainImage(i)">
                  <el-icon><Delete/></el-icon>
                </el-button>
              </div>
              <div class="drag-handle"><el-icon><Rank/></el-icon></div>
              <input type="file" accept="image/*" style="display:none"
                     :ref="el=>mainImageInputRefs[i]=el"
                     @change="e=>handleReplaceMainImage(e,i)">
            </div>
          </VueDraggable>

          <el-upload v-if="itemSpu.picUrl.length<5" class="avatar-uploader" action="#"
                     :http-request="handleMainImageUpload" :show-file-list="false"
                     :before-upload="validateImage" :on-error="handleUploadError"
                     :on-exceed="handleExceed" name="file">
            <div class="upload-trigger">
              <el-icon><Picture/></el-icon><span class="upload-text">上传图片</span>
            </div>
          </el-upload>
        </div>
      </div>
    </div>
  </section>

  <!-- 6. 售后服务 -->
  <section id="after-sales-service" class="content-section">
    <h2>售后服务</h2>
    <div class="form-container">
      <div class="form-item">
        <label class="form-label">服务选择：</label>
        <div class="after-sales-options">
          <el-checkbox v-model="afterSalesServices.warranty" label="保修服务" @change="setHasChanged"/>
          <el-checkbox v-model="afterSalesServices.return7days" label="七天退货服务" @change="setHasChanged"/>
        </div>
      </div>
      <div v-if="afterSalesServices.warranty||afterSalesServices.return7days" class="form-item">
        <label class="form-label">服务说明：</label>
        <div class="service-description">
          <p v-if="afterSalesServices.warranty">✓ 提供商品保修服务，具体保修期限请参考商品详情</p>
          <p v-if="afterSalesServices.return7days">✓ 支持7天无理由退货，商品需保持完好无损</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 7. 提交栏 -->
  <div class="submit-section">
    <el-button type="primary" size="large" :loading="submitLoading" @click="submitProduct">发布商品</el-button>
    <el-button size="large" @click="saveDraft">保存草稿</el-button>
    <el-button size="large" link :disabled="!hasDraft" @click="clearDraft">清除草稿</el-button>
  </div>
</div>
</template>

<script setup>
/* ---------- 1. 依赖 ---------- */
import {ref,computed,onMounted,onBeforeUnmount} from 'vue'
import {useRoute,useRouter} from 'vue-router'
import axios from '../../axios'
import {ElMessage,ElMessageBox} from 'element-plus'
import {Plus,Delete,Picture,Rank,Refresh} from '@element-plus/icons-vue'
import {VueDraggable} from 'vue-draggable-plus'

const route=useRoute(),router=useRouter()
const merchant=JSON.parse(localStorage.getItem('merchant')||'{}')
const user   =JSON.parse(localStorage.getItem('user')||'{}')

/* ---------- 2. 通用工具 ---------- */
const validateImage=file=>{
  const isImg=file.type.startsWith('image/'),isLt5M=file.size/1024/1024<5
  if(!isImg) ElMessage.error('只能上传图片文件!')
  if(!isLt5M)ElMessage.error('图片大小不能超过 5MB!')
  return isImg&&isLt5M
}
const deleteImage=async url=>{
  if(!url)return
  const p=url.split('/')
  try{
    await axios.delete('/item/image',{
      params:{
        imageUrl:url,
        fileName:p.at(-1),
        merchantId: merchant.merchantId,
        merchantNo: merchant.merchantNo
      }
    })
  }catch{}
}
const inputLimitClass=(len,max)=>({
  'form-input':!0,
  'near-limit':len>=max*0.8,
  'over-limit':len>=max
})

/* ---------- 3. 导航/滚动 ---------- */
const navList=ref([
  {id:'basic-info',       name:'基础信息'},
  {id:'sales-info',       name:'销售信息'},
  {id:'logistics-service',name:'物流服务'},
  {id:'graphic-description',name:'图文描述'},
  {id:'after-sales-service',name:'售后服务'}
])
const activeSectionId=ref('basic-info')
const scrollToSection=id=>{
  const el=document.getElementById(id)
  if(!el)return
  const box=document.querySelector('.el-main')||window
  const top=box===window?el.offsetTop-250:el.offsetTop-box.offsetTop-250
  box.scrollTo({top,behavior:'smooth'})
  activeSectionId.value=id
}
const handleScroll=()=>{
  const offset=250
  for(let i=navList.value.length-1;i>=0;i--){
    const sec=document.getElementById(navList.value[i].id)
    if(sec&&sec.getBoundingClientRect().top<=offset){activeSectionId.value=navList.value[i].id;break}
  }
}

/* ---------- 4. 数据 ---------- */
const itemSpu=ref({
  itemId:'',title:'',subTitle:'',price:0,picUrl:[],cid:0,brand:'',
  sellerId:localStorage.getItem('sellerId')||'',status:1
})
const selectedCategory=ref([]),categoryOptions=ref([])
const itemSku=ref([{skuId:'',skuName:'',price:0,quantity:0,skuPic:'',status:1}])
const deliveryTime=ref('24h')
const afterSalesServices=ref({warranty:!1,return7days:!1})
const fileInputRefs=ref({}),mainImageInputRefs=ref({})
const submitLoading=ref(!1),hasChanged=ref(!1)
const productId=ref(route.params.id||'')

/* ---------- 5. 计算 ---------- */
const titleLen=computed(()=>itemSpu.value.title.length)
const subTitleLen=computed(()=>itemSpu.value.subTitle.length)
const totalStock=computed(()=>itemSku.value.reduce((s,k)=>s+Number(k.quantity||0),0))
const hasDraft=computed(()=>!!sessionStorage.getItem('productDraft'))

/* ---------- 6. 分类 ---------- */
const cascaderProps={
  lazy:!0,checkStrictly:!0,
  lazyLoad:async (node,resolve)=>{
    const pid=node.level?node.value:0
    try{
      const res=await axios.get(`/item-category/parent/${pid}`)
      const nodes=res.data.code===200?res.data.data.map(m=>({value:m.cid,label:m.name,isLeaf:m.isLeaf===1||node.level===2,leaf:m.isLeaf===1||node.level===2})):[]
      resolve(node.level?nodes:nodes.slice(1))
    }catch{resolve([])}
  }
}
const handleCategoryChange=v=>{itemSpu.value.cid=v?v[v.length-1]:0;setHasChanged()}

/* ---------- 7. 主图 ---------- */
const handleMainImageUpload=async ({file,onSuccess,onError})=>{
  if(!validateImage(file))return onError(new Error('invalid'))
  const fd=new FormData()
  fd.append('file',file)
  // 统一使用商家信息保存图片
  fd.append('merchantId',merchant.merchantId)
  if(merchant.merchantNo){
    fd.append('merchantNo',merchant.merchantNo)
  }
  try{
    const res=await axios.post('/item/image',fd,{headers:{'Content-Type':'multipart/form-data'}})
    res.data.code===200
      ?(ElMessage.success('主图上传成功'),itemSpu.value.picUrl.push({name:file.name,url:res.data.data}),setHasChanged(),onSuccess(res.data))
      :(ElMessage.error(`主图上传失败:${res.data.message||'unknown'}`),onError(new Error(res.data.message||'fail')))
  }catch(e){ElMessage.error('主图上传失败');onError(e)}
}
const triggerReplaceMainImage=i=>mainImageInputRefs.value[i]?.click()
const handleReplaceMainImage=async (e,i)=>{
  const file=e.target.files[0];if(!file||!validateImage(file))return
  const old=itemSpu.value.picUrl[i]?.url
  if(old)await deleteImage(old)
  const fd=new FormData()
  fd.append('file',file)
  // 统一使用商家信息保存图片
  fd.append('merchantId',merchant.merchantId)
  if(merchant.merchantNo){
    fd.append('merchantNo',merchant.merchantNo)
  }
  try{
    const res=await axios.post('/item/image',fd,{headers:{'Content-Type':'multipart/form-data'}})
    res.data.code===200?(ElMessage.success('主图替换成功'),itemSpu.value.picUrl[i]={name:file.name,url:res.data.data},setHasChanged()):ElMessage.error(`主图替换失败:${res.data.message||'unknown'}`)
  }catch{ElMessage.error('主图替换失败')}
  e.target.value=''
}
const removeMainImage=async i=>{
  const url=itemSpu.value.picUrl[i]?.url
  if(url)await deleteImage(url)
  itemSpu.value.picUrl.splice(i,1)
  ElMessage.success('图片已删除')
  setHasChanged()
}
const handleUploadError=()=>ElMessage.error('图片上传失败')
const handleExceed=()=>ElMessage.warning('主图最多只能上传5张！')

/* ---------- 8. SKU ---------- */
const triggerFileInput=i=>fileInputRefs.value[i]?.click()
const handleImageUpload=async (e,sku)=>{
  const file=e.target.files[0];if(!file||!validateImage(file))return
  if(sku.skuPic)await deleteImage(sku.skuPic)
  const fd=new FormData()
  fd.append('file',file)
  // 统一使用商家信息保存图片
  fd.append('merchantId',merchant.merchantId)
  if(merchant.merchantNo){
    fd.append('merchantNo',merchant.merchantNo)
  }
  try{
    const res=await axios.post('/item-sku/image',fd,{headers:{'Content-Type':'multipart/form-data'}})
    res.data.code===200?(ElMessage.success('SKU图片上传成功'),sku.skuPic=res.data.data.skuPic,setHasChanged()):ElMessage.error(`SKU图片上传失败:${res.data.message||'unknown'}`)
  }catch{ElMessage.error('SKU图片上传失败')}
}
const addSku=()=>{itemSku.value.push({skuId:'',skuName:'',price:0,quantity:0,skuPic:'',status:1});setHasChanged()}

/* ---------- 9. 表单 & 提交 ---------- */
const setHasChanged=()=>hasChanged.value=!0
const validateForm=()=>{
  if(!itemSpu.value.title.trim()){ElMessage.error('请输入商品标题');return!1}
  if(!itemSpu.value.cid){ElMessage.error('请选择商品分类');return!1}
  if(!merchant.merchantId){ElMessage.error('未获取到店铺信息');return!1}
  if(!itemSpu.value.price||itemSpu.value.price<=0){ElMessage.error('请输入有效的商品一口价');return!1}
  if(!itemSku.value.length){ElMessage.error('请至少添加一个SKU');return!1}
  return itemSku.value.every((k,i)=>{
    if(!k.skuName.trim()){ElMessage.error(`第${i+1}个SKU名称不能为空`);return!1}
    if(!k.price||k.price<=0){ElMessage.error(`第${i+1}个SKU价格必须大于0`);return!1}
    if(k.quantity<0){ElMessage.error(`第${i+1}个SKU库存不能为负数`);return!1}
    return!0
  })
}
const submitProduct=async ()=>{
  if(!validateForm())return
  submitLoading.value=!0
  try{
    const spData={
      ...itemSpu.value,
      aftersale:JSON.stringify({deliveryTime:deliveryTime.value,...afterSalesServices.value}),
      picUrl:itemSpu.value.picUrl.map(p=>p.url).join(',')
    }
    const isEdit=!!itemSpu.value.itemId
    const spRes=await axios[isEdit?'put':'post'](isEdit?'/item':'/item',spData)

    const skuList=itemSku.value.map(k=>({...k,itemId:spRes.data.data.itemId}))
    if(isEdit)await axios.delete(`/item-sku/${itemSpu.value.itemId}`)
    const skuRes=await axios.post('/item-sku',skuList)

    if(spRes.data.code===200&&skuRes.data.code===200){
      ElMessage.success(isEdit?'商品修改成功！':'商品发布成功！')
      hasChanged.value=!1
      setTimeout(()=>router.replace('/store'),1e3)
    }else ElMessage.error(`操作失败:${spRes.data.message||'unknown'}`)
  }catch{ElMessage.error('操作失败，请重试')}
  finally{submitLoading.value=!1}
}

/* ---------- 10. 草稿 ---------- */
const saveDraft=()=>{
  try{
    sessionStorage.setItem('productDraft',JSON.stringify({
      spu:itemSpu.value,skus:itemSku.value,deliveryTime:deliveryTime.value,
      selectedCategory:selectedCategory.value,afterSalesServices:afterSalesServices.value,
      saveTime:new Date().toISOString()
    }))
    ElMessage.success('草稿保存成功')
    hasChanged.value=!1
  }catch{ElMessage.error('保存草稿失败')}
}
const clearDraft=async ()=>{
  try{
    await ElMessageBox.confirm('确定要清除所有草稿吗？清除后不可恢复！','确认清除',
      {confirmButtonText:'确认清除',cancelButtonText:'取消',type:'error',center:!0})
    sessionStorage.removeItem('productDraft')
    resetFormToDefault()
    ElMessage.success('草稿已成功清除')
  }catch{ElMessage.info('已取消清除草稿')}
}
const resetFormToDefault=()=>{
  Object.assign(itemSpu.value,{
    itemId:'',title:'',subTitle:'',price:0,picUrl:[],cid:0,brand:'',
    sellerId:localStorage.getItem('sellerId')||'',status:1
  })
  itemSku.value=[{skuId:'',skuName:'',price:0,quantity:0,skuPic:'',status:1}]
  selectedCategory.value=[]
  deliveryTime.value='24h'
  afterSalesServices.value={warranty:!1,return7days:!1}
  hasChanged.value=!1
}
const loadDraft=()=>{
  try{
    const d=JSON.parse(sessionStorage.getItem('productDraft')||'{}')
    if(d.spu)itemSpu.value=d.spu
    if(d.skus)itemSku.value=d.skus
    if(d.deliveryTime)deliveryTime.value=d.deliveryTime
    if(d.selectedCategory)selectedCategory.value=d.selectedCategory
    if(d.afterSalesServices)afterSalesServices.value=d.afterSalesServices
    ElMessage.success('草稿加载成功')
  }catch{}
}

/* ---------- 11. 详情回显 ---------- */
const fetchProductDetail = async (id) => {
  try {
    if (id == 0) {
      return
    }
    const res = await axios.get(`/item/${id}`)
    if (res.data.code === 200) {
      const data = res.data.data
      
      // 更新商品基本信息
      Object.assign(itemSpu.value, {
        ...data,
        itemId: id,
        picUrl: data.picUrl?.split(',').map(url => ({ url })) || []
      })

      // 获取分类路径
      if (data.cid) {
        const categoryPath = []
        let currentCid = data.cid
        
        while (currentCid) {
          try {
            const categoryRes = await axios.get(`/item-category/${currentCid}`)
            if (categoryRes.data.code === 200) {
              const category = categoryRes.data.data
              categoryPath.unshift(category.cid)
              currentCid = category.parentCid
              if (!currentCid || currentCid === 0) break
            } else {
              console.error('获取分类信息失败:', categoryRes.data.msg)
              break
            }
          } catch (error) {
            console.error('获取分类信息失败:', error)
            break
          }
        }
        
        if (categoryPath.length > 0) {
          selectedCategory.value = categoryPath
          itemSpu.value.cid = categoryPath[categoryPath.length - 1]
        }
      }

      // 获取SKU信息
      const skuRes = await axios.get('/item-sku', { 
        params: { 
          itemId: id,
          size: 114,
          current: 1
        }
      })
      
      if (skuRes.data.code === 200 && skuRes.data.data.records?.length > 0) {
        itemSku.value = skuRes.data.data.records
      } else {
        itemSku.value = [{
          skuId: '',
          skuName: '',
          price: 0,
          quantity: 0,
          skuPic: '',
          status: 1
        }]
      }

      // 更新售后服务信息
      if (data.aftersale) {
        try {
          const aftersale = JSON.parse(data.aftersale)
          deliveryTime.value = aftersale.deliveryTime || '24h'
          afterSalesServices.value = {
            warranty: !!aftersale.warranty,
            return7days: !!aftersale.return7days
          }
        } catch (error) {
          console.error('解析售后服务信息失败:', error)
          deliveryTime.value = '24h'
          afterSalesServices.value = { warranty: false, return7days: false }
        }
      }

      ElMessage.success('商品信息加载成功')
    } else {
      ElMessage.error(res.data.msg || '获取商品信息失败')
    }
  } catch (error) {
    console.error('获取商品信息失败:', error)
    ElMessage.error('获取商品信息失败，请重试')
  }
}

/* ---------- 12. 导航守卫 & 生命周期 ---------- */
const setupRouteGuard=()=>router.beforeEach((to,from,next)=>{
  if(hasChanged.value){
    ElMessageBox.confirm('您有未保存的修改，是否保存草稿后再离开？','确认离开',
      {confirmButtonText:'保存草稿',cancelButtonText:'放弃修改',type:'warning'})
      .then(saveDraft).then(()=>next()).catch(()=>next())
  }else next()
})
onMounted(()=>{
  const box=document.querySelector('.el-main')||window
  box.addEventListener('scroll',handleScroll)
  productId.value?fetchProductDetail(productId.value):loadDraft()
  if(!itemSpu.value.sellerId)itemSpu.value.sellerId=merchant.merchantId
  setupRouteGuard()
})
onBeforeUnmount(async ()=>{
  const box=document.querySelector('.el-main')||window
  box.removeEventListener('scroll',handleScroll)
  if(hasChanged.value){
    try{await ElMessageBox.confirm('您有未保存的修改，是否保存草稿后再离开？','确认离开',{confirmButtonText:'保存草稿',cancelButtonText:'放弃修改',type:'warning'}),await saveDraft()}catch{}
  }
})
</script>

<style scoped>
/* 导航样式 */
.anchor-nav {
  position: sticky; top: -20px; background: #fff; padding: 10px 0 10px 10px;
  border-bottom: 1px solid #eee; margin-bottom: 20px; z-index: 100;
}
.anchor-nav a { margin-right: 20px; text-decoration: none; color: #333; }
.anchor-nav a.active { color: #409eff; font-weight: bold; border-bottom: 2px solid #409eff; }

/* 内容区基础样式 */
.content-section { padding: 20px; margin-bottom: 20px; border: 1px solid #ebeef5; border-radius: 4px; background: #fff; }
.content-section h2 { margin-top: 0; color: #303133; }

/* 表单样式 */
.form-container { display: flex; flex-direction: column; gap: 16px; }
.form-item { display: flex; align-items: flex-start; gap: 8px; padding: 8px 0; }
.form-label { width: 100px; text-align: right; font-size: 14px; color: #333; font-weight: 500; padding-top: 8px; }
.form-input { width: 800px; height: 36px; padding: 0 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px; box-sizing: border-box; }
.form-input:focus { border-color: #409eff; box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2); }

/* 输入框辅助样式 */
.input-wrapper { display: flex; flex-direction: column; gap: 4px; }
.title-recommendation { font-size: 12px; color: #909399; margin: 0; }
.input-with-count { position: relative; display: inline-block; }
.char-count { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 12px; color: #c0c4cc; pointer-events: none; }
.near-limit + .char-count { color: #e6a23c; }
.over-limit + .char-count { color: #f56c6c; }

/* 主图上传样式 */
.main-image-upload { display: flex; flex-wrap: wrap; gap: 12px; }
.draggable-image-list { display: flex; flex-wrap: wrap; gap: 12px; }
.draggable-image-item { position: relative; width: 148px; height: 148px; border-radius: 6px; overflow: hidden; border: 1px solid #e0e0e0; cursor: move; transition: all 0.3s ease; }
.draggable-image-item:hover { border-color: #409eff; box-shadow: 0 2px 12px rgba(64, 158, 255, 0.3); }
.uploaded-image { width: 100%; height: 100%; object-fit: cover; }
.image-actions { position: absolute; top: 8px; right: 8px; opacity: 0; transition: opacity 0.3s ease; }
.draggable-image-item:hover .image-actions { opacity: 1; }
.drag-handle { position: absolute; top: 8px; left: 8px; width: 32px; height: 32px; background: rgba(0, 0, 0, 0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; cursor: move; opacity: 0; transition: opacity 0.3s ease; }
.draggable-image-item:hover .drag-handle { opacity: 1; }
.upload-trigger { width: 148px; height: 148px; border: 2px dashed #d9d9d9; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s ease; }
.upload-trigger:hover { border-color: #409eff; }
.upload-text { margin-top: 8px; color: #8c939d; font-size: 14px; }

/* SKU样式 */
.color-category-wrapper { width: 1100px; background: #F7F8FA; padding: 10px; border-radius: 5px; margin: 10px 0; }
.color-categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); /* 每行最多3个，每个最小300px */
  gap: 20px;
}
.color-input-group { display: flex; align-items: center; gap: 10px; }
.color-name-input { width: 220px; }

/* 图片上传占位符 */
.image-upload-placeholder { width: 40px; height: 40px; border: 1px dashed #d9d9d9; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: border-color 0.3s; }
.image-upload-placeholder:hover { border-color: #409eff; }
.image-upload-placeholder .el-icon { font-size: 16px; color: #8c939d; }

/* 售后服务样式 */
.after-sales-options { display: flex; gap: 20px; align-items: center; }
.service-description { background: #f5f7fa; padding: 12px 16px; border-radius: 4px; border-left: 4px solid #409eff; }
.service-description p { margin: 8px 0; font-size: 14px; color: #606266; line-height: 1.5; }

/* 清除草稿按钮样式 */
.submit-section .el-button--text,
.submit-section .el-button.is-link {
  color: #f56c6c; /* 红色文字，提示"删除"属性 */
  margin-left: 12px;
}
.submit-section .el-button--text:disabled,
.submit-section .el-button.is-link:disabled {
  color: #c0c4cc; /* 禁用时灰色，符合视觉预期 */
  cursor: not-allowed;
}
</style>