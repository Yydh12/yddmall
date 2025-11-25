<template>
  <div class="order-confirm-container">
    <div class="confirm-header">
      <h2>订单提交成功</h2>
      <div class="order-info">
        <span>订单号：{{ order.orderNo }}</span>
        <span>应付金额：<span class="amount">¥{{ (order.payAmount ?? 0).toFixed(2) }}</span></span>
      </div>
    </div>

    <div class="confirm-content">
      <!-- 支付信息 -->
      <div class="payment-section">
        <div class="payment-header">
          <i class="el-icon-success success-icon"></i>
          <div class="payment-info">
            <h3>订单提交成功，请尽快付款！</h3>
            <p>请在 <span class="countdown">{{ countdownText }}</span> 内完成支付，超时订单将自动取消</p>
          </div>
        </div>
        
        <div class="payment-amount">
          <span class="label">应付金额：</span>
          <span class="amount">¥{{ order.payAmount.toFixed(2) }}</span>
        </div>
      </div>

      <!-- 订单详情 -->
      <div class="order-detail-section">
        <div class="section-header">
          <h3>订单详情</h3>
          <el-button link @click="goToOrderDetail">查看订单详情</el-button>
        </div>
        
        <div class="order-info-grid">
          <div class="info-item">
            <span class="label">订单编号：</span>
            <span class="value">{{ order.orderNo }}</span>
          </div>
          <div class="info-item">
            <span class="label">下单时间：</span>
            <span class="value">{{ formatDate(order.createTime) }}</span>
          </div>
          <div class="info-item">
            <span class="label">收货人：</span>
            <span class="value">{{ order.receiverName }} {{ order.receiverPhone }}</span>
          </div>
          <div class="info-item">
            <span class="label">收货地址：</span>
            <span class="value">{{ order.receiverAddress }}</span>
          </div>
          <div class="info-item">
            <span class="label">备注：</span>
            <span class="value">{{ order.buyerMessage || '无' }}</span>
          </div>
        </div>

        <div class="product-list">
          <div class="product-item" v-for="item in order.orderItems" :key="item.orderItemId">
            <img :src="item.itemPic" :alt="item.itemName" class="product-image">
            <div class="product-info">
              <div class="product-name">{{ item.itemName }}</div>
              <div class="product-sku">{{ item.skuName }}</div>
            </div>
            <div class="product-price">
              <span class="price">¥{{ item.price.toFixed(2) }}</span>
              <span class="quantity">×{{ item.quantity }}</span>
            </div>
          </div>
        </div>

        <!-- 已应用优惠明细 -->
        <div class="discount-section">
          <div class="section-header">
            <h3>已应用优惠明细</h3>
          </div>
          <div class="discount-summary">
            <div class="summary-item">
              <span class="label">商品总额</span>
              <span class="value">¥{{ (order.totalAmount ?? 0).toFixed(2) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">运费</span>
              <span class="value">¥{{ (order.freightAmount ?? 0).toFixed(2) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">优惠合计</span>
              <span class="value">-¥{{ (Number(discountDetail?.discountAmount ?? order.discountAmount ?? 0)).toFixed(2) }}</span>
            </div>
            <div class="summary-item total">
              <span class="label">应付金额</span>
              <span class="value amount">¥{{ (order.payAmount ?? ((order.totalAmount ?? 0) + (order.freightAmount ?? 0) - (order.discountAmount ?? 0))).toFixed(2) }}</span>
            </div>
          </div>

          <div class="discount-detail" v-if="discountDetail">
            <div class="detail-row" v-if="discountDetail.coupon && Number(discountDetail.couponDiscount || 0) > 0">
              <span class="detail-label">优惠券</span>
              <span class="detail-value">{{ discountDetail.coupon.title || '优惠券' }}：-¥{{ Number(discountDetail.couponDiscount || 0).toFixed(2) }}</span>
            </div>
            <div class="detail-row" v-if="discountDetail.redPacket && Number(discountDetail.redPacketDiscount || 0) > 0">
              <span class="detail-label">红包</span>
              <span class="detail-value">{{ discountDetail.redPacket.title || '红包' }}：-¥{{ Number(discountDetail.redPacketDiscount || 0).toFixed(2) }}</span>
            </div>
            <div class="detail-row" v-if="Number(discountDetail.coinDiscount || 0) > 0">
              <span class="detail-label">金币抵扣</span>
              <span class="detail-value">-¥{{ Number(discountDetail.coinDiscount || 0).toFixed(2) }}（使用 {{ Number(discountDetail.coinUsed || 0) }} 金币）</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 折扣选择（已移除，为避免与结算页重复） -->

      <!-- 支付方式选择 -->
      <div class="payment-method-section">
        <div class="section-header">
          <h3>选择支付方式</h3>
        </div>
        
        <div class="payment-methods">
          <div 
            class="payment-method" 
            v-for="method in paymentMethods" 
            :key="method.id"
            :class="{ 'selected': selectedPaymentMethod === method.id }"
            @click="selectedPaymentMethod = method.id"
          >
            <img :src="method.icon" :alt="method.name" class="method-icon">
            <span class="method-name">{{ method.name }}</span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="primary" size="large" @click="goToPay" :loading="payLoading">
          立即支付
        </el-button>
        <el-button size="large" @click="goToOrderList">查看订单</el-button>
        <el-button size="large" @click="continueShopping">继续购物</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOrderDetail, cancelOrder } from '@/api/order'
import { usePaymentFlow } from '@/composables/usePaymentFlow'
// 折扣选择已迁移至结算页，订单确认页仅保留展示与支付

export default {
  name: 'OrderConfirm',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const { initiatePayment, fetchOrderForConfirm, payTypeMap } = usePaymentFlow()
    
    // 数据状态
    const order = reactive({
      orderNo: '',
      payAmount: 0,
      createTime: '',
      receiverName: '',
      receiverPhone: '',
      receiverAddress: '',
      orderItems: []
    })
    const discountDetail = ref(null)
    
    const selectedPaymentMethod = ref('wechat')
    const payLoading = ref(false)
    const countdown = ref(1800) // 30分钟倒计时
    let countdownTimer = null

    // 折扣选择相关逻辑已移除（避免重复选择）
    
    // 支付方式配置
    const paymentMethods = [
      {
        id: 'wechat',
        name: '微信支付',
        icon: '/pay/wechat-pay.png'
      },
      {
        id: 'alipay',
        name: '支付宝',
        icon: '/pay/alipay.png'
      },
      {
        id: 'bank',
        name: '银行卡支付',
        icon: '/pay/bank-card.png'
      }
    ]
    
    // 计算属性
    const countdownText = computed(() => {
      const minutes = Math.floor(countdown.value / 60)
      const seconds = countdown.value % 60
      return `${minutes}分${seconds.toString().padStart(2, '0')}秒`
    })

    // 金币限制已由结算页处理，此页不再计算
    
    // 方法
    const loadOrderDetail = async () => {
      const orderNo = route.params.orderNo
      if (!orderNo) {
        ElMessage.error('订单号不存在')
        router.push('/')
        return
      }
      try {
        const { order: ord, discountDetail: dDetail } = await fetchOrderForConfirm(orderNo)
        Object.assign(order, ord || {})
        discountDetail.value = dDetail || null
      } catch (error) {
        ElMessage.error('获取订单详情失败')
        router.push('/')
      }
    }

    // 折扣相关方法已移除
    
    const startCountdown = () => {
      countdownTimer = setInterval(() => {
        if (countdown.value > 0) {
          countdown.value--
        } else {
          clearInterval(countdownTimer)
          // 倒计时结束，调用取消订单接口
          (async () => {
            try {
              await cancelOrder(order.orderNo)
              ElMessage.warning('订单支付超时，已取消该订单')
            } catch (e) {
              // 如果取消失败（可能订单已支付或状态变化），给予提示但继续跳转
              ElMessage.warning(e?.message ? `取消失败：${e.message}` : '取消失败，订单状态可能已变更')
            } finally {
              router.push('/order/list')
            }
          })()
        }
      }, 1000)
    }
    
    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return date.toLocaleString('zh-CN')
    }
    
    const goToPay = async () => {
      payLoading.value = true
      try {
        await initiatePayment(order.orderNo, selectedPaymentMethod.value)
        ElMessage.success('支付成功！')
        router.replace({ name: 'OrderDetail', params: { orderNo: order.orderNo } })
      } catch (error) {
        ElMessage.error('支付失败：' + (error?.message || '未知错误'))
      } finally {
        payLoading.value = false
      }
    }
    
    const goToOrderDetail = () => {
      router.replace({
        name: 'OrderDetail',
        params: { orderNo: order.orderNo }
      })
    }
    
    const goToOrderList = () => {
      router.push({ path: '/orderTasks', query: { tab: 'pendingPayment' } })
    }
    
    const continueShopping = () => {
      if (order.orderItems && order.orderItems.length > 0) {
        router.replace({ name: 'productInfo', params: { itemId: order.orderItems[0].itemId } });
      } else {
        router.replace('/'); // Fallback if no order items, though this state should ideally not happen
      }
    }
    
    // 生命周期
    onMounted(() => {
      loadOrderDetail()
      startCountdown()
    })
    
    onUnmounted(() => {
      if (countdownTimer) {
        clearInterval(countdownTimer)
      }
    })
    
    return {
      order,
      discountDetail,
      selectedPaymentMethod,
      payLoading,
      countdownText,
      paymentMethods,
      formatDate,
      goToPay,
      goToOrderDetail,
      goToOrderList,
      continueShopping
    }
  }
}
</script>

<style scoped>
.order-confirm-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.confirm-header {
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  margin-bottom: 20px;
  text-align: center;
}

.confirm-header h2 {
  color: #67c23a;
  font-size: 24px;
  margin: 0 0 15px 0;
}

.order-info {
  display: flex;
  justify-content: center;
  gap: 30px;
  color: #666;
  font-size: 14px;
}

.amount {
  color: #ff6b6b;
  font-size: 18px;
  font-weight: bold;
}

.confirm-content {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.payment-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.payment-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.success-icon {
  font-size: 48px;
  color: #67c23a;
}

.payment-info h3 {
  margin: 0 0 5px 0;
  color: #333;
}

.payment-info p {
  margin: 0;
  color: #666;
}

.countdown {
  color: #ff6b6b;
  font-weight: bold;
}

.payment-amount {
  text-align: center;
  padding: 15px;
  background: #fff;
  border-radius: 6px;
}

.payment-amount .label {
  color: #666;
  font-size: 14px;
}

.payment-amount .amount {
  color: #ff6b6b;
  font-size: 24px;
  font-weight: bold;
  margin-left: 10px;
}

.order-detail-section,
.payment-method-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.discount-section {
  margin: 20px 0 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}
.discount-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin: 10px 0 15px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}
.summary-item { display: flex; justify-content: space-between; }
.summary-item .label { color: #666; }
.summary-item .value { color: #333; font-weight: 500; }
.summary-item.total .value.amount { color: #ff6b6b; font-weight: bold; }
.discount-detail { display: flex; flex-direction: column; gap: 6px; }
.detail-row { display: flex; gap: 12px; }
.detail-label { color: #666; min-width: 80px; }
.detail-value { color: #333; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  color: #333;
}

.order-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.info-item {
  display: flex;
  gap: 10px;
}

.info-item .label {
  color: #666;
  font-weight: bold;
  min-width: 80px;
}

.info-item .value {
  color: #333;
  flex: 1;
}

.product-list {
  border: 1px solid #eee;
  border-radius: 6px;
  overflow: hidden;
}

.product-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  gap: 15px;
}

.product-item:last-child {
  border-bottom: none;
}

.product-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.product-info {
  flex: 1;
}

.product-name {
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.product-sku {
  color: #666;
  font-size: 12px;
}

.product-price {
  text-align: right;
}

.product-price .price {
  color: #ff6b6b;
  font-weight: bold;
  display: block;
}

.product-price .quantity {
  color: #666;
  font-size: 12px;
}

.payment-methods {
  display: flex;
  gap: 20px;
}

.payment-method {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border: 2px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 120px;
}

.payment-method:hover {
  border-color: #409eff;
}

.payment-method.selected {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.method-icon {
  width: 40px;
  height: 40px;
  margin-bottom: 10px;
}

.method-name {
  color: #333;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding-top: 20px;
}

/* 折扣选择样式块已移除 */

@media (max-width: 768px) {
  .order-info {
    flex-direction: column;
    gap: 10px;
  }
  
  .order-info-grid {
    grid-template-columns: 1fr;
  }
  
  .payment-methods {
    flex-direction: column;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>
