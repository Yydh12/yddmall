<template>
  <div v-if="props.showModal" class="modal-backdrop" @click="$emit('handle-modal-close')">
    <div class="modal-container" @click.stop>
      <!-- 弹窗头部 -->
      <div class="modal-header">
        <div class="header-content">
          <div class="title-section">
            <h2 class="modal-title">编辑个人资料</h2>
            <p class="modal-subtitle">更新您的个人信息和头像</p>
          </div>
          <button class="close-btn" @click="$emit('handle-modal-close')" aria-label="关闭">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- 弹窗主体 -->
      <div class="modal-body">
        <div v-if="props.modalLoading" class="modal-loading">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>
        <template v-else>
          <!-- 头像上传区域 -->
          <div class="avatar-upload-section">
            <div class="avatar-container" :class="{ uploading: props.isUploading, error: props.avatarError }">
              <div class="avatar-wrapper">
                <img :src="props.formData.avatar || props.defaultAvatar" alt="用户头像" class="avatar-img" loading="lazy">
                <div class="avatar-overlay" :class="{ active: props.isUploading }">
                  <div class="overlay-content">
                    <svg v-if="!props.isUploading" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <span v-if="!props.isUploading">更换头像</span>
                    <span v-if="props.isUploading" class="uploading-text">上传中...</span>
                  </div>
                  <input type="file" class="avatar-input" accept="image/jpeg, image/png" @change="handleAvatarUpload">
                </div>
                <!-- 上传进度条 -->
                <div v-if="props.isUploading" class="upload-progress">
                  <div class="progress-bar" :style="{ width: props.uploadPercent + '%' }"></div>
                </div>
              </div>
              <!-- 错误提示 -->
              <p v-if="props.avatarError" class="avatar-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {{ props.avatarError }}
              </p>
            </div>
            <div class="avatar-info">
              <h3 class="avatar-title">个人头像</h3>
              <p class="avatar-tip">支持JPG/PNG格式，建议尺寸200x200，大小不超过2MB</p>
            </div>
          </div>

          <!-- 表单区域 -->
          <form class="profile-form" @submit.prevent="$emit('handle-submit')">
            <div class="form-grid">
              <!-- 用户名 -->
              <div class="form-group">
                <label class="form-label required">用户名</label>
                <div class="form-input-wrapper">
                  <input 
                    type="text" 
                    class="form-input" 
                    v-model="props.formData.username" 
                    placeholder="请输入用户名" 
                    maxlength="20"
                    :disabled="props.submitting"
                  >
                  <span class="input-counter">{{ props.formData.username.length }}/20</span>
                </div>
                <p class="form-hint">用户名长度不超过20字符，将用于账号登录</p>
              </div>

              <!-- 真实姓名 -->
              <div class="form-group">
                <label class="form-label required">真实姓名</label>
                <div class="form-input-wrapper">
                  <input 
                    type="text" 
                    class="form-input" 
                    v-model="props.formData.realName" 
                    placeholder="请输入真实姓名" 
                    maxlength="10"
                    :disabled="props.submitting"
                  >
                  <span class="input-counter">{{ props.formData.realName.length }}/10</span>
                </div>
              </div>

              <!-- 手机号 -->
              <div class="form-group">
                <label class="form-label required">手机号</label>
                <div class="form-input-wrapper">
                  <input 
                    type="tel" 
                    class="form-input" 
                    v-model="props.formData.phone" 
                    placeholder="请输入手机号" 
                    maxlength="11"
                    :disabled="props.submitting"
                  >
                  <span class="input-counter">{{ props.formData.phone.length }}/11</span>
                </div>
              </div>

              <!-- 电子邮箱 -->
              <div class="form-group">
                <label class="form-label">电子邮箱</label>
                <input 
                  type="email" 
                  class="form-input" 
                  v-model="props.formData.email" 
                  placeholder="请输入电子邮箱"
                  :disabled="props.submitting"
                >
                <p class="form-hint">用于接收账号通知和密码重置邮件</p>
              </div>

              <!-- 性别 -->
              <div class="form-group">
                <label class="form-label required">性别</label>
                <div class="radio-group">
                  <label class="radio-item" :class="{ disabled: props.submitting }">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="0" 
                      v-model="props.formData.gender"
                      :disabled="props.submitting"
                    >
                    <span class="radio-custom"></span>
                    <span class="radio-text">未知</span>
                  </label>
                  <label class="radio-item" :class="{ disabled: props.submitting }">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="1" 
                      v-model="props.formData.gender"
                      :disabled="props.submitting"
                    >
                    <span class="radio-custom"></span>
                    <span class="radio-text">男</span>
                  </label>
                  <label class="radio-item" :class="{ disabled: props.submitting }">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="2" 
                      v-model="props.formData.gender"
                      :disabled="props.submitting"
                    >
                    <span class="radio-custom"></span>
                    <span class="radio-text">女</span>
                  </label>
                </div>
              </div>

              <!-- 备注 -->
              <div class="form-group full-width">
                <label class="form-label">备注</label>
                <div class="form-input-wrapper">
                  <textarea 
                    class="form-textarea" 
                    v-model="props.formData.remark" 
                    placeholder="请输入备注信息" 
                    rows="3" 
                    maxlength="100"
                    :disabled="props.submitting"
                  ></textarea>
                  <span class="input-counter">{{ props.formData.remark.length }}/100</span>
                </div>
              </div>
            </div>

            <!-- 不可编辑信息 -->
            <div class="readonly-info">
              <div class="info-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <p class="info-title">不可编辑信息</p>
              </div>
              <div class="info-list">
                <div class="info-item">
                  <label>用户ID</label>
                  <span>{{ props.formData.userId }}</span>
                </div>
                <div class="info-item">
                  <label>商户ID</label>
                  <span>{{ props.formData.merchantId || '无' }}</span>
                </div>
                <div class="info-item">
                  <label>账号角色</label>
                  <span>{{ props.roleMap[props.formData.roleId] }}</span>
                </div>
              </div>
            </div>
          </form>
        </template>
      </div>

      <!-- 弹窗底部 -->
      <div class="modal-footer">
        <button class="cancel-btn" @click="$emit('handle-modal-close')"  :disabled="props.submitting || props.isUploading">
          取消
        </button>
        <button 
          class="submit-btn" 
          @click="$emit('handle-submit')" 
          :disabled="props.submitting || props.isUploading"
        >
          <span v-if="props.submitting" class="loading-spinner"></span>
          {{ props.submitting ? '保存中...' : '保存更改' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

// 定义props，包含所有传递的状态和事件函数
const props = defineProps({
  showModal: Boolean,
  modalLoading: Boolean,
  submitting: Boolean,
  formData: Object,
  avatarError: String,
  isUploading: Boolean,
  uploadPercent: Number,
  roleMap: Object,
  defaultAvatar: String,
});

// 声明需要触发的事件
const emit = defineEmits([
  'handle-modal-close', 
  'handle-submit', 
  'handle-avatar-upload'
]);

// 头像上传事件也改为 emit 触发
const handleAvatarUpload = (e) => {
  emit('handle-avatar-upload', e);
};
</script>

<style scoped>
/* 弹窗背景 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
  backdrop-filter: blur(4px);
  padding: 1rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 弹窗容器 */
.modal-container {
  width: 100%;
  max-width: 800px;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  transform: translateY(20px);
  animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes modalSlideUp {
  to { transform: translateY(0); }
}

/* 弹窗头部 */
.modal-header {
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  color: white;
  padding: 0;
  border-bottom: none;
}

.header-content {
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.title-section {
  flex: 1;
}

.modal-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
}

.modal-subtitle {
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.9;
  font-weight: 400;
}

.close-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition: all 0.2s ease;
  padding: 0;
  flex-shrink: 0;
  margin-left: 1rem;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: rotate(90deg);
}

/* 弹窗主体 */
.modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
  scrollbar-width: thin;
  scrollbar-color: #6366F1 #f5f5f5;
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.modal-body::-webkit-scrollbar-thumb {
  background-color: #6366F1;
  border-radius: 3px;
}

/* 加载状态 */
.modal-loading {
  text-align: center;
  padding: 3rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(99, 102, 241, 0.2);
  border-radius: 50%;
  border-top-color: #6366F1;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 头像上传区域 */
.avatar-upload-section {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 2rem;
}

.avatar-container {
  position: relative;
  flex-shrink: 0;
}

.avatar-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avatar-container.error .avatar-wrapper {
  box-shadow: 0 0 0 2px #EF4444;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #ffffff;
  transition: all 0.3s ease;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(99, 102, 241, 0.8), rgba(139, 92, 246, 0.8));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.85rem;
  opacity: 0;
  transition: all 0.3s ease;
  cursor: pointer;
  backdrop-filter: blur(1px);
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay.active {
  opacity: 1;
  background: rgba(0, 0, 0, 0.7);
}

.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

.uploading-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.avatar-input {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 10;
}

.upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 0 0 50% 50%;
  overflow: hidden;
  z-index: 10;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%);
  transition: width 0.3s ease-in-out;
}

.avatar-error {
  position: absolute;
  bottom: -28px;
  left: 50%;
  transform: translateX(-50%);
  color: #EF4444;
  font-size: 0.8rem;
  margin: 0;
  white-space: nowrap;
  background-color: #FEF2F2;
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.avatar-info {
  flex: 1;
}

.avatar-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1F2937;
}

.avatar-tip {
  color: #6B7280;
  font-size: 0.85rem;
  margin: 0;
  line-height: 1.4;
}

/* 表单样式 */
.profile-form {
  width: 100%;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem 2rem;
  margin-bottom: 2rem;
}


@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 0.9rem;
  color: #374151;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.form-label.required::after {
  content: '*';
  color: #EF4444;
  margin-left: 0.2rem;
}

