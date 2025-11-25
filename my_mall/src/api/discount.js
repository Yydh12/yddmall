import request from '../utils/request.js'

// Coupon APIs
export function listAvailableCoupons(params = {}) {
  return request({ url: '/coupon/available', method: 'get', params })
}

export function claimCoupon(couponId) {
  return request({ url: `/coupon/claim/${couponId}`, method: 'post' })
}

// 用户已领取的优惠券（未使用/已使用均返回，由前端自行筛选）
export function listMyCoupons() {
  return request({ url: '/coupon/mine', method: 'get' })
}

// 筛选我的优惠券（可选传入 status=0 仅未使用）
export function listMyCouponsFiltered({ status, orderNo } = {}) {
  const params = {}
  if (status != null) params.status = status
  if (orderNo) params.orderNo = orderNo
  return request({ url: '/coupon/mine', method: 'get', params })
}

// RedPacket APIs
export function listAvailableRedPackets(params = {}) {
  return request({ url: '/redPacket/available', method: 'get', params })
}

export function claimRedPacket(id) {
  return request({ url: `/redPacket/claim/${id}`, method: 'post' })
}

// 用户已领取的红包（未使用/已使用均返回，由前端自行筛选）
export function listMyRedPackets() {
  return request({ url: '/redPacket/mine', method: 'get' })
}

// Admin/Merchant publish APIs
export function createCoupon(data) {
  return request({ url: '/coupon/create', method: 'post', data })
}

export function createRedPacket(data) {
  return request({ url: '/redPacket/create', method: 'post', data })
}

// 筛选我的红包（可选传入 status=0 仅未使用）
export function listMyRedPacketsFiltered({ status, orderNo } = {}) {
  const params = {}
  if (status != null) params.status = status
  if (orderNo) params.orderNo = orderNo
  return request({ url: '/redPacket/mine', method: 'get', params })
}

// Coin wallet APIs
export function getCoinWallet() {
  return request({ url: '/coin/wallet', method: 'get' })
}

export function dailySignIn(coins = 10) {
  return request({ url: `/coin/signin?coins=${coins}`, method: 'post' })
}

// Apply discounts to an order
export function applyOrderDiscount(payload) {
  return request({ url: '/order/discount/apply', method: 'post', data: payload })
}

// 订单已应用的优惠明细
export function getOrderDiscountDetail(orderNo) {
  return request({ url: `/order/discount/detail/${orderNo}` , method: 'get' })
}

// 用户优惠资产统计：优惠券数量、红包余额
export function getDiscountStats() {
  return request({ url: '/discount/stats', method: 'get' })
}

// Management APIs
// RedPacket management
export function listPublishedRedPackets(params = {}) {
  return request({ url: '/redPacket/published', method: 'get', params })
}
export function updateRedPacket(data) {
  return request({ url: '/redPacket/update', method: 'put', data })
}
export function enableRedPacket(id) {
  return request({ url: `/redPacket/enable/${id}`, method: 'post' })
}
export function disableRedPacket(id) {
  return request({ url: `/redPacket/disable/${id}`, method: 'post' })
}

// Coupon management (admin)
export function listAllCoupons() {
  return request({ url: '/coupon/all', method: 'get' })
}
export function updateCoupon(data) {
  return request({ url: '/coupon/update', method: 'put', data })
}
export function enableCoupon(id) {
  return request({ url: `/coupon/enable/${id}`, method: 'post' })
}
export function disableCoupon(id) {
  return request({ url: `/coupon/disable/${id}`, method: 'post' })
}