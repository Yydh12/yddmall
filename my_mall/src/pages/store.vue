<template>
  <div>
    <Navbar />
  </div>
  <el-container>
    <el-aside width="200px">
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical-demo"
        @select="handleMenuItemClick"
      >
        <!-- 一级菜单 -->
        <el-menu-item index="首页">
          <template #title>
            <el-icon><User /></el-icon>
            <span>首页</span>
          </template>
        </el-menu-item>
        <el-menu-item index="用户评论">
          <template #title>
            <el-icon><ChatLineSquare /></el-icon>
            <span>用户评论</span>
          </template>
        </el-menu-item>
        <!-- 二级菜单 -->
        <el-sub-menu index="2">
          <template #title>
            <el-icon><icon-menu /></el-icon>
            <span>商品管理</span>
          </template>
          <!-- 第一级子菜单 -->
          <el-menu-item index="我的宝贝">
            <template #title>
              <el-icon><Star /></el-icon>
              <span>我的宝贝</span>
            </template>
          </el-menu-item>
          <!-- 发布宝贝菜单 -->
          <el-menu-item index="发布宝贝">
            <template #title>
              <el-icon><Pointer /></el-icon>
              <span>发布宝贝</span>
            </template>
          </el-menu-item>
          <!-- 发布红包菜单 -->
          <el-menu-item index="发布红包">
            <template #title>
              <el-icon><Pointer /></el-icon>
              <span>发布红包</span>
            </template>
          </el-menu-item>
          <!-- 红包列表菜单 -->
          <el-menu-item index="红包列表">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>红包列表</span>
            </template>
          </el-menu-item>
          <!-- 订单管理菜单 -->
          <el-menu-item index="订单管理">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>订单管理</span>
            </template>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/Store/Navbar.vue'
import {
  User,
  Menu as IconMenu,
  Star,
  Pointer,
  Document,
  ChatLineSquare
} from '@element-plus/icons-vue'

const route = useRoute();
const router = useRouter();

const components = [
  { label: '首页', icon: User, path: '/store/home' },
  { label: '我的宝贝', icon: Star, path: '/store/my-products' },
  { label: '发布宝贝', icon: Pointer, path: '/store/releaseProduct/0' },
  { label: '发布红包', icon: Pointer, path: '/store/publishRedPacket' },
  { label: '红包列表', icon: Document, path: '/store/redPackets' },
  { label: '订单管理', icon: Document, path: '/store/orderManage' },
  { label: '用户评论', icon: ChatLineSquare, path: '/store/comments' },
];

// 菜单激活：根据当前路由子路径判断
const activeMenu = computed(() => {
  if (route.path.startsWith('/store/releaseProduct')) return '发布宝贝';
  if (route.path === '/store/publishRedPacket') return '发布红包';
  if (route.path === '/store/redPackets') return '红包列表';
  if (route.path === '/store/orderManage') return '订单管理';
  if (route.path === '/store/my-products') return '我的宝贝';
  if (route.path === '/store/comments') return '用户评论';
  return '首页';
});

const handleMenuItemClick = (componentName) => {
  const target = components.find(item => item.label === componentName);
  if (target) {
    router.replace(target.path);
  }
};

</script>

<style>
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
  min-height: 660px;
}

.el-container {
  height: calc(100vh - 75px); /* 假设 Navbar 高度为 60px */
}

.el-main {
  background-color: #e9eef3;
  color: var(--el-text-color-primary);
  overflow-y: auto;
}



/* 简约滚动条样式 - 适用于所有带滚动的容器 */
/* 滚动条轨道 */
::-webkit-scrollbar {
  width: 6px;    /* 垂直滚动条宽度 */
  height: 6px;   /* 水平滚动条高度 */
}

/* 滚动条轨道背景 */
::-webkit-scrollbar-track {
  background: transparent;  /* 透明背景 */
  border-radius: 3px;       /* 圆角 */
}

/* 滚动条滑块 */
::-webkit-scrollbar-thumb {
  background: #d1d5db;      /* 浅灰色滑块 */
  border-radius: 3px;       /* 圆角与轨道匹配 */
  transition: background 0.2s ease;  /* 过渡效果 */
}

/* 滚动条滑块悬停状态 */
::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;      /* 深一点的灰色 */
}

/* 滚动条滑块激活状态（点击时） */
::-webkit-scrollbar-thumb:active {
  background: #6b7280;      /* 更深的灰色 */
}

/* 为特定容器应用滚动条样式 */
.scrollable-container {
  overflow-y: auto;
  /* 可以在这里设置容器的高度限制 */
  /* max-height: 400px; */
}

/* 深色模式下的滚动条（可选） */
.dark-mode ::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.dark-mode ::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

</style>