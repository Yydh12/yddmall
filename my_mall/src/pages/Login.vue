<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>用户登录</h2>
        <p>请输入账号信息登录系统</p>
      </div>
      
      <form class="login-form">
        <div class="form-group">
          <label for="account" class="form-label">账号</label>
          <div class="input-wrapper">
            <i class="icon-user"></i>
            <input
              type="text" 
              id="account" 
              v-model="account" 
              required 
              class="form-input"
              placeholder="请输入用户名或手机号"
            />
          </div>
        </div>
        
        <div class="form-group">
          <label for="password" class="form-label">密码</label>
          <div class="input-wrapper">
            <i class="icon-lock"></i>
            <input 
              type="password" 
              id="password" 
              v-model="password" 
              required 
              class="form-input"
              placeholder="请输入密码"
            />
          </div>
        </div>
        
        <div v-if="error" class="error-message">{{ error }}</div>
        
        <button 
          type="submit" 
          @click.prevent="Login" 
          class="login-btn"
          :disabled="!account || !password"
        >
          登录
        </button>
        
        <div class="register-link">
          还没有账号？<a href="/register">立即注册</a>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from '../axios';
import { useRouter } from 'vue-router';

const account = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();

const Login = async () => {
  try {
    const phoneReg = /^1[3-9]\d{9}$/;
    const isPhone = phoneReg.test(account.value);
    const response = isPhone
      ? await axios.post('user/loginByPhone', { phone: account.value, password: password.value })
      : await axios.post('user/login', { username: account.value, password: password.value });
    if (response.data.data && response.data.code === 200) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      if (response.data.data.user.roleId === 1) {
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        localStorage.setItem('isAdmin', true);
        router.push('/system');
      } else {
        router.push('/');
      }
    }
  } catch (err) {
    error.value = '登录失败，请稍后再试';
    console.error('登录请求失败:', err);
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease;
}

.login-card:hover {
  transform: translateY(-5px);
}

.login-header {
  padding: 30px 25px;
  background: #f8f9fa;
  text-align: center;
  border-bottom: 1px solid #f1f1f1;
}

.login-header h2 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.login-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.login-form {
  padding: 30px 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-size: 14px;
  font-weight: 500;
}

.input-wrapper {
  position: relative;
}

.icon-user, .icon-lock {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 16px;
}

/* 模拟图标 */
.icon-user::before {
  content: "👤";
}

.icon-lock::before {
  content: "🔒";
}

.form-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 15px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.form-input::placeholder {
  color: #ccc;
}

.error-message {
  color: #e74c3c;
  font-size: 13px;
  margin: -10px 0 20px 0;
  padding: 5px;
  text-align: center;
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-btn:hover {
  background: #5a6fde;
}

.login-btn:disabled {
  background: #b3bfea;
  cursor: not-allowed;
}

.login-mode {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}
.mode-option {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #555;
  font-size: 14px;
}

.register-link {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

.register-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.register-link a:hover {
  color: #5a6fde;
  text-decoration: underline;
}
</style>
