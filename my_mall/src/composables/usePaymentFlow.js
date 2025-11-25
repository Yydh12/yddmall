// src/composables/usePaymentFlow.js
import { ElMessage } from 'element-plus'
import { createOrder, createDirectOrder, payOrder, getOrderDetail } from '@/api/order'
import { applyOrderDiscount, claimRedPacket, listMyRedPacketsFiltered, getOrderDiscountDetail } from '@/api/discount'

export function usePaymentFlow() {
  // 前端支付方式 -> 后端枚举映射
  const payTypeMap = { wechat: 2, alipay: 1, bank: 3 }

  // 可选：提交前尝试领取红包，避免未拥有导致应用失败
  const ensureOwnRedPacket = async (redPacketId) => {
    if (!redPacketId) return { ok: true, normalizedRedPacketId: null }
    try {
      const mine = await listMyRedPacketsFiltered({ status: 0 })
      const myRaw = Array.isArray(mine?.data) ? mine.data : []
      // 建立映射：用户红包记录ID -> 商家红包ID（后端所需）
      const userToRpId = new Map()
      const myRpIdSet = new Set()
      for (const r of myRaw) {
        const rpId = r?.redPacketId ?? r?.packetId ?? null
        const userRecId = r?.id ?? null
        if (userRecId != null && rpId != null) userToRpId.set(userRecId, rpId)
        if (rpId != null) myRpIdSet.add(rpId)
      }
      const normalized = userToRpId.has(redPacketId)
        ? (userToRpId.get(redPacketId) ?? redPacketId)
        : redPacketId

      // 若当前用户未拥有该商家红包ID，则尝试领取（不阻断流程）
      if (!myRpIdSet.has(normalized)) {
        try {
          await claimRedPacket(normalized)
          return { ok: true, claimed: true, normalizedRedPacketId: normalized }
        } catch (e) {
          // 领取失败不阻断下单，由后端校验折扣条件
          return { ok: false, error: e, normalizedRedPacketId: normalized }
        }
      }
      return { ok: true, normalizedRedPacketId: normalized }
    } catch (e) {
      return { ok: false, error: e, normalizedRedPacketId: redPacketId }
    }
  }

  // 创建订单并应用优惠
  const createOrderAndApplyDiscount = async ({
    isBuyNow,
    addressId,
    buyerMessage,
    couponId,
    redPacketId,
    coinsUsed = 0,
    cartItems = [],
    cartItemIds = []
  }) => {
    if (!addressId) throw new Error('缺少收货地址')

    // 尝试领取红包（如果未拥有）
    const rpEnsure = await ensureOwnRedPacket(redPacketId)
    const normalizedRedPacketId = rpEnsure?.normalizedRedPacketId ?? redPacketId

    const baseData = {
      addressId,
      buyerMessage,
      couponId,
      redPacketId,
      coinsUsed: coinsUsed || 0,
    }

    const payload = isBuyNow
      ? {
          ...baseData,
          orderItems: cartItems.map(item => ({
            itemId: item.itemId,
            skuId: item.skuId,
            quantity: item.quantity,
            price: item.price,
            productName: item.productName || '未知商品',
            skuName: item.skuName || '默认规格',
            productImage: item.productImage || ''
          }))
        }
      : {
          ...baseData,
          cartItemIds: cartItemIds.length ? cartItemIds : cartItems.map(item => item.cartId)
        }

    const resp = isBuyNow ? await createDirectOrder(payload) : await createOrder(payload)
    if (!(resp?.code === 200 || resp?.code === 0)) {
      const msg = resp?.msg || '订单创建失败'
      throw new Error(msg)
    }

    const orderNo = resp?.data?.orderNo
    let discountApplied = null
    try {
      if (orderNo && (couponId || redPacketId || (coinsUsed || 0) > 0)) {
        const discountPayload = { orderNo }
        if (couponId) discountPayload.couponId = couponId
        if (normalizedRedPacketId) discountPayload.redPacketId = normalizedRedPacketId
        if ((coinsUsed || 0) > 0) discountPayload.coinAmount = coinsUsed || 0
        const applyResp = await applyOrderDiscount(discountPayload)
        if (applyResp?.code === 200 || applyResp?.code === 0) {
          discountApplied = applyResp?.data || null
        } else {
          ElMessage?.warning?.(applyResp?.msg || '优惠应用失败，订单将按原价计算')
        }
      }
    } catch (e) {
      ElMessage?.warning?.('优惠应用异常，订单将按原价计算')
    }

    return { orderNo, discountApplied }
  }

  // 拉取订单详情（确认页）并附加优惠明细（可选）
  const fetchOrderForConfirm = async (orderNo) => {
    const resp = await getOrderDetail(orderNo)
    let discountDetail = null
    try {
      const d = await getOrderDiscountDetail(orderNo)
      if (d?.code === 200 || d?.code === 0) discountDetail = d?.data || null
    } catch {}
    return { order: resp?.data || {}, discountDetail }
  }

  // 发起支付
  const initiatePayment = async (orderNo, method = 'wechat') => {
    const payType = payTypeMap[method] ?? 2
    return payOrder(orderNo, payType)
  }

  return {
    payTypeMap,
    createOrderAndApplyDiscount,
    fetchOrderForConfirm,
    initiatePayment
  }
}