import { ref, onMounted } from 'vue';
import axios from '../axios';

export function useUserProfile(userId) {
  const userData = ref(null);
  const loading = ref(true);
  const error = ref(false);
  const errorMessage = ref('');

  const fetchUserData = async () => {
    loading.value = true;
    error.value = false;
    try {
      const response = await axios.get(`/user/${userId}`);
      if (response.data.code === 200) {
        userData.value = response.data.data;
      } else {
        throw new Error(response.data.message || '获取用户信息失败');
      }
    } catch (err) {
      error.value = true;
      errorMessage.value = err.message || '网络错误，请稍后重试';
      console.error('获取用户数据失败:', err);
    } finally {
      loading.value = false;
    }
  };

  onMounted(fetchUserData);

  return {
    userData,
    loading,
    error,
    errorMessage,
    fetchUserData,
  };
}