.form-input-wrapper {
  position: relative;
}

.form-input {
  width: 90%;
  padding: 0.85rem 1.1rem;
  border: 1px solid #D1D5DB;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  line-height: 1.4;
  background-color: #ffffff;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-input:disabled {
  background-color: #F9FAFB;
  color: #9CA3AF;
  cursor: not-allowed;
  border-color: #E5E7EB;
}

.form-textarea {
  width: 97%;
  padding: 0.85rem 1.1rem;
  border: 1px solid #D1D5DB;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  line-height: 1.6;
  resize: vertical;
  background-color: #ffffff;
  font-family: inherit;
}

.form-textarea:focus {
  outline: none;
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-textarea:disabled {
  background-color: #F9FAFB;
  color: #9CA3AF;
  cursor: not-allowed;
  border-color: #E5E7EB;
}

.input-counter {
  position: absolute;
  right: 1rem;
  bottom: 0.85rem;
  color: #9CA3AF;
  font-size: 0.8rem;
  pointer-events: none;
}

.form-hint {
  font-size: 0.8rem;
  color: #6B7280;
  margin: 0.3rem 0 0 0;
  line-height: 1.3;
}

/* 单选框组 */
.radio-group {
  display: flex;
  gap: 1.5rem;
  padding: 0.3rem 0;
  flex-wrap: wrap;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #374151;
  transition: all 0.2s ease;
  padding: 0.3rem 0;
}

.radio-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.radio-item input {
  display: none;
}

.radio-custom {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid #D1D5DB;
  border-radius: 50%;
  transition: all 0.2s ease;
  position: relative;
}

.radio-item input:checked + .radio-custom {
  border-color: #6366F1;
  background-color: #6366F1;
}

.radio-item input:checked + .radio-custom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: white;
}

