import { ref, watch } from 'vue'
import * as AreaData from 'element-china-area-data'

// 可复用的地区解析与 AddressPicker 绑定组合式函数
export function useRegionPicker(customOptions) {
  // 统一地区数据源（默认使用 element-china-area-data 的 regionData）
  const regionOptions = customOptions || AreaData.regionData

  // 名称规整：去空白 + 去掉常见后缀 + 直辖市去“市”
  const normalizeName = (name) => {
    if (!name) return ''
    let s = String(name).replace(/\s+/g, '')

    // 1. 通用后缀
    s = s.replace(/(省|市|区|县|自治州|特别行政区|盟)$/u, '')

    // 2. 直辖市简称：2~3 个字且原结尾是“市” → 再去一次“市”
    if (/^[\u4e00-\u9fa5]{2,3}市$/.test(name)) {
      s = s.replace(/市$/, '')
    }
    return s
  }

  // -------------------------- 新增：递归查找地区节点 --------------------------
  /**
   * 递归查找地区节点（支持名称模糊匹配，兼容地图返回的名称格式）
   * @param {Array} nodes - 地区节点数组
   * @param {string} targetName - 目标名称（已规整）
   * @returns {Object|null} 匹配的节点（含code和children）
   */
  const findRegionNode = (nodes, targetName) => {
    if (!nodes || !targetName) return null

    for (const node of nodes) {
      const nodeName = normalizeName(node.name || node.label)
      // 模糊匹配（应对地图返回“北京市” vs 数据源“北京”的情况）
      if (nodeName.includes(targetName) || targetName.includes(nodeName)) {
        return node
      }
      // 递归查找子节点
      const childNode = findRegionNode(node.children, targetName)
      if (childNode) return childNode
    }
    return null
  }

  // -------------------------- 新增：从地图原始数据生成路径 --------------------------
  /**
   * 从地图原始数据（高德/百度）生成 AddressPicker 所需的 code 路径
   * @param {Object} rawAddress - 地图返回的原始地址数据（如你提供的 result）
   * @returns {Array} [省code, 市code, 区code]
   */
  const pathFromRawAddress = (rawAddress) => {
    const path = []
    if (!rawAddress?.addressComponent) return path

    const { nation, province, city, district, county } = rawAddress.addressComponent
    // 兼容不同地图字段（有的用 district，有的用 county）
    const areaName = district || county || ''

    // 1. 规整省/市/区名称（统一格式，方便匹配）
    const normalizedProvince = normalizeName(province || nation) // 直辖市可能 province 为“北京市”，nation 为“中国”
    const normalizedCity = normalizeName(city || normalizedProvince) // 直辖市的 city 可能为空，复用 province
    const normalizedArea = normalizeName(areaName)

    // 2. 查找省节点
    const provinceNode = findRegionNode(regionOptions, normalizedProvince)
    if (!provinceNode) return path
    path.push(provinceNode.code ?? provinceNode.value)

    // 3. 查找市节点（直辖市的市节点是省的子节点，名称和省一致）
    const cityNodes = provinceNode.children || []
    const cityNode = findRegionNode(cityNodes, normalizedCity)
    if (cityNode) {
      path.push(cityNode.code ?? cityNode.value)

      // 4. 查找区/县节点
      const areaNodes = cityNode.children || []
      const areaNode = findRegionNode(areaNodes, normalizedArea)
      if (areaNode) {
        path.push(areaNode.code ?? areaNode.value)
      }
    }

    return path
  }

  // 通过代码路径获取中文标签数组 [省, 市, 区]
  const labelsFromPath = (path) => {
    const res = []
    let nodes = regionOptions || []
    for (let i = 0; i < (path?.length || 0); i++) {
      const code = path[i]
      const node = nodes.find(n => (n.code ?? n.value) === code)
      if (!node) break
      res.push(node.name ?? node.label ?? '')
      nodes = node.children || []
    }
    return res
  }

  // 根据中文名称匹配出地区代码路径（[省code, 市code, 区code]）
  const pathFromLabels = ({ province, city, district }) => {
    const res = [];
    if (!province) return res;

    // 优化：使用 normalizeName 规整后匹配，提高兼容性
    const normalizedProvince = normalizeName(province)
    const pNode = (regionOptions || []).find(p => 
      normalizeName(p.label || p.name) === normalizedProvince
    );

    if (pNode) {
      res.push(pNode.code ?? pNode.value); // 修复：之前错误地 push 了名称，应该 push code
      const cNodes = pNode.children || [];
      const normalizedCity = normalizeName(city || province) // 兼容直辖市
      let cNode = cNodes.find(c => 
        normalizeName(c.label || c.name) === normalizedCity
      );

      // 兼容直辖市（子节点名称和省一致）
      if (!cNode && cNodes.length > 0) {
        cNode = cNodes.find(c => normalizeName(c.label || c.name) === normalizedProvince)
      }
      
      if (cNode) {
        res.push(cNode.code ?? cNode.value); // 修复：同上，push code 而非名称
        const dNodes = cNode.children || [];
        const normalizedDistrict = normalizeName(district)
        const dNode = dNodes.find(d => 
          normalizeName(d.label || d.name) === normalizedDistrict
        );
        if (dNode) {
          res.push(dNode.code ?? dNode.value); // 修复：同上
        }
      }
    }
    return res
  }

  // 创建 AddressPicker 的响应式对象（支持从原始地址初始化）
  const createAddressPicker = (initial = {}) => {
    let path = []
    // 支持两种初始化方式：1. 传入 {province, city, district} 2. 传入 rawAddress（地图原始数据）
    if (initial.rawAddress) {
      path = pathFromRawAddress(initial.rawAddress)
    } else if (initial.province || initial.city || initial.district) {
      path = pathFromLabels(initial)
    }

    const selected = ref(path)

    const onAreaChange = (newVal) => {
      selected.value = newVal
    }

    const getAddress = () => {
      const labels = labelsFromPath(selected.value || [])
      return {
        province: labels[0] || '',
        city: labels[1] || '',
        district: labels[2] || '',
        codePath: selected.value || [] // 暴露 code 路径，方便后续使用
      }
    }

    return {
      selected,
      onAreaChange,
      getAddress
    }
  }

  // 新增：从原始地址生成表单数据（直接绑定到表单）
  const formFromRawAddress = (rawAddress, fieldMapping = {}) => {
    const path = pathFromRawAddress(rawAddress)
    const [province, city, district] = labelsFromPath(path)
    const { formatted_address, location = {} } = rawAddress || {}
    const detailAddress = formatted_address 
      ? formatted_address.replace(`${province}${city}${district}`, '').trim() // 去除省市区前缀，保留详细地址
      : rawAddress?.addressComponent?.address || ''

    return {
      [fieldMapping.region || 'region']: path,
      [fieldMapping.detailAddress || 'detailAddress']: detailAddress,
      [fieldMapping.province || 'province']: province,
      [fieldMapping.city || 'city']: city,
      [fieldMapping.district || 'district']: district,
      [fieldMapping.lat || 'lat']: location.lat ?? null,
      [fieldMapping.lng || 'lng']: location.lon ?? null,
      [fieldMapping.formattedAddress || 'formattedAddress']: formatted_address || ''
    }
  }

  // 原有方法保持不变（bindPickerToForm、toAddressPayload）
  const bindPickerToForm = (addressPicker, addressForm, fieldMapping = {}) => {
    const regionField = fieldMapping.region || 'region'
    const detailAddressField = fieldMapping.detailAddress || 'detailAddress'
    const latField = fieldMapping.lat || 'lat'
    const lngField = fieldMapping.lng || 'lng'

    // 初始化表单值
    const initialAddress = addressPicker.getAddress()
    addressForm[regionField] = initialAddress.codePath
    addressForm[detailAddressField] = addressForm[detailAddressField] || ''
    addressForm[latField] = addressForm[latField] ?? null
    addressForm[lngField] = addressForm[lngField] ?? null

    // 监听Picker变化，同步到表单
    watch(addressPicker.selected, (newCodePath) => {
      const [province, city, district] = labelsFromPath(newCodePath)
      addressForm[regionField] = newCodePath
      addressForm[fieldMapping.province || 'province'] = province
      addressForm[fieldMapping.city || 'city'] = city
      addressForm[fieldMapping.district || 'district'] = district
    }, { deep: true })
  }

  const toAddressPayload = (form, fieldMapping = {}) => {
    const regionField = fieldMapping.region || 'region'
    const detailAddressField = fieldMapping.detailAddress || 'detailAddress'

    const regionLabels = labelsFromPath(form[regionField] || [])

    return {
      ...form,
      [fieldMapping.province || 'province']: regionLabels[0] || '',
      [fieldMapping.city || 'city']: regionLabels[1] || '',
      [fieldMapping.district || 'district']: regionLabels[2] || '',
      [fieldMapping.addressDetailed || 'addressDetailed']: form[detailAddressField] || ''
    }
  }

  return {
    regionOptions,
    normalizeName,
    labelsFromPath,
    pathFromLabels,
    pathFromRawAddress, // 暴露：从原始地址生成code路径
    formFromRawAddress, // 暴露：从原始地址生成表单数据
    createAddressPicker,
    bindPickerToForm,
    toAddressPayload
  }
}