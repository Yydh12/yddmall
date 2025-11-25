<template>
  <div class="nav-links">
    <div class="left-links">
      <img src="@/assets/images/logo.png" alt="Logo" class="nav-logo" />
      <span class="merchant-center">商家后台</span>
      <span v-if="merchantNoDisplay" class="merchant-id">店铺编号：{{ merchantNoDisplay }}</span>
    </div>
    <div class="right-links">
      <template v-if="loggedInUsername">
        <div class="message-container" v-if="user.roleId !== 3">
            <i class="message-icon"></i>
            <span class="message-text">消息</span>
          </div>
          <img :src="avatarSrc" :alt="(merchant?.merchantName || '店铺') + '头像'" class="user-avatar"/>
        <div class="dropdown">
          <span class="dropdown-toggle">{{ loggedInUsername }} <i class="arrow-down"></i></span>
          <div class="dropdown-menu">
            <a href="/userInfo">个人中心</a>
            <a href="/merchantInfo">店铺信息</a>
            <a href="#" @click.prevent="logout">退出登录</a>
          </div>
        </div>
      </template>
      <template v-else>
        <!-- 如果未登录，显示登录/注册链接 -->
        <a href="/login">亲，请登录</a>
        <a href="/register">免费注册</a>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import avatar from '@/assets/images/avatar.png'
import axios from '../../axios'

// 1. 把用户信息先取出来
const user = JSON.parse(localStorage.getItem('user') || '{}')
const merchant = ref(null)
// 2. 用响应式变量保存商户信息与展示字段
const loggedInUsername = ref('')
const merchantNoDisplay = computed(() => merchant.value?.merchantNo || merchant.value?.merchantId || '')
const avatarSrc = computed(() => merchant.value?.merchantPic || avatar)

// 3. 异步获取商户信息，拿到结果后再赋值
if (user.userId) {
  axios.get(`/merchant/getMerchant/${user.merchantId}`)
       .then(res => {
         const m = res?.data?.data
         if (m) {
           merchant.value = m
            localStorage.setItem('merchant', JSON.stringify(merchant.value));
           loggedInUsername.value = m.merchantName || ''
         }
       })
       .catch(() => {
         loggedInUsername.value = '' // 失败时置空，避免一直显示旧值
       })
}

const logout = () => {
  localStorage.clear()
  loggedInUsername.value = ''
  merchant.value = {}
  window.location.replace('/login') // 直接跳登录页，比 reload 更干净
}
</script>

<style scoped>
.nav-links {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px; /* 调整上下边距为0，左右边距为20px */
  background-color: #f8f8f8; /* 轻微背景色 */
  border-bottom: 1px solid #eee; /* 底部边框 */
  width: 100%;
  box-sizing: border-box; /* 确保padding不会导致宽度溢出 */
  position: sticky;
  top: 0;
  z-index: 1000;
}

.left-links,
.right-links {
  display: flex;
  gap: 10px;
  align-items: center; /* 垂直居中对齐 */
  flex-wrap: nowrap; /* 防止链接换行 */
  margin-right: 50px;
}

.nav-logo {
  height: 54px;
}

.merchant-center {
  font-size: 16px;
  font-weight: bold;
}

.merchant-id {
  margin-left: 10px;
  font-size: 13px;
  color: #606266;
}

.nav-links a,
.right-links span {
  color: #333; /* 深色字体 */
  text-decoration: none;
  font-size: 14px; /* 放大字体大小 */
  white-space: nowrap; /* 防止文本换行 */
}

.nav-links a:hover {
  color: #ff0036; /* 悬停颜色 */
}

.user-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  margin-right: 5px;
  object-fit: cover;
}

.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-toggle {
  cursor: pointer;
}

.dropdown-menu {
  display: none;
  position: absolute;
  background-color: #f9f9f9;
  min-width: 120px;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
  z-index: 1;
  border-radius: 5px;
  overflow: hidden;
  right: 0;
  top: 100%; /* 定位在下拉菜单触发器的下方 */
}

.dropdown-menu a {
  color: black;
  padding: 12px 16px;
  text-decoration: none;
  display: block;
  font-size: 14px; /* 保持与导航栏其他字体大小一致 */
}

.dropdown-menu a:hover {
    background-color: #f1f1f1;
  }

  .arrow-down {
    display: inline-block;
    width: 0;
    height: 0;
    margin-left: 5px;
    vertical-align: middle;
    border-top: 4px solid #333;
    border-right: 4px solid transparent;
    border-left: 4px solid transparent;
  }

  .message-icon {
    width: 30px;
    height: 30px;
    background-color: #333;
    mask: url('/public/images/message_icon.svg') no-repeat center / contain;
    -webkit-mask: url('/public/images/message_icon.svg') no-repeat center / contain;
  }

  .message-container {
    width: 40px;
    height: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-right: 10px;
    cursor: pointer;
  }

  .message-text {
    font-size: 10px;
    color: #333;
    margin-top: 2px;
  }

.dropdown:hover .dropdown-menu {
  display: block;
}
</style>