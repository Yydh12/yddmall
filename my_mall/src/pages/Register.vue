<template>
    <div class="register-page">
        <div class="register-card">
            <div class="register-header">
                <h2>用户注册</h2>
                <p>创建账号，开始您的使用之旅</p>
            </div>
            
            <form @submit.prevent="register" class="register-form">
                <div class="form-group">
                    <label for="phone" class="form-label">手机号</label>
                    <div class="input-wrapper">
                        <i class="icon-phone"></i>
                        <input 
                            type="tel" 
                            id="phone" 
                            v-model="phone" 
                            required
                            class="form-input"
                            placeholder="请输入手机号"
                            maxlength="11"
                        >
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
                            placeholder="请设置密码（6-16位）"
                            minlength="6"
                            maxlength="16"
                        >
                    </div>
                </div>
                
                <!-- 保留注释的表单字段，保持与原始代码结构一致 -->
                <!-- <div class="form-group">
                    <label for="confirmPassword" class="form-label">确认密码</label>
                    <div class="input-wrapper">
                        <i class="icon-lock"></i>
                        <input type="password" id="confirmPassword" v-model="confirmPassword" required class="form-input" placeholder="请再次输入密码">
                    </div>
                </div>
                <div class="form-group">
                    <label for="email" class="form-label">邮箱</label>
                    <div class="input-wrapper">
                        <i class="icon-email"></i>
                        <input type="email" id="email" v-model="email" required class="form-input" placeholder="请输入邮箱">
                    </div>
                </div>
                <div class="form-group">
                    <label for="captcha" class="form-label">验证码</label>
                    <div class="captcha-wrapper">
                        <div class="input-wrapper">
                            <i class="icon-code"></i>
                            <input type="text" id="captcha" v-model="captcha" required class="form-input" placeholder="请输入验证码">
                        </div>
                        <button type="button" class="get-captcha">获取验证码</button>
                    </div>
                </div> -->
                
                <div class="form-group">
                    <button 
                        type="submit" 
                        @click.prevent="register" 
                        class="register-btn"
                        :disabled="!phone || !password || phone.length !== 11 || password.length < 6"
                    >
                        注册
                    </button>
                </div>
                
                <div class="login-link">
                    已有账号？<a href="/login">立即登录</a>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from '../axios'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const phone = ref('')
const password = ref('')

const register = async () => {
    // 简单的手机号格式验证
    const phoneReg = /^1[3-9]\d{9}$/;
    if (!phoneReg.test(phone.value)) {
        ElMessage.error('请输入有效的手机号');
        return;
    }
    
    // 密码长度验证
    if (password.value.length < 6 || password.value.length > 16) {
        ElMessage.error('密码长度必须在6-16位之间');
        return;
    }
    
    try {
        const response = await axios.post('/user/register', {
            phone: phone.value,
            password: password.value
        })
        console.log(response.data)
        if (response.data.code == 200) {
            ElMessage.success('注册成功，正在自动登录...')
            // 使用手机号直接自动登录并跳转首页
            try {
                const loginRes = await axios.post('user/loginByPhone', {
                    phone: phone.value,
                    password: password.value
                })
                if (loginRes.data?.code === 200 && loginRes.data?.data) {
                    localStorage.setItem('token', loginRes.data.data.token)
                    localStorage.setItem('user', JSON.stringify(loginRes.data.data.user))
                    router.push('/')
                } else {
                    ElMessage.warning('自动登录失败，请使用手机号或用户名登录')
                    router.push('/login')
                }
            } catch (e) {
                console.error('自动登录请求失败:', e)
                ElMessage.warning('自动登录失败，请使用手机号或用户名登录')
                router.push('/login')
            }
        } else {
            ElMessage.error(response.data.msg || '注册失败，请稍后再试');
        }
    } catch (error) {
        console.error('注册请求失败:', error);
        ElMessage.error('网络错误，注册失败');
    }
}
</script>

<style scoped>
.register-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    box-sizing: border-box;
}

.register-card {
    width: 100%;
    max-width: 400px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.3s ease;
}

.register-card:hover {
    transform: translateY(-5px);
}

.register-header {
    padding: 30px 25px;
    background: #f8f9fa;
    text-align: center;
    border-bottom: 1px solid #f1f1f1;
}

.register-header h2 {
    margin: 0 0 10px 0;
    color: #333;
    font-size: 24px;
    font-weight: 600;
}

.register-header p {
    margin: 0;
    color: #666;
    font-size: 14px;
}

.register-form {
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

.icon-phone, .icon-lock, .icon-email, .icon-code {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
    font-size: 16px;
}

/* 图标模拟 */
.icon-phone::before { content: "📱"; }
.icon-lock::before { content: "🔒"; }
.icon-email::before { content: "✉️"; }
.icon-code::before { content: "🔑"; }

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

.captcha-wrapper {
    display: flex;
    gap: 10px;
}

.captcha-wrapper .input-wrapper {
    flex: 1;
}

.get-captcha {
    width: 120px;
    padding: 0 15px;
    background: #f1f5f9;
    color: #667eea;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.get-captcha:hover {
    background: #e2e8f0;
}

.register-btn {
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

.register-btn:hover {
    background: #5a6fde;
}

.register-btn:disabled {
    background: #b3bfea;
    cursor: not-allowed;
}

.login-link {
    margin-top: 20px;
    text-align: center;
    font-size: 14px;
    color: #666;
}

.login-link a {
    color: #667eea;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s ease;
}

.login-link a:hover {
    color: #5a6fde;
    text-decoration: underline;
}
</style>
