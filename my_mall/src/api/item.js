// src/api/item.js
import request from '@/utils/request'

// 获取商品详情（包含 sellerId/merchantId 等）
export function getItem(id) {
  return request({ url: `/item/${id}` , method: 'get' })
}