// @/api/address.js
import request from '@/utils/request';

/**
 * 获取用户地址列表
 * @returns {Promise}
 */
export function getAddresses() {
  return request({
    url: '/address/list',
    method: 'get'
  });
}

/**
 * 添加新地址
 * @param {Object} data - 地址信息
 * @param {string} data.receiverName - 收货人姓名
 * @param {string} data.receiverPhone - 收货人手机号
 * @param {string} data.province - 省份
 * @param {string} data.city - 城市
 * @param {string} data.district - 区县
 * @param {string} data.detailAddress - 详细地址
 * @param {string} data.postalCode - 邮政编码
 * @param {number} data.isDefault - 是否默认地址 (1: 是, 0: 否)
 * @returns {Promise}
 */
export function addAddress(data) {
  return request({
    url: '/address/add',
    method: 'post',
    data
  });
}

/**
 * 设置默认地址
 * @param {number} addressId - 地址ID
 * @returns {Promise}
 */
export function setDefaultAddress(addressId) {
  return request({
    url: `/address/default/${addressId}`,
    method: 'post'
  });
}

/**
 * 更新地址信息
 * @param {number} addressId - 地址ID
 * @param {Object} data - 更新的地址信息
 * @returns {Promise}
 */
export function updateAddress(addressId, data) {
  return request({
    url: `/address/update/${addressId}`,
    method: 'put',
    data
  });
}

/**
 * 删除地址
 * @param {number} addressId - 地址ID
 * @returns {Promise}
 */
export function deleteAddress(addressId) {
  return request({
    url: `/address/delete/${addressId}`,
    method: 'delete'
  });
}