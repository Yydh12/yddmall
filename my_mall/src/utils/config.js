// src/utils/config.js
import { getMapConfig } from '@/api/config'

export class ConfigManager {
  static mapConfig = null
  static isLoading = false
  static loadPromise = null

  // 默认配置作为静态属性
  static defaultConfig = {
    TDT_BROWSER_KEY: '0e49bcbfd2a87d8226f4fa0e99c52e52',
    DEFAULT_CENTER: [39.9042, 116.4074],
    MAP_ZOOM_LEVEL: 13,
    TDT_BASE_URL: 'https://api.tianditu.gov.cn'
  }

  /**
   * 加载地图配置
   * @returns {Promise<Object>} 地图配置对象
   */
  static async loadMapConfig() {
    // 如果已有配置，直接返回
    if (this.mapConfig) {
      return this.mapConfig
    }

    // 如果正在加载中，返回现有的 Promise
    if (this.isLoading) {
      return this.loadPromise
    }

    this.isLoading = true
    this.loadPromise = this._loadConfig()
    
    try {
      const config = await this.loadPromise
      return config
    } finally {
      this.isLoading = false
    }
  }

  /**
   * 实际加载配置的逻辑
   * @returns {Promise<Object>} 配置对象
   */
  static async _loadConfig() {
    try {
      // 尝试从后端获取配置
      const response = await getMapConfig()
      console.log('后端配置响应:', response)
      
      if (response?.data) {
        this.mapConfig = this._mergeConfig(response.data)
        console.log('成功加载地图配置:', this.mapConfig)
        return this.mapConfig
      } else {
        throw new Error('响应数据为空或格式不正确')
      }
    } catch (error) {
      // 失败时使用默认配置
      console.warn('无法从后端获取配置，使用默认配置:', error.message)
      return this._useFallbackConfig()
    }
  }

  /**
   * 合并后端配置和默认配置
   * @param {Object} backendConfig 后端返回的配置
   * @returns {Object} 合并后的配置
   */
  static _mergeConfig(backendConfig) {
    return {
      TDT_BROWSER_KEY: backendConfig.tiandituBrowserKey || this.defaultConfig.TDT_BROWSER_KEY,
      DEFAULT_CENTER: backendConfig.defaultCenter || this.defaultConfig.DEFAULT_CENTER,
      MAP_ZOOM_LEVEL: backendConfig.defaultZoom || this.defaultConfig.MAP_ZOOM_LEVEL,
      TDT_BASE_URL: backendConfig.tiandituBaseUrl || this.defaultConfig.TDT_BASE_URL,
      // 保留后端返回的原始数据，便于扩展
      _raw: backendConfig
    }
  }

  /**
   * 使用降级配置
   * @returns {Object} 配置对象
   */
  static _useFallbackConfig() {
    this.mapConfig = {
      ...this.defaultConfig,
      // 环境变量优先级高于默认值
      TDT_BROWSER_KEY: import.meta.env.VITE_TIANDITU_BROWSER_KEY || this.defaultConfig.TDT_BROWSER_KEY,
      _source: 'fallback'
    }
    return this.mapConfig
  }

  /**
   * 获取当前配置（如果未加载则抛出错误）
   * @returns {Object} 地图配置对象
   */
  static getConfig() {
    if (!this.mapConfig) {
      throw new Error('配置未加载，请先调用 loadMapConfig()')
    }
    return this.mapConfig
  }

  /**
   * 清除缓存，强制重新加载
   */
  static clearCache() {
    this.mapConfig = null
    this.loadPromise = null
    this.isLoading = false
  }

  /**
   * 检查配置是否已加载
   * @returns {boolean}
   */
  static isLoaded() {
    return this.mapConfig !== null
  }
}

// 导出默认实例以便直接使用
export default ConfigManager