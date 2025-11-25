// @/api/order.js
import request from '@/utils/request';

/**
 * 获取订单列表
 * @param {Object} params - 查询参数
 * @param {string} params.orderNo - 订单编号
 * @param {number} params.status - 订单状态
 * @param {string} params.startTime - 开始时间
 * @param {string} params.endTime - 结束时间
 * @param {number} params.current - 页码（MyBatis-Plus）
 * @param {number} params.size - 每页数量（MyBatis-Plus）
 * @returns {Promise}
 */
export function getOrderList(params) {
  return request({
    url: '/order/list',
    method: 'get',
    params
  });
}

/**
 * 根据状态获取订单列表
 * @param {number} status - 订单状态
 * @returns {Promise}
 */
export function getOrdersByStatus(status) {
  return request({
    url: `/order/list/${status}`,
    method: 'get'
  });
}

/**
 * 获取订单统计信息
 * @returns {Promise}
 */
export function getOrderStatistics() {
  return request({
    url: '/order/statistics',
    method: 'get'
  });
}

/**
 * 获取订单详情
 * @param {number} id - 订单ID
 * @returns {Promise}
 */
export function getOrderDetail(id) {
  return request({
    url: `/order/detail/${id}`,
    method: 'get'
  });
}

/**
 * 取消订单
 * @param {number} id - 订单ID
 * @returns {Promise}
 */
export function cancelOrder(id) {
  return request({
    url: `/order/cancel/${id}`, 
    method: 'post'
  });
}

/**
 * 订单发货
 * @param {Object} data - 发货信息
 * @param {number} data.orderId - 订单ID
 * @param {string} data.logisticsCompany - 物流公司
 * @param {string} data.logisticsNo - 物流单号
 * @returns {Promise}
 */
export function shipOrder(data) {
  return request({
    url: '/order/ship',
    method: 'post',
    data
  });
}

/**
 * 创建订单（购物车）
 * @param {Object} data - 订单数据
 * @param {number} data.addressId - 收货地址ID
 * @param {number} [data.payType] - 支付方式 (1:支付宝, 2:微信, 3:银行卡)
 * @param {string} [data.buyerMessage] - 买家留言
 * @param {Array<number>} data.cartItemIds - 购物车项主键ID列表
 * @returns {Promise}
 */
export function createOrder(data) {
  return request({
    url: '/order/create',
    method: 'post',
    data
  });
}

/**
 * 创建订单（直接购买）
 * @param {Object} data - 订单数据
 * @param {number} data.addressId - 收货地址ID
 * @param {number} data.payType - 支付方式 (1:在线支付, 2:货到付款)
 * @param {string} data.buyerMessage - 买家留言
 * @param {Array} data.orderItems - 订单商品列表
 * @returns {Promise}
 */
export function createDirectOrder(data) {
  return request({
    url: '/order/createDirect',
    method: 'post',
    data
  });
}

/**
 * 订单支付
 * @param {string} orderNo - 订单编号
 * @returns {Promise}
 */
export function payOrder(orderNo, payType) {
  return request({
    url: `/order/pay/${orderNo}`,
    method: 'post',
    params: payType != null ? { payType } : undefined
  });
}

/**
 * 确认收货
 * @param {string} orderNo - 订单编号
 * @returns {Promise}
 */
export function confirmReceipt(orderNo) {
  return request({
    url: `/order/confirm/${orderNo}`,
    method: 'post'
  });
}

/**
 * 申请退款（未发货订单）
 * @param {string} orderNo - 订单编号
 * @returns {Promise}
 */
export function applyRefund(orderNo) {
  return request({
    url: `/order/refund/apply/${orderNo}`,
    method: 'post'
  });
}

/**
 * 商家同意退款（申请中 -> 已取消）
 * @param {string} orderNo - 订单编号
 * @returns {Promise}
 */
export function approveRefund(orderNo) {
  return request({
    url: `/order/refund/approve/${orderNo}`,
    method: 'post'
  });
}

/**
 * 商家拒绝退款（申请中 -> 已支付）
 * @param {string} orderNo - 订单编号
 * @returns {Promise}
 */
export function rejectRefund(orderNo) {
  return request({
    url: `/order/refund/reject/${orderNo}`,
    method: 'post'
  });
}

/**
 * 删除订单（仅允许已取消的订单）
 * @param {string} orderNo - 订单编号
 * @returns {Promise}
 */
export function deleteOrder(orderNo) {
  return request({
    url: `/order/delete/${orderNo}`,
    method: 'post'
  });
}