<template>
  <div class="user-center-container">
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-if="error" class="error-container">
        <div class="error-icon">!</div>
        <p>{{ errorMessage }}</p>
        <button class="retry-btn" @click="fetchUserData">重试</button>
      </div>

      <UserProfileCard
        :userData="userData"
        :loading="loading"
        :error="error"
        :defaultAvatar="defaultAvatar"
        :genderMap="genderMap"
        @open-edit-modal="showEditModal = true"
      >
        <template #address-management>
          <AddressManagement
            :addresses="addresses"
            :addressLoading="addressLoading"
            v-model:showAddressDialog="showAddressDialog"
            :isEditAddress="isEditAddress"
            :addressForm="addressForm"
            :addressRules="addressRules"
            :addressFormRef="addressFormRef"
            :addressPicker="addressPicker"
            :regionOptions="regionOptions"
            :openAddAddress="openAddAddress"
            :saveAddress="saveAddress"
            :editAddress="editAddress"
            :setDefault="setDefault"
            :removeAddress="removeAddress"
            :resetAddressForm="resetAddressForm"
            @update:addressPicker="(value) => { addressPicker.value = value }"
          />
        </template>
      </UserProfileCard>
    <EditProfileModal
      :showModal="showEditModal"
      :modalLoading="modalLoading"
      :submitting="submitting"
      :formData="formData"
      :avatarError="avatarError"
      :isUploading="isUploading"
      :uploadPercent="uploadPercent"
      :roleMap="roleMap"
      :defaultAvatar="defaultAvatar"
      @handle-avatar-upload="handleAvatarUpload"
      @handle-submit="handleSubmit"
      @handle-modal-close="handleModalClose"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useUserProfile } from '@/composables/useUserProfile';
import { useAddress } from '@/composables/useAddress';
import { useEditProfile } from '@/composables/useEditProfile';
import UserProfileCard from './UserProfileCard.vue';
import EditProfileModal from './EditProfileModal.vue';
import AddressManagement from '@/components/AddressManagement.vue';

const user = ref(JSON.parse(localStorage.getItem('user') || null));
console.log(user.value);
const defaultAvatar = 'https://picsum.photos/200/200?random=1';
const genderMap = { 0: '未知', 1: '男', 2: '女' };

const { userData, loading, error, errorMessage, fetchUserData } = useUserProfile(user.value.userId);
const { 
  addresses, 
  addressLoading, 
  showAddressDialog, 
  isEditAddress, 
  addressForm, 
  addressRules, 
  addressFormRef, 
  addressPicker, 
  regionOptions, 
  fetchAddresses, 
  openAddAddress, 
  saveAddress, 
  editAddress, 
  setDefault, 
  removeAddress, 
  resetAddressForm 
} = useAddress(user.value.userId);

const { 
  showEditModal, 
  modalLoading, 
  submitting, 
  formData, 
  avatarError, 
  isUploading, 
  uploadPercent, 
  roleMap, 
  handleAvatarUpload, 
  handleSubmit, 
  handleModalClose 
} = useEditProfile(userData, fetchUserData);

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

fetchAddresses();
</script>

<style scoped>
/* Styles from the original userInfo.vue file can be copied here */

/* 全局样式 */
.user-center-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
}

/* 页面头部 */
.page-header {
  background-color: #2c3e50;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-content {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;
}

.edit-btn:hover {
  background-color: #2980b9;
}

/* 主内容区 */
.main-content {
  width: 90%;
  max-width: 1200px;
  margin: 2rem auto;
  padding-bottom: 3rem;
}

