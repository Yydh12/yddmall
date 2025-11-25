// src/api/merchant.js
import request from '@/utils/request'

// 获取商家详情（返回包含 merchantName 等）
export function getMerchant(id) {
  return request({ url: `/merchant/getMerchant/${id}` , method: 'get' })
}