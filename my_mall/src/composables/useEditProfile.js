import { ref, reactive, watch } from 'vue';
import axios from '../axios';

export function useEditProfile(userData, fetchUserData) {
  const showEditModal = ref(false);
  const modalLoading = ref(false);
  const submitting = ref(false);
  const avatarFile = ref(null);
  const avatarError = ref('');
  const isUploading = ref(false);
  const uploadPercent = ref(0);
  const originalAvatarFileName = ref('');

  const formData = reactive({
    userId: '',
    username: '',
    realName: '',
    phone: '',
    email: '',
    gender: '0',
    avatar: '',
    merchantId: '',
    roleId: '',
    remark: ''
  });

  const roleMap = { 1: '管理员', 2: '普通用户', 3: '商户' };

  const initFormData = () => {
    if (userData.value) {
      modalLoading.value = true;
      Object.assign(formData, {
        userId: userData.value.userId,
        username: userData.value.username,
        realName: userData.value.realName || '',
        phone: userData.value.phone || '',
        email: userData.value.email || '',
        gender: userData.value.gender?.toString() || '0',
        avatar: userData.value.avatar || '',
        merchantId: userData.value.merchantId,
        roleId: userData.value.roleId,
        remark: userData.value.remark || ''
      });

      if (userData.value.avatar && !userData.value.avatar.includes('picsum.photos')) {
        const urlSegments = userData.value.avatar.split('/');
        originalAvatarFileName.value = urlSegments[urlSegments.length - 1];
      } else {
        originalAvatarFileName.value = '';
      }

      modalLoading.value = false;
    }
  };

  watch(showEditModal, (newVal) => {
    if (newVal && userData.value) {
      initFormData();
      avatarError.value = '';
      uploadPercent.value = 0;
      avatarFile.value = null;
    }
  });

  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(file.type) || !['jpg', 'jpeg', 'png'].includes(fileExt)) {
      avatarError.value = '仅支持JPG、PNG格式图片';
      return false;
    }
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      avatarError.value = '图片大小不能超过2MB';
      return false;
    }
    return true;
  };

  const generatePreview = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      formData.avatar = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const deleteOriginalAvatar = async () => {
    if (!originalAvatarFileName.value) return;

    try {
      const response = await axios.delete(`/user/image`, {
        params: {
          imageUrl: userData.value.avatar,
          fileName: originalAvatarFileName.value,
          userNo: userData.value.userNo,
          userId: userData.value.userId
        },
        withCredentials: true
      });

      if (response.data.code !== 200) {
        console.warn('原头像删除失败:', response.data.message);
      }
    } catch (err) {
      console.error('调用删除原头像接口失败:', err);
    }
  };

  const uploadAvatarToServer = async () => {
    if (!avatarFile.value) return;

    isUploading.value = true;
    avatarError.value = '';
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', avatarFile.value);
      uploadFormData.append('userNo', userData.value.userNo);
      uploadFormData.append('id', userData.value.userId);
      
      const response = await axios.post('/user/image', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            uploadPercent.value = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          }
        },
        withCredentials: true
      });

      if (response.data.code === 200) {
        formData.avatar = response.data.data;
        avatarFile.value = null;
        await deleteOriginalAvatar();
        originalAvatarFileName.value = '';
      } else {
        throw new Error(response.data.message || '头像上传失败');
      }
    } catch (err) {
      avatarError.value = err.message || '上传失败，请重试';
      if (!formData.avatar.includes('data:image')) {
        formData.avatar = userData.value.avatar || '';
      }
    } finally {
      isUploading.value = false;
      uploadPercent.value = 0;
    }
  };

  const handleAvatarUpload = (e) => {
    avatarError.value = '';
    const file = e.target.files[0];
    if (!file) return;
    if (!validateFile(file)) {
      e.target.value = '';
      return;
    }
    avatarFile.value = file;
    generatePreview(file);
    uploadAvatarToServer();
    e.target.value = '';
  };

  const handleSubmit = async () => {
    submitting.value = true;
    try {
      const response = await axios.put('/user', formData);
      if (response.data.code === 200) {
        showEditModal.value = false;
        fetchUserData();
        const response = await axios.get(`/user/${formData.userId}`);
        // console.log("更新用户信息成功:",response.data.data);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      } else {
        console.error('更新用户信息失败:', response.data.message);
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);
    } finally {
      submitting.value = false;
    }
  };

  const handleModalClose = () => {
    if (!isUploading.value) {
      showEditModal.value = false;
    }
  };

  return {
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
    handleModalClose,
  };
}