/* 加载状态 */
.loading-container {
  text-align: center;
  padding: 4rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border: 4px solid rgba(52, 152, 219, 0.2);
  border-radius: 50%;
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 错误状态 */
.error-container {
  text-align: center;
  padding: 4rem 0;
  color: #e74c3c;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.3s ease;
}

.retry-btn:hover {
  background-color: #2980b9;
}

/* 用户信息卡片 */
.user-info-card {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 头像区域 */
.avatar-section {
  padding: 2rem;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f1f1f1;
}

.avatar-container {
  position: relative;
  width: 120px;
  height: 120px;
  margin-right: 2rem;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #f1f1f1;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.9rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.user-basic-info {
  flex: 1;
}

.username {
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
  color: #2c3e50;
}

.user-role {
  margin: 0;
  color: #7f8c8d;
  font-size: 1.1rem;
}

/* 详细信息区域 */
.detail-info-section {
  padding: 2rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.info-item {
  padding: 0.8rem 0;
  border-bottom: 1px solid #f1f1f1;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  display: block;
  color: #7f8c8d;
  margin-bottom: 0.3rem;
  font-size: 0.9rem;
}

.info-item span {
  color: #333;
  font-size: 1rem;
}

.status-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-active {
  background-color: #eafaf1;
  color: #27ae60;
}

.status-inactive {
  background-color: #fdedeb;
  color: #e74c3c;
}

/* 页脚 */
.page-footer {
  background-color: #2c3e50;
  color: white;
  text-align: center;
  padding: 1.5rem 0;
  margin-top: auto;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .avatar-section {
    flex-direction: column;
    text-align: center;
  }
  
  .avatar-container {
    margin-right: 0;
    margin-bottom: 1.5rem;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}

/* 弹窗相关样式 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-container {
  width: 90%;
  max-width: 800px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  background-color: #2c3e50;
  color: white;
  padding: 1.2rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
}

.close-btn {
  background: transparent;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-loading {
  text-align: center;
  padding: 3rem 0;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #f1f1f1;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
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

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.95rem;
  color: #333;
  font-weight: 500;
}

.form-label.required::after {
  content: '*';
  color: #e74c3c;
  margin-left: 0.3rem;
}

.form-input, .form-textarea {
  padding: 0.8rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.form-textarea {
  resize: vertical;
}

.form-hint {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin: 0.3rem 0 0 0;
}

/* 单选框组 */
.radio-group {
  display: flex;
  gap: 1.5rem;
  padding: 0.3rem 0;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.95rem;
}

.radio-item input {
  cursor: pointer;
}

/* 头像上传区域样式（新增上传进度、错误提示） */
.avatar-upload-section {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f1f1f1;
  margin-bottom: 1.5rem;
}

/* 上传中状态 */
.avatar-container.uploading .avatar-overlay {
  background-color: rgba(0, 0, 0, 0.7);
  opacity: 1; /* 上传中强制显示遮罩 */
}

/* 上传进度条 */
.upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 0 0 50% 50%;
  overflow: hidden;
  z-index: 10;
}

.progress-bar {
  height: 100%;
  background-color: #3498db;
  transition: width 0.3s ease;
}

/* 头像错误提示 */
.avatar-error {
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  color: #e74c3c;
  font-size: 0.85rem;
  margin: 0;
  white-space: nowrap;
}

.avatar-input {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
}

.avatar-tip {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin: 0;
}

/* 不可编辑信息区域 */
.readonly-info {
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 1.2rem;
  margin-bottom: 1rem;
}

.info-title {
  font-size: 1rem;
  font-weight: 500;
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 0.8rem;
}

.info-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 2rem;
}

/* 按钮样式 */
.cancel-btn {
  background-color: #f1f5f9;
  color: #333;
  border: none;
  padding: 0.7rem 1.2rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.cancel-btn:hover {
  background-color: #e2e8f0;
}

.submit-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.7rem 1.2rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.submit-btn:disabled {
  background-color: #95c8ed;
  cursor: not-allowed;
}

.submit-btn:hover:not(:disabled) {
  background-color: #2980b9;
}

/* 收货地址管理样式 */
.address-manage-section { 
  padding: 2rem; 
  border-top: 1px solid #f1f1f1; 
}
.address-manage-section .section-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 12px; 
}
.address-list { 
  display: grid; 
  gap: 12px; 
}
.address-item { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  border: 1px solid #eee; 
  border-radius: 6px; 
  padding: 12px; 
}
.address-info { 
  flex: 1; 
}
.receiver-info { 
  margin-bottom: 6px; 
}
.receiver-name { 
  font-weight: 600; 
  margin-right: 8px; 
}
.receiver-phone { 
  color: #666; 
  margin-right: 8px; 
}
.address-detail { 
  color: #333; 
}
.address-actions { 
  display: flex; 
  gap: 8px; 
}
.no-address { 
  text-align: center; 
  padding: 20px; 
  color: #777; 
}
.address-loading { 
  text-align: center; 
  padding: 20px; 
}

</style>