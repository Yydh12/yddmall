// src/api/config.js
import request from '@/utils/request'

// 获取地图配置
export function getMapConfig() {
  return request({
    url: '/config/map', // 注意这里去掉了 /api 前缀，因为你的后端是 @RequestMapping("/config")
    method: 'get'
  })
}

// 获取地理编码配置
export function getGeocodeConfig() {
  return request({
    url: '/config/geocode',
    method: 'get'
  })
}