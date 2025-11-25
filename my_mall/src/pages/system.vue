<template>
  <el-container class="system-container">
    <el-aside width="200px" class="sidebar">
      <div class="sidebar-header">
        <h2 class="system-title">后台管理</h2>
      </div>
      <div class="current-user-info">
          <el-icon :size="18"><User /></el-icon>
          <span>用户在线: {{ username }}</span>
        </div>
      <el-menu 
        default-active="0" 
        class="el-menu-vertical-demo"
        background-color="#0f172a"
        text-color="#e2e8f0"
        active-text-color="#ffffff"
        active-background-color="#3b82f6"
        :collapse-transition="false"
      >
      
        <el-menu-item 
          v-for="(component, index) in components" 
          :key="index" 
          :index="String(index)" 
          @click="currentComponent = component.name"
          class="menu-item"
        >
          <el-icon :size="18" class="menu-icon">
            <component :is="component.icon"></component>
          </el-icon>
          <span>{{ component.label }}</span>
        </el-menu-item>
        </el-menu>
    </el-aside>
    <el-main class="content">
      <div class="content-header">
        <h1 class="page-title">
          {{ components.find(item => item.name === currentComponent)?.label || '管理中心' }}
        </h1>
      </div>
      <div class="content-body">
        <transition name="component-fade" mode="out-in">
          <component :is="currentComponent" class="page-content"></component>
        </transition>
      </div>
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, markRaw, computed, onMounted } from 'vue';
import { User, Goods, Ticket, Discount } from '@element-plus/icons-vue';
import UserManagement from '../components/System/UserManagement.vue';
import StoresMangement from '../components/System/StoresMangement.vue';
import CommentsAudit from './systemdown/CommentsAudit.vue';
import PublishCoupon from '../components/System/PublishCoupon.vue';
import CouponList from '../components/System/CouponList.vue';

const user = JSON.parse(localStorage.getItem('user'));
const username = ref(user?.username || '未知用户');

const currentComponent = ref(markRaw(UserManagement));

const components = ref([
  { name: markRaw(UserManagement), label: '用户管理', icon: markRaw(User) },
  { name: markRaw(StoresMangement), label: '店铺管理', icon: markRaw(Goods) },
  { name: markRaw(CommentsAudit), label: '评论审核', icon: markRaw(Ticket) },
  { name: markRaw(PublishCoupon), label: '发布优惠券', icon: markRaw(Discount) },
  { name: markRaw(CouponList), label: '优惠券管理', icon: markRaw(Discount) },
]);

// 获取当前页面标题
const currentTitle = computed(() => {
  return components.value.find(item => item.name === currentComponent.value)?.label || '管理中心';
});
</script>

<style scoped>
.system-container {
  width: 100%;
  height: 97vh;
  overflow: hidden;
}

.sidebar {
  background-color: #0f172a;
  border-right: 1px solid #1e293b;
  transition: all 0.3s ease;
}

.sidebar-header {
  padding: 1.5rem 1rem;
  border-bottom: 1px solid #1e293b;
}

.system-title {
  color: #ffffff;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  text-align: center;
}

.el-menu-vertical-demo {
  border-right: none;
}

.current-user-info {
  color: #e2e8f0;
  padding: 1rem;
  text-align: center;
  border-bottom: 1px solid #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.menu-item {
  transition: all 0.2s ease;
  margin: 0.25rem 0.5rem;
  border-radius: 6px;
}

.menu-item:hover {
  background-color: #1e293b !important;
}

.menu-icon {
  margin-right: 0.75rem;
}

.content {
  background-color: #f8fafc;
  padding: 0;
  overflow-y: auto;
}

.content-header {
  background-color: #ffffff;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.page-title {
  margin: 0;
  color: #1e293b;
  font-size: 1.5rem;
  font-weight: 600;
}

.content-body {
  padding: 1.5rem 2rem;
}

.page-content {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-height: calc(100% - 3rem);
  padding: 1.5rem;
}

/* 组件切换动画 */
.component-fade-enter-active,
.component-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.component-fade-enter-from,
.component-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