.radio-text {
  transition: color 0.2s ease;
}

.radio-item input:checked ~ .radio-text {
  color: #6366F1;
  font-weight: 500;
}

/* 不可编辑信息区域 */
.readonly-info {
  background-color: #F8FAFC;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 0.5rem;
  border: 1px solid #EFF6FF;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.info-header svg {
  color: #6366F1;
}

.info-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1F2937;
  margin: 0;
}

.info-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 2.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.info-item label {
  color: #6B7280;
  font-weight: 500;
}

.info-item span {
  color: #1F2937;
  font-weight: 500;
}

/* 弹窗底部 */
.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid #F3F4F6;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  background-color: #ffffff;
}

/* 按钮样式 */
.cancel-btn {
  background-color: #ffffff;
  color: #374151;
  border: 1px solid #D1D5DB;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

.cancel-btn:hover:not(:disabled) {
  background-color: #F9FAFB;
  border-color: #9CA3AF;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.submit-btn {
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5B5FEA 0%, #7C3AED 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(99, 102, 241, 0.25);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 保存中加载动画 */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .modal-backdrop {
    padding: 0.5rem;
  }
  
  .header-content {
    padding: 1.25rem 1.5rem;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .modal-footer {
    padding: 1.25rem 1.5rem;
    flex-wrap: wrap;
  }

  .avatar-upload-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
  }

  .avatar-error {
    position: relative;
    bottom: auto;
    left: auto;
    transform: none;
    margin-top: 0.5rem;
    justify-content: center;
  }

  .radio-group {
    gap: 1rem;
  }
  
  .info-list {
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .form-input {
    padding: 0.75rem 1rem;
  }

  .cancel-btn, .submit-btn {
    padding: 0.7rem 1.25rem;
    width: 100%;
  }
  
  .modal-footer {
    flex-direction: column;
  }
}
</style>