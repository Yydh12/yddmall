<template>
  <div class="checkout-container">
    <div class="checkout-header">
      <div class="header-left">
        <h2>订单结算</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="isBuyNow ? { path: '/products' } : { path: '/cart' }">
            {{ isBuyNow ? '商品列表' : '购物车' }}
          </el-breadcrumb-item>
          <el-breadcrumb-item>订单结算</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <el-button v-if="isBuyNow" @click="goBack" type="primary" link style="margin-left: auto;">
        ← 返回商品详情
      </el-button>
    </div>

    <div class="checkout-content">
      <!-- 收货地址选择（默认显示默认地址，更换后显示更换地址） -->
      <div class="address-section">
        <div class="section-header">
          <h3>收货地址</h3>
          <div>
            <el-button link @click="showAddAddressDialog = true">添加新地址</el-button>
            <el-button link @click="openChangeAddressDialog('checkout')" v-if="addresses.length > 0">更换地址</el-button>
          </div>
        </div>
        
        <!-- 显示当前选中的地址（默认地址/更换后的地址） -->
        <div class="address-list" v-if="selectedAddressId">
          <div 
            class="address-item" 
            :key="selectedAddressId"
            :class="{ 'selected': true }"
          >
            <div class="address-info">
              <div class="receiver-info">
                <span class="receiver-name">{{ currentAddress.receiverName }}</span>
                <span class="receiver-phone">{{ currentAddress.receiverPhone }}</span>
                <el-tag v-if="selectedAddressDefault === 1" type="success" size="small">默认</el-tag>
              </div>
              <div class="address-detail">
                {{ currentAddress.province }} {{ currentAddress.city }} {{ currentAddress.district }} {{ currentAddress.detailAddress }}
              </div>
            </div>
            <div class="address-actions">
              <el-button link size="small" @click.stop="editAddress(currentAddress)">编辑</el-button>
              <el-button link size="small" @click.stop="makeDefaultAddress(currentAddress)" v-if="selectedAddressDefault !== 1">设为默认</el-button>
            </div>
          </div>
        </div>
        
        <!-- 无地址时显示提示 -->
        <div v-else class="no-address">
          <p>暂无收货地址，请先添加地址</p>
          <el-button type="primary" @click="showAddAddressDialog = true">添加地址</el-button>
        </div>
      </div>

      <!-- 商品信息 -->
      <div class="product-section">
        <div class="section-header">
          <h3>商品信息</h3>
        </div>
        
        <div class="product-list">
          <div class="product-item" v-for="item in cartItems" :key="item.itemId + '-' + item.skuId">
            <img :src="item.productImage" :alt="item.productName" class="product-image">
            <div class="product-info">
              <div class="product-name">{{ item.productName }}</div>
              <div class="product-sku">{{ item.skuName }}</div>
              <div class="product-price">¥{{ item.price.toFixed(2) }}</div>
            </div>
            <div class="product-quantity">
              ×{{ item.quantity }}
            </div>
            <div class="product-total">
              ¥{{ (item.price * item.quantity).toFixed(2) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 订单备注 -->
      <div class="remark-section">
        <div class="section-header">
          <h3>订单备注</h3>
        </div>
        <el-input
          type="textarea"
          :rows="3"
          placeholder="请输入订单备注（选填）"
          v-model="buyerMessage"
        ></el-input>
      </div>

      <!-- 折扣选择（优惠券/红包/金币抵扣） -->
      <div class="discount-section">
        <div class="section-header">
          <h3>折扣选择</h3>
          <div>
            <el-button link @click="reloadDiscounts">刷新优惠</el-button>
          </div>
        </div>
        <div class="discount-grid">
          <div class="discount-item">
            <span class="label">可用优惠券：</span>
            <el-select v-model="selectedCouponId" placeholder="选择优惠券" clearable style="width: 320px" @change="applyDiscounts">
              <el-option v-for="c in availableCoupons" :key="getCouponId(c)" :label="formatCouponLabel(c)" :value="getCouponId(c)" />
            </el-select>
            <el-tag v-if="recommendedCouponLabel" type="warning" size="small" style="margin-left:8px;">推荐：{{ recommendedCouponLabel }}</el-tag>
            <el-button v-if="recommendedCouponId && selectedCouponId !== recommendedCouponId" type="primary" link @click="applyRecommendedCoupon">一键选择推荐</el-button>
          </div>
          <div class="discount-item">
            <span class="label">可用红包：</span>
            <el-select v-model="selectedRedPacketId" placeholder="选择红包" clearable style="width: 320px" @change="applyDiscounts">
              <el-option v-for="r in availableRedPackets" :key="r.id" :label="formatRedPacketLabel(r)" :value="r.id" />
            </el-select>
            <el-tag v-if="recommendedRedPacketLabel" type="warning" size="small" style="margin-left:8px;">推荐：{{ recommendedRedPacketLabel }}</el-tag>
            <el-tag v-if="recommendedRedPacketId" type="info" size="small" style="margin-left:8px;">所属店铺：{{ formatRedPacketShopLabel(recommendedRedPacketId) }}</el-tag>
            <el-button v-if="recommendedRedPacketId && selectedRedPacketId !== recommendedRedPacketId" type="primary" link @click="applyRecommendedRedPacket">一键选择推荐</el-button>
          </div>
          <div class="discount-item">
            <span class="label">金币抵扣：</span>
            <el-input-number v-model="coinUse" :min="0" :max="maxCoinUseLimit" :step="10" @change="applyDiscounts" />
            <span class="hint">（余额：{{ wallet.balance || 0 }} 枚，最多可用：{{ maxCoinUseLimit }} 枚，1000枚/¥1）</span>
            <el-button type="primary" link @click="doCoinSignin">签到领币</el-button>
          </div>
        </div>
        <div class="discount-tip">注：以上为预计优惠，实际以提交后服务端计算为准。</div>
      </div>
      
      <!-- 订单汇总 -->
      <div class="summary-section">
        <div class="summary-item">
          <span>商品总计：</span>
          <span>¥{{ totalAmount.toFixed(2) }}</span>
        </div>
        <div class="summary-item">
          <span>运费：</span>
          <span>¥{{ freightAmount.toFixed(2) }}</span>
        </div>
        <div class="summary-item">
          <span>优惠：</span>
          <span>-¥{{ discountAmount.toFixed(2) }}</span>
        </div>
        <div class="summary-total">
          <span>应付总额：</span>
          <span class="total-amount">¥{{ payAmount.toFixed(2) }}</span>
        </div>
        <el-button 
          type="danger" 
          size="large" 
          class="submit-button"
          @click="submitOrder"
          :disabled="!selectedAddressId || cartItems.length === 0"
        >
          提交订单
        </el-button>
      </div>
    </div>

    <!-- 地址对话框（添加/编辑） -->
    <el-dialog
      :title="isEditMode ? '编辑收货地址' : '添加收货地址'"
      v-model="showAddAddressDialog"
      width="600px"
      @close="resetAddressForm"
    >
      <el-form :model="addressForm" :rules="addressRules" ref="addressFormRef" label-width="100px">
        <el-form-item label="收货人" prop="receiverName">
          <el-input v-model="addressForm.receiverName" placeholder="请输入收货人姓名"></el-input>
        </el-form-item>
        <el-form-item label="手机号" prop="receiverPhone">
          <el-input v-model="addressForm.receiverPhone" placeholder="请输入手机号"></el-input>
        </el-form-item>
        <!-- 地址输入统一使用地图地址选择器 -->
        <el-form-item label="地址">
          <AddressPicker 
            v-model="addressPicker" 
            :region-options="regionOptions"
            v-model:detailAddress="addressForm.detailAddress"
            @update:modelValue="handleAddressPickerChange"
          />
        </el-form-item>
        <!-- 更换地址按钮（编辑时选择已有地址） -->
        <el-form-item label="更换地址">
          <el-button type="text" @click="openChangeAddressDialog('edit')" v-if="addresses.length > 0">
            选择已有地址
          </el-button>
        </el-form-item>
        <el-form-item label="邮政编码" prop="postalCode">
          <el-input v-model="addressForm.postalCode" placeholder="请输入邮政编码"></el-input>
        </el-form-item>
        <el-form-item label="设为默认" prop="isDefault">
          <el-switch v-model="addressForm.isDefault"></el-switch>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddAddressDialog = false">取 消</el-button>
        <el-button type="primary" @click="saveAddress">确 定</el-button>
      </template>
    </el-dialog>

    <!-- 更换地址弹窗 -->
    <el-dialog
      title="选择收货地址"
      v-model="showChangeAddressDialog"
      width="600px"
      @close="resetChangeAddress"
    >
      <div class="change-address-list">
        <div 
          class="change-address-item" 
          v-for="address in addresses" 
          :key="address.addressId"
          :class="{ 'selected': selectedChangeAddressId === address.addressId }"
          @click="selectedChangeAddressId = address.addressId"
        >
          <div class="change-address-info">
            <div class="change-receiver-info">
              <span class="change-receiver-name">{{ address.receiverName }}</span>
              <span class="change-receiver-phone">{{ address.receiverPhone }}</span>
              <el-tag v-if="address.isDefault === 1" type="success" size="small">默认</el-tag>
            </div>
            <div class="change-address-detail">
              {{ address.province }} {{ address.city }} {{ address.district }} {{ address.detailAddress }}
            </div>
          </div>
        </div>
        <div v-if="addresses.length === 0" class="no-change-address">
          <p>暂无收货地址，请先添加</p>
          <el-button type="primary" size="small" @click="handleAddAddressInChange">添加地址</el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="showChangeAddressDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmChangeAddress" :disabled="!selectedChangeAddressId">确认选择</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getAddresses, addAddress, setDefaultAddress as setDefaultAddressApi, updateAddress } from '@/api/address'
import { createOrder, createDirectOrder } from '@/api/order'
import AddressPicker from '@/components/Common/AddressPicker.vue'
import { useRegionPicker } from '@/utils/useRegionPicker'
import { usePaymentFlow } from '@/composables/usePaymentFlow'
import { 
  listMyCouponsFiltered,
  claimCoupon,
  listAvailableRedPackets,
  listMyRedPacketsFiltered,
  claimRedPacket,
  getCoinWallet,
  dailySignIn,
  applyOrderDiscount
} from '@/api/discount'
import { getItem } from '@/api/item'
import { getMerchant } from '@/api/merchant'

export default {
  name: 'Checkout',
  components: { AddressPicker },
  setup() {
    const router = useRouter()
    const { createOrderAndApplyDiscount } = usePaymentFlow()
    
    // 数据状态
    const addresses = ref([])
    const selectedAddressId = ref(null)
    const selectedAddressDefault = ref(0) // 标记选中地址是否为默认（1：是，0：否）
    const cartItems = ref([])
    const buyerMessage = ref('')
    const freightAmount = ref(0)
    // 折扣选择相关
    const availableCoupons = ref([])
    const availableRedPackets = ref([])
    const selectedCouponId = ref(null)
    const selectedRedPacketId = ref(null)
    const wallet = ref({ balance: 0 })
    const coinUse = ref(0)
    const discountAmount = ref(0) // 预计优惠，预览用，实际以提交后服务端计算为准
    // 推荐优惠（用于引导）
    const recommendedCouponId = ref(null)
    const recommendedRedPacketId = ref(null)
    const recommendedCouponLabel = ref('')
    const recommendedRedPacketLabel = ref('')
    // 服务端计算的优惠明细
    const serverDiscountDetail = ref(null)
    // 商家相关（用于红包过滤与预估）
    const involvedMerchantIds = ref([]) // 去重后的商家ID列表
    const itemsMerchantMap = ref({}) // itemId -> merchantId
    const merchantSubtotals = ref({}) // merchantId -> 该商家商品小计
    const merchantNames = ref({}) // merchantId -> merchantName
    // 我的未使用红包ID集合（用于提交时判断是否需要领取）
    const myUnusedRedPacketIds = ref(new Set())
    // 防止重复请求
    const isCalculatingDiscount = ref(false)
    
    // 立即购买标识
    const isBuyNow = ref(false)
    
    // 地址表单
    const showAddAddressDialog = ref(false)
    const addressFormRef = ref(null)
    const isEditMode = ref(false)
    const editingAddressId = ref(null)
    const addressForm = reactive({
      receiverName: '',
      receiverPhone: '',
      region: [],
      detailAddress: '',
      postalCode: '',
      isDefault: false,
      lat: null,
      lng: null
    })

    // 地区选项与解析函数（来自组合式函数）
    const { regionOptions, labelsFromPath, pathFromLabels, createAddressPicker, bindPickerToForm } = useRegionPicker()

    // 地图地址选择（与表单同步）
    const addressPicker = createAddressPicker({
      selected: { value: [] },
      onAreaChange: (codes) => {
        addressForm.region = codes
      }
    })
    bindPickerToForm(addressPicker, addressForm)
    
    // 表单验证规则
    const addressRules = {
      receiverName: [
        { required: true, message: '请输入收货人姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
      ],
      receiverPhone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
      ],
      region: [
        { required: true, message: '请选择省市区', trigger: 'change' }
      ],
      detailAddress: [
        { required: true, message: '请输入详细地址', trigger: 'blur' },
        { min: 5, max: 200, message: '长度在 5 到 200 个字符', trigger: 'blur' }
      ]
    }

    // 更换地址相关状态
    const showChangeAddressDialog = ref(false)
    const selectedChangeAddressId = ref(null)
    const changeAddressScene = ref('edit') // edit：编辑场景，checkout：结算场景

    // 计算属性：当前选中的地址信息
    const currentAddress = computed(() => {
      return addresses.value.find(addr => addr.addressId === selectedAddressId.value) || {}
    })
    
    // 计算属性：订单金额相关
    const totalAmount = computed(() => {
      return cartItems.value.reduce((total, item) => total + (item.price * item.quantity), 0)
    })
    
    const payAmount = computed(() => {
      // 使用服务端返回的总价（如果有），否则前端预估
      if (serverDiscountDetail.value?.payAmount) {
        return serverDiscountDetail.value.payAmount
      }
      return totalAmount.value + freightAmount.value - discountAmount.value
    })

    // 金币最多可用：余额 与 商品金额30%之间的较小值（1币=0.01元 → 30%*100=30）
    const maxCoinUseLimit = computed(() => {
      const byCap = Math.floor(totalAmount.value * 30)
      const byBalance = Number(wallet.value?.balance || 0)
      return Math.max(0, Math.min(byCap, byBalance))
    })

    // 统一获取优惠券ID（优先使用 couponId，其次回退到 id）
    const getCouponId = (c) => {
      if (!c) return null
      return c.couponId ?? c.id ?? null
    }

    const formatCouponLabel = (c) => {
      const typeStr = (c.discountType === 2)
        ? `${Number(c.discountValue || 0)}%`
        : `¥${Number(c.discountValue || 0).toFixed(2)}`
      const scope = c.minSpend ? `(满¥${Number(c.minSpend).toFixed(2)})` : ''
      return `${c.title || '优惠券'} - ${typeStr} ${scope}`
    }

    const formatRedPacketLabel = (r) => {
      const mId = r?.merchantId ?? r?.merchant_id
      const shopName = mId != null
        ? (merchantNames.value?.[mId] ? `所属店铺：${merchantNames.value[mId]}` : `所属店铺：ID ${mId}`)
        : '所属店铺：平台通用'
      return `${r.title || '红包'} - ¥${Number(r.amount || 0).toFixed(2)}（${shopName}）`
    }
    const formatRedPacketShopLabel = (id) => {
      const rp = (availableRedPackets.value || []).find(r => r.id === id)
      if (!rp) return ''
      const mId = rp?.merchantId ?? rp?.merchant_id
      if (mId == null) return '平台通用'
      const name = merchantNames.value?.[mId]
      return name || `ID ${mId}`
    }

    // 预估优惠（本地预览，不调用服务端）
    const recomputePreviewDiscount = () => {
      const total = Number(totalAmount.value || 0)
      // 优惠券折扣
      let couponSave = 0
      if (selectedCouponId.value) {
        const c = (availableCoupons.value || []).find(x => getCouponId(x) === selectedCouponId.value)
        if (c) {
          const minSpend = Number(c.minSpend || 0)
          if (!minSpend || total >= minSpend) {
            if (Number(c.discountType) === 2) {
              couponSave = total * Number(c.discountValue || 0) / 100
            } else {
              couponSave = Number(c.discountValue || 0)
            }
          }
        }
      }

      // 红包折扣（按店铺或平台通用）
      let redPacketSave = 0
      if (selectedRedPacketId.value) {
        const r = (availableRedPackets.value || []).find(x => x.id === selectedRedPacketId.value)
        if (r) {
          const nowMs = Date.now()
          const st = r?.startTime ? new Date(r.startTime).getTime() : null
          const et = r?.endTime ? new Date(r.endTime).getTime() : null
          const timeOk = (!st || nowMs >= st) && (!et || nowMs <= et)
          const threshold = Number((r.threshold ?? r.minSpend) || 0)
          const mId = r?.merchantId ?? r?.merchant_id ?? null
          const sub = mId != null ? Number(merchantSubtotals.value[mId] || 0) : total
          if (timeOk && (!threshold || sub >= threshold)) {
            redPacketSave = Math.min(Number(r.amount || 0), sub)
          }
        }
      }

      // 金币抵扣（1币=0.01元，最多商品金额30%且不超过余额）
      const byCap = Math.floor(total * 30)
      const balance = Number(wallet.value?.balance || 0)
      const maxCoinsAllowed = Math.max(0, Math.min(byCap, balance))
      if (coinUse.value > maxCoinsAllowed) {
        coinUse.value = maxCoinsAllowed
      }
      const coinSave = Number(coinUse.value || 0) / 100

      const sum = couponSave + redPacketSave + coinSave
      return Math.min(total, Math.max(0, sum))
    }

    const applyDiscounts = async () => {
      if (isCalculatingDiscount.value) return
      isCalculatingDiscount.value = true
      try {
        // 本地预估折扣，服务端在提交订单时进行最终校验
        serverDiscountDetail.value = null
        discountAmount.value = recomputePreviewDiscount()
      } finally {
        isCalculatingDiscount.value = false
      }
    }

    // 一键应用推荐项
    const applyRecommendedCoupon = () => {
      if (recommendedCouponId.value) {
        selectedCouponId.value = recommendedCouponId.value
        applyDiscounts()
      }
    }
    const applyRecommendedRedPacket = () => {
      if (recommendedRedPacketId.value) {
        selectedRedPacketId.value = recommendedRedPacketId.value
        applyDiscounts()
      }
    }

    const reloadDiscounts = async () => {
      try {
        // 收集商家ID与商家商品小计
        await collectMerchants()
        // 拉取商家名称（若有涉及到的商家）
        await fetchMerchantNames()
        const [cResp, wResp] = await Promise.all([
          listMyCouponsFiltered({ status: 0 }),
          getCoinWallet()
        ])
        availableCoupons.value = Array.isArray(cResp?.data) ? cResp.data : []
        // 红包候选源：合并"我的未使用红包"和"可领取红包"，统一字段后去重
        // 1) 我的未使用红包
        const myResp = await listMyRedPacketsFiltered({ status: 0 })
        const myRaw = Array.isArray(myResp?.data) ? myResp.data : []

        // 2) 可领取红包（按商家过滤）
        let availRaw = []
        if (Array.isArray(involvedMerchantIds.value) && involvedMerchantIds.value.length > 0) {
          if (involvedMerchantIds.value.length === 1) {
            const mid = involvedMerchantIds.value[0]
            const rRespSingle = await listAvailableRedPackets({ merchantId: mid })
            availRaw = Array.isArray(rRespSingle?.data) ? rRespSingle.data : []
          } else {
            const promises = involvedMerchantIds.value.map(mid => listAvailableRedPackets({ merchantId: mid }))
            const results = await Promise.allSettled(promises)
            const merged = []
            const seen = new Set()
            for (const r of results) {
              const data = Array.isArray(r.value?.data) ? r.value.data : []
              for (const x of data) {
                const id = x.id || x.redPacketId || `${x.merchantId}-${x.amount}-${x.title}`
                if (!seen.has(id)) {
                  seen.add(id)
                  merged.push(x)
                }
              }
            }
            availRaw = merged
          }
        } else {
          const rResp = await listAvailableRedPackets()
          availRaw = Array.isArray(rResp?.data) ? rResp.data : []
        }

        // 3) 统一字段
        const normalize = (x, source) => ({
          // 统一：id保留原始ID以做去重；新增redPacketId用于提交与比较
          id: x?.id ?? x?.redPacketId ?? null,
          redPacketId: x?.redPacketId ?? x?.id ?? null,
          title: x?.title ?? '红包',
          amount: Number(x?.amount || 0),
          threshold: x?.threshold ?? x?.minSpend ?? 0,
          merchantId: x?.merchantId ?? x?.merchant_id ?? null,
          startTime: x?.startTime ?? x?.start_time ?? null,
          endTime: x?.endTime ?? x?.end_time ?? null,
          source
        })
        const myNorm = myRaw.map((r) => normalize(r, 'mine')).filter(r => r.id != null)
        const availNorm = availRaw.map((r) => normalize(r, 'available')).filter(r => r.id != null)

        // 4) 若涉及商家，仅保留与当前订单相关的商家红包或平台通用红包
        let myFiltered = myNorm
        if (Array.isArray(involvedMerchantIds.value) && involvedMerchantIds.value.length > 0) {
          const idSet = new Set(involvedMerchantIds.value)
          myFiltered = myNorm.filter(r => r.merchantId == null || idSet.has(r.merchantId))
        }

        // 5) 合并并按 id 去重
        const mergedList = []
        const seenIds = new Set()
        for (const x of [...myFiltered, ...availNorm]) {
          if (x?.id == null) continue
          if (!seenIds.has(x.id)) {
            seenIds.add(x.id)
            mergedList.push(x)
          }
        }
        availableRedPackets.value = mergedList
        // 记录我的未使用红包ID集合
        myUnusedRedPacketIds.value = new Set(myFiltered.map(r => r.id))
        wallet.value = wResp?.data || { balance: 0 }
        if (coinUse.value > maxCoinUseLimit.value) {
          coinUse.value = maxCoinUseLimit.value
        }
        // 计算或应用推荐优惠（引导用户）
        try {
          const total = Number(totalAmount.value || 0)
          // 优惠券推荐
          const cpCandidates = availableCoupons.value.filter(c => !c?.minSpend || total >= Number(c.minSpend || 0))
          let bestCpId = null, bestCpSave = 0, bestCpLabel = ''
          for (const c of cpCandidates) {
            let save = 0
            if (Number(c.discountType) === 2) {
              save = total * Number(c.discountValue || 0) / 100
            } else {
              save = Number(c.discountValue || 0)
            }
            if (save > bestCpSave) {
              bestCpSave = save
              bestCpId = getCouponId(c)
              bestCpLabel = formatCouponLabel(c)
            }
          }
          recommendedCouponId.value = bestCpId
          recommendedCouponLabel.value = bestCpLabel
          // 红包推荐（只从"我的未使用红包"中挑选，确保提交时无须领取即可生效）
          const nowMs = Date.now()
          const rpCandidatesAll = availableRedPackets.value.filter(r => {
            const threshold = r?.threshold ?? r?.minSpend ?? 0
            const mId = r.merchantId || r.merchant_id || null
            const sub = mId != null ? Number(merchantSubtotals.value[mId] || 0) : total
            const st = r?.startTime ? new Date(r.startTime).getTime() : null
            const et = r?.endTime ? new Date(r.endTime).getTime() : null
            const timeOk = (!st || nowMs >= st) && (!et || nowMs <= et)
            return timeOk && (!threshold || sub >= Number(threshold || 0))
          })
          const rpCandidatesOwned = rpCandidatesAll.filter(r => {
            // 仅从“我的未使用红包”集合挑选，保证无需领取即可直接应用
            return r.source === 'mine' && myUnusedRedPacketIds.value instanceof Set && myUnusedRedPacketIds.value.has(r.id)
          })
          let bestRpId = null, bestRpAmt = 0, bestRpLabel = ''
          for (const r of rpCandidatesOwned) {
            const amt = Number(r.amount || 0)
            if (amt > bestRpAmt) {
              bestRpAmt = amt
              // 推荐使用商家红包ID，避免传用户记录ID导致后端无法匹配
              bestRpId = r.redPacketId ?? r.id
              bestRpLabel = formatRedPacketLabel(r)
            }
          }
          recommendedRedPacketId.value = bestRpId
          recommendedRedPacketLabel.value = bestRpLabel
          // 应用来自商品详情页的"一键推荐"（仅买直时）
          try {
            const recStr = sessionStorage.getItem('recommendedDiscounts')
            if (recStr && isBuyNow.value) {
              const rec = JSON.parse(recStr)
              if (!selectedCouponId.value && rec?.couponId && availableCoupons.value.some(c => getCouponId(c) === rec.couponId)) {
                selectedCouponId.value = rec.couponId
              }
              if (!selectedRedPacketId.value && rec?.redPacketId && availableRedPackets.value.some(r => (r.redPacketId ?? r.id) === rec.redPacketId)) {
                selectedRedPacketId.value = rec.redPacketId
              }
            } else {
              // 若用户尚未选择，则自动预选推荐项（引导）
              if (!selectedCouponId.value && recommendedCouponId.value) {
                selectedCouponId.value = recommendedCouponId.value
              }
              if (!selectedRedPacketId.value && recommendedRedPacketId.value) {
                selectedRedPacketId.value = recommendedRedPacketId.value
              }
            }
          } catch {}
        } catch {}
        applyDiscounts()
      } catch (e) {
        console.error('加载优惠数据失败:', e)
        ElMessage.error('加载优惠数据失败')
      }
    }

    // 收集商家ID与商家商品小计
    const collectMerchants = async () => {
      try {
        const ids = []
        const itemIds = (cartItems.value || []).map(i => i.itemId).filter(Boolean)
        const map = {}
        const subtotals = {}
        const promises = itemIds.map(async (id) => {
          try {
            const resp = await getItem(id)
            const item = resp?.data || resp?.data?.data || resp?.item || null
            const sellerId = item?.sellerId || item?.merchantId || item?.seller_id || null
            if (sellerId != null) {
              map[id] = sellerId
              if (!ids.includes(sellerId)) ids.push(sellerId)
            }
          } catch (_) {}
        })
        await Promise.all(promises)
        // 计算商家小计
        for (const it of cartItems.value || []) {
          const mid = map[it.itemId]
          const line = Number(it.price || 0) * Number(it.quantity || 0)
          if (mid != null) {
            subtotals[mid] = Number((Number(subtotals[mid] || 0) + line).toFixed(2))
          }
        }
        itemsMerchantMap.value = map
        involvedMerchantIds.value = ids
        merchantSubtotals.value = subtotals
      } catch (e) {
        // 忽略采集失败，使用默认逻辑
        itemsMerchantMap.value = {}
        involvedMerchantIds.value = []
        merchantSubtotals.value = {}
      }
    }

    // 拉取涉及到商家名称（用于UI标注）
    const fetchMerchantNames = async () => {
      try {
        const ids = Array.isArray(involvedMerchantIds.value) ? involvedMerchantIds.value : []
        if (!ids.length) return
        const nameMap = { ...(merchantNames.value || {}) }
        const tasks = ids
          .filter(id => nameMap[id] == null)
          .map(async (id) => {
            try {
              const resp = await getMerchant(id)
              const data = resp?.data || resp?.data?.data || null
              const name = data?.merchantName || data?.name || null
              if (name) nameMap[id] = name
            } catch (_) {}
          })
        if (tasks.length) await Promise.allSettled(tasks)
        merchantNames.value = nameMap
      } catch (_) {}
    }

    // 签到领币（先判断今天是否已签到，未领则签到）
    const doCoinSignin = async () => {
      try {
        // 先查询钱包状态，判断今天是否已签到
        const walletResp = await getCoinWallet()
        if (walletResp && walletResp.code === 200) {
          const last = walletResp.data?.lastSignTime
          if (last) {
            const lastDate = new Date(last)
            const now = new Date()
            const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            const alreadyToday = fmt(lastDate) === fmt(now)
            if (alreadyToday) {
              ElMessage.info('今天已经领过金币啦')
              return
            }
          }
        }

        // 未签到则执行签到（随机 280~329 枚）
        const gain = 280 + Math.floor(Math.random() * 50)
        const resp = await dailySignIn(gain)
        if (resp && resp.code === 200) {
          ElMessage.success(`签到成功，获得 ${gain} 枚金币`)
          // 刷新钱包余额与优惠数据
          try {
            const refreshed = await getCoinWallet()
            if (refreshed && refreshed.code === 200) {
              wallet.value = refreshed.data || wallet.value
            }
          } catch (_) {}
          await reloadDiscounts()
        } else {
          ElMessage.warning(resp?.msg || '签到失败')
        }
      } catch (e) {
        ElMessage.error(e?.response?.data?.msg || e.message || '签到失败')
      }
    }
    
    // 加载地址列表（默认选中默认地址）
    const loadAddresses = async () => {
      try {
        const response = await getAddresses()
        if (response.code === 200) {
          addresses.value = response.data
          const defaultAddress = addresses.value.find(addr => addr.isDefault === 1)
          if (defaultAddress) {
            selectedAddressId.value = defaultAddress.addressId
            selectedAddressDefault.value = defaultAddress.isDefault
          } else if (addresses.value.length > 0) {
            // 无默认地址时选中第一个地址
            selectedAddressId.value = addresses.value[0].addressId
            selectedAddressDefault.value = addresses.value[0].isDefault
          }
        } else {
          ElMessage.error(response.msg || '获取地址列表失败')
        }
      } catch (error) {
        console.error('获取地址列表失败:', error)
        ElMessage.error('获取地址列表失败')
      }
    }

    // 加载结算商品
    const loadCartItems = () => {
      const buyNowParam = router.currentRoute.value.query.buyNow
      isBuyNow.value = buyNowParam === 'true'
      const items = router.currentRoute.value.query.items
      
      if (items) {
        try {
          cartItems.value = JSON.parse(items)
        } catch (e) {
          console.error('解析路由参数商品数据失败:', e)
          cartItems.value = []
        }
      } else {
        const savedItems = sessionStorage.getItem('checkoutItems')
        if (savedItems) {
          try {
            cartItems.value = JSON.parse(savedItems)
          } catch (e) {
            console.error('解析sessionStorage商品数据失败:', e)
            cartItems.value = []
          }
        } else {
          cartItems.value = []
        }
      }
      
      if (cartItems.value.length === 0) {
        // 新增：检测是否从订单确认页回退
        const previousRoute = router.options.history.state.back;
        const isComingFromOrderConfirm = previousRoute?.includes('/orderConfirm/');
        if (!isComingFromOrderConfirm) {
          ElMessage.warning('购物车为空，请先添加商品')
          router.push(isBuyNow.value ? '/products' : '/cart')
        }
      }
    }

    // 保存地址（添加/编辑）
    const saveAddress = async () => {
      addressFormRef.value.validate(async (valid) => {
        if (valid) {
          try {
            const labels = labelsFromPath(addressForm.region)
            const addressData = {
              ...addressForm,
              province: labels[0] || '',
              city: labels[1] || '',
              district: labels[2] || '',
              isDefault: addressForm.isDefault ? 1 : 0
            }
            delete addressData.region
            
            if (isEditMode.value && editingAddressId.value) {
              await updateAddress(editingAddressId.value, addressData)
              ElMessage.success('更新地址成功')
            } else {
              await addAddress(addressData)
              ElMessage.success('添加地址成功')
            }
            showAddAddressDialog.value = false
            loadAddresses() // 重新加载地址，更新选中状态
          } catch (error) {
            ElMessage.error(isEditMode.value ? '更新地址失败' : '添加地址失败')
          }
        }
      })
    }
    
    // 编辑地址
    const editAddress = (address) => {
      isEditMode.value = true
      editingAddressId.value = address.addressId
      showAddAddressDialog.value = true
      addressForm.receiverName = address.receiverName || ''
      addressForm.receiverPhone = address.receiverPhone || ''
      addressForm.region = pathFromLabels({ province: address.province, city: address.city, district: address.district })
      addressForm.detailAddress = address.detailAddress || ''
      addressForm.postalCode = address.postalCode || ''
      addressForm.isDefault = address.isDefault === 1
      addressForm.lat = address.lat || null
      addressForm.lng = address.lng || null
    }

    // 设置默认地址
    const makeDefaultAddress = async (address) => {
      try {
        await setDefaultAddressApi(address.addressId)
        ElMessage.success('设置默认地址成功')
        // 更新选中地址的默认状态
        selectedAddressDefault.value = 1
        loadAddresses() // 重新加载地址列表同步状态
      } catch (error) {
        ElMessage.error('设置默认地址失败')
      }
    }
    
    // 重置地址表单
    const resetAddressForm = () => {
      isEditMode.value = false
      editingAddressId.value = null
      addressForm.receiverName = ''
      addressForm.receiverPhone = ''
      addressForm.region = []
      addressForm.detailAddress = ''
      addressForm.postalCode = ''
      addressForm.isDefault = false
      addressForm.lat = null
      addressForm.lng = null
    }
    
    // 提交订单
    const submitOrder = async () => {
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        ElMessage.error('请先登录后再提交订单')
        router.push('/login')
        return
      }
      
      let user
      try {
        user = JSON.parse(userStr)
        if (!user.userId) {
          ElMessage.error('用户登录信息异常，请重新登录')
          router.push('/login')
          return
        }
      } catch (e) {
        ElMessage.error('用户登录信息异常，请重新登录')
        router.push('/login')
        return
      }
      
      if (!selectedAddressId.value) {
        ElMessage.warning('请选择收货地址')
        return
      }
      
      if (!cartItems.value || cartItems.value.length === 0) {
        ElMessage.error('购物车数据异常，请返回重新选择商品')
        return
      }
      
      for (let i = 0; i < cartItems.value.length; i++) {
        const item = cartItems.value[i]
        if (!item.itemId || !item.skuId || !item.quantity || !item.price) {
          console.error('商品数据不完整:', item)
          ElMessage.error(`第${i + 1}个商品数据不完整，请重新选择商品`)
          return
        }
      }
      
      try {
        const { orderNo, discountApplied } = await createOrderAndApplyDiscount({
          isBuyNow: isBuyNow.value,
          addressId: selectedAddressId.value,
          buyerMessage: buyerMessage.value,
          couponId: selectedCouponId.value,
          redPacketId: selectedRedPacketId.value,
          coinsUsed: coinUse.value || 0,
          cartItems: cartItems.value
        })
        if (discountApplied) {
          serverDiscountDetail.value = discountApplied
        }
        ElMessage.success('订单提交成功')
        sessionStorage.removeItem('checkoutItems')
        router.replace({ name: 'orderConfirm', params: { orderNo } });
      } catch (error) {
        console.error('提交订单异常:', error)
        console.error('错误详情:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        ElMessage.error('提交订单失败: ' + (error.response?.data?.msg || error.message || '未知错误'))
      }
    }
    
    // 返回上一页
    const goBack = () => {
      if (window.history.length > 1) {
        router.back()
      } else {
        router.push('/products')
      }
    }

    // 地图地址选择器数据同步
    const handleAddressPickerChange = (addressData) => {
      if (addressData.selected?.value) {
        addressForm.region = addressData.selected.value;
      }
      addressForm.lat = addressData.lat;
      addressForm.lng = addressData.lng;
      if (addressData.detailAddress) {
        addressForm.detailAddress = addressData.detailAddress;
      }
    };

    // 更换地址相关方法
    // 重置更换地址状态
    const resetChangeAddress = () => {
      selectedChangeAddressId.value = null
      changeAddressScene.value = 'edit'
    }

    // 打开更换地址弹窗
    const openChangeAddressDialog = (scene) => {
      changeAddressScene.value = scene
      // 弹窗默认选中当前已选地址
      if (scene === 'checkout' && selectedAddressId.value) {
        selectedChangeAddressId.value = selectedAddressId.value
      } else if (scene === 'edit' && editingAddressId.value) {
        selectedChangeAddressId.value = editingAddressId.value
      }
      showChangeAddressDialog.value = true
    }

    // 确认更换地址（核心：切换后显示选中的新地址）
    const confirmChangeAddress = () => {
      if (!selectedChangeAddressId.value) return
      const selectedAddress = addresses.value.find(addr => addr.addressId === selectedChangeAddressId.value)
      if (!selectedAddress) return

      if (changeAddressScene.value === 'checkout') {
        // 结算页更换地址：更新选中地址ID和默认状态
        selectedAddressId.value = selectedChangeAddressId.value
        selectedAddressDefault.value = selectedAddress.isDefault
        ElMessage.success('地址更换成功')
      } else if (changeAddressScene.value === 'edit') {
        // 编辑地址时更换：同步表单数据
        addressForm.receiverName = selectedAddress.receiverName || ''
        addressForm.receiverPhone = selectedAddress.receiverPhone || ''
        addressForm.region = pathFromLabels({ 
          province: selectedAddress.province, 
          city: selectedAddress.city, 
          district: selectedAddress.district 
        })
        addressForm.detailAddress = selectedAddress.detailAddress || ''
        addressForm.postalCode = selectedAddress.postalCode || ''
        addressForm.isDefault = selectedAddress.isDefault === 1
        addressForm.lat = selectedAddress.lat || null
        addressForm.lng = selectedAddress.lng || null
        editingAddressId.value = selectedAddress.addressId
        ElMessage.success('地址选择成功')
      }

      showChangeAddressDialog.value = false
    }

    // 更换地址弹窗中添加新地址
    const handleAddAddressInChange = () => {
      showChangeAddressDialog.value = false
      showAddAddressDialog.value = true
      // 监听添加地址成功后刷新列表
      const closeListener = () => {
        loadAddresses()
        showAddAddressDialog.value.removeEventListener('close', closeListener)
      }
      showAddAddressDialog.value.addEventListener('close', closeListener)
    }
    
    // 生命周期：页面挂载时加载数据
    onMounted(() => {
      console.log('Checkout页面已挂载')
      try {
        loadAddresses()
        loadCartItems()
        reloadDiscounts()
      } catch (error) {
        console.error('Checkout页面加载失败:', error)
        ElMessage.error('页面加载失败，请刷新重试')
      }
    })
    
    // 暴露所有模板所需变量和方法（关键：暴露selectedAddressDefault）
    return {
      addresses,
      selectedAddressId,
      selectedAddressDefault, // 解决未定义警告
      cartItems,
      buyerMessage,
      freightAmount,
      discountAmount,
      totalAmount,
      payAmount,
      showAddAddressDialog,
      addressFormRef,
      addressForm,
      addressRules,
      regionOptions,
      isBuyNow,
      isEditMode,
      editingAddressId,
      addressPicker,
      currentAddress,
      // 更换地址相关
      showChangeAddressDialog,
      selectedChangeAddressId,
      openChangeAddressDialog,
      confirmChangeAddress,
      resetChangeAddress,
      handleAddAddressInChange,
      // 方法
      loadAddresses,
      reloadDiscounts,
      saveAddress,
      editAddress,
      makeDefaultAddress,
      resetAddressForm,
      submitOrder,
      goBack,
      // 折扣
      availableCoupons,
      availableRedPackets,
      selectedCouponId,
      selectedRedPacketId,
      wallet,
      coinUse,
      maxCoinUseLimit,
      getCouponId,
      formatCouponLabel,
      formatRedPacketLabel,
      formatRedPacketShopLabel,
      // 推荐显示
      recommendedCouponId,
      recommendedRedPacketId,
      recommendedCouponLabel,
      recommendedRedPacketLabel,
      applyRecommendedCoupon,
      applyRecommendedRedPacket,
      applyDiscounts,
      doCoinSignin,
      handleAddressPickerChange,
      labelsFromPath,
      pathFromLabels
    }
  }
}
</script>

<style scoped>
.checkout-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.checkout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkout-header h2 {
  margin: 0;
  color: #333;
}

.checkout-content {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.address-section,
.product-section,
.remark-section,
.summary-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.summary-section {
  border-bottom: none;
  margin-bottom: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h3 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.discount-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.discount-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  align-items: center;
}

.discount-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.discount-item .label {
  width: 110px;
  color: #666;
}

.discount-item .hint {
  color: #999;
  margin-left: 8px;
}

.discount-tip {
  color: #999;
  margin-top: 8px;
}

.address-list {
  display: grid;
  gap: 15px;
}

.address-item {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.address-item:hover {
  border-color: #409eff;
}

.address-item.selected {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.receiver-info {
  margin-bottom: 8px;
}

.receiver-name {
  font-weight: bold;
  margin-right: 10px;
}

.receiver-phone {
  color: #666;
  margin-right: 10px;
}

.address-detail {
  color: #333;
  font-size: 14px;
}

.address-actions {
  display: flex;
  gap: 10px;
}

.no-address {
  text-align: center;
  padding: 40px;
  color: #999;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.product-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 6px;
  gap: 15px;
}

.product-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.product-info {
  flex: 1;
}

.product-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.product-sku {
  color: #666;
  font-size: 12px;
  margin-bottom: 5px;
}

.product-price {
  color: #ff6b6b;
  font-weight: bold;
}

.product-quantity {
  color: #666;
  font-size: 14px;
}

.product-total {
  color: #ff6b6b;
  font-weight: bold;
  font-size: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #666;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
  font-size: 18px;
  font-weight: bold;
}

.total-amount {
  color: #ff6b6b;
  font-size: 24px;
}

.submit-button {
  width: 100%;
  height: 50px;
  font-size: 18px;
}

/* 更换地址弹窗样式 */
.change-address-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px 0;
}
.change-address-item {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
}
.change-address-item:hover {
  border-color: #409eff;
}
.change-address-item.selected {
  border-color: #409eff;
  background-color: #f0f9ff;
}
.change-receiver-info {
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.change-receiver-name {
  font-weight: 500;
}
.change-receiver-phone {
  color: #666;
  font-size: 14px;
}
.change-address-detail {
  color: #333;
  font-size: 14px;
  line-height: 1.4;
}
.no-change-address {
  text-align: center;
  padding: 30px;
  color: #999;
}
</style>
