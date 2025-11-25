<template>
  <Navbar />
  <div 
    v-if="userData && !loading && !error" 
    class="user-info-container"
  >
    <!-- 头像与基础信息区 -->
    <div class="avatar-section">
      <div class="left-content">
        <div class="avatar-container">
          <img 
            :src="userData.avatar || defaultAvatar" 
            alt="用户头像" 
            class="avatar-img"
            loading="lazy"
          >
          <!-- 头像外围实线方框（确保显示） -->
          <div class="avatar-solid-square"></div>
        </div>
        <div class="user-basic-info">
          <div class="basic-info-header">
            <h2 class="username">{{ userData.username }}</h2>
            <span :class="['status-badge', userData.status === 1 ? 'status-active' : 'status-inactive']">
              {{ userData.status === 1 ? '正常' : '停用' }}
            </span>
          </div>
          <div class="info-tags">
            <div class="merchant-tag" v-if="userData.userNo">UID: {{ userData.userNo}}</div>
            <div class="merchant-tag" v-if="userData.merchantId">MID: {{ userData.merchantId }}</div>
            <div class="merchant-tag" v-if="userData.realName">实名: {{ userData.realName || '未设置' }}</div>
            <div class="merchant-tag" v-if="userData.phone">手机号: {{ userData.phone || '未设置' }}</div>
            <div class="merchant-tag" v-if="userData.email">电子邮箱: {{ userData.email || '未设置' }}</div>
            <div class="merchant-tag" v-if="userData.gender">性别: {{ genderMap[userData.gender] || '未知' }}</div>
          </div>
        </div>
      </div>
      <div class="right-content">
        <slot name="address-management"></slot>
      </div>
    </div>
    <!-- 编辑按钮与备注区 -->
    <div class="action-section">
      <button class="edit-btn" @click="$emit('open-edit-modal')">编辑资料</button>
      <div class="remark-item">
        <label class="info-label">个人介绍</label>
        <span class="info-value">{{ userData.remark || '无' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import Navbar from '../../components/Home/Navbar.vue';

// 仅声明组件需要的 props
defineProps({
  userData: Object,
  loading: Boolean,
  error: Boolean,
  defaultAvatar: String,
  genderMap: Object,
});

const emit = defineEmits(['open-edit-modal']);
</script>

<style scoped>
/* 容器整体样式 */
.user-info-container {
  width: 80%;
  margin: 0 auto;
  padding: 1.5rem 0;
  position: relative;
  background: transparent;
}

/* 顶部渐变背景 */
.user-info-container::before {
  z-index: 0;
  content: '';
  position: absolute;
  top: 0;
  left: -10%;
  right: -10%;
  height: 350px;
  background: linear-gradient(180deg, rgba(255, 224, 178, 0.2), rgba(251, 191, 36, 0));
}

/* 内容区层级 */
.avatar-section, .action-section {
  position: relative;
}

/* 头像区域 */
.avatar-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.left-content {
  display: flex;
  align-items: center;
  gap: 1.8rem;
  flex: 1;
}

.right-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* 头像容器 - 关键：不设overflow:hidden，避免方框被裁剪 */
.avatar-container {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  border-radius: 50%; /* 头像仍为圆形 */
  /* 移除overflow:hidden，确保方框能显示在容器外 */
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%; /* 确保头像圆形 */
  border: none;
}

/* 头像外围实线方框（核心修复：确保显示） */
.avatar-solid-square {
  position: absolute;
  top: -5px; /* 向外偏移，完全露出 */
  left: -5px;
  width: calc(100% + 10px); /* 宽度 = 头像宽度 + 左右偏移量 */
  height: calc(100% + 10px); /* 高度 = 头像高度 + 上下偏移量 */
  border: 1px solid #d97c7c; /* 加粗边框，增强可见性 */
  z-index: 2; /* 层级高于头像，确保不被遮挡 */
  box-sizing: border-box;
  pointer-events: none; /* 不影响头像交互 */
  animation: rotate 15s linear infinite; /* 旋转动画：10秒一圈，匀速循环 */
  transform-origin: center; /* 动画原点：方框中心（默认就是，但显式声明更稳妥） */
}

/* 新增动画关键帧 */
@keyframes rotate {
  from { transform: rotate(0deg); } /* 起始角度：0度 */
  to { transform: rotate(360deg); } /* 结束角度：360度（一圈） */
}

/* 基础信息样式 */
.user-basic-info {
  flex: 1;
  min-width: 200px;
}

.basic-info-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.9rem;
  flex-wrap: wrap;
}

.username {
  margin: 0;
  font-size: 1.8rem;
  color: #1e293b;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

/* 状态徽章 */
.status-badge {
  padding: 0.3rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s ease;
}

.status-badge::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-active {
  background-color: #e6fffa;
  color: #0d9488;
}

.status-active::before {
  background-color: #4ade80;
}

.status-inactive {
  background-color: #fff5f5;
  color: #e53e3e;
}

.status-inactive::before {
  background-color: #f87171;
}

/* 信息标签组 */
.info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.merchant-tag {
  display: inline-flex;
  padding: 0.3rem 1rem;
  background-color: #f0f9ff;
  color: #2563eb;
  border-radius: 18px;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(66, 153, 225, 0.1);
  transition: all 0.2s ease;
}

.merchant-tag:hover {
  background-color: #e0f2fe;
  transform: translateY(-1px);
}

/* 操作区域 */
.action-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.edit-btn {
  padding: 0.6rem 1.2rem;
  background-color: #4299e1;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn:hover {
  background-color: #3182ce;
  transform: translateY(-1px);
}

/* 备注项 */
.remark-item {
  flex: 1;
  min-width: 200px;
  padding: 0.6rem 1rem;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.info-label {
  display: block;
  color: #64748b;
  margin-bottom: 0.3rem;
  font-size: 0.95rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.info-value {
  color: #1e293b;
  font-size: 1.1rem;
  line-height: 1.5;
  word-break: break-all;
}
</style>