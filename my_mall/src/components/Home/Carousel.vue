<template>
  <div class="carousel" @mouseenter="pause" @mouseleave="resume">
    <ul class="carousel-list">
  <li
    v-for="(item, i) in list"
    :key="i"
    :class="{ active: i === active }"
  >
    <img :src="item.src" :alt="item.description" />
    <div v-if="item.description" class="carousel-description">
      <p v-for="(desc, descIndex) in item.description" :key="descIndex">{{ desc }}</p>
    </div>
  </li>
</ul>

    <!-- 左右箭头 -->
    <button class="arrow left" @click="prev">&lt;</button>
    <button class="arrow right" @click="next">&gt;</button>

    <!-- 指示点 -->
    <div class="dots">
      <span
        v-for="(_, i) in list"
        :key="i"
        :class="{ active: i === active }"
        @click="active = i"
      ></span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const list = ref([
    { src: '/gif/lunbo1.gif', description: ['轻盈夏日穿搭优选','衣橱焕新精致指南','精选女装 火热开抢'] },
    { src: '/gif/lunbo2.gif', description: ['日用百货超值优惠','好货低价等你来','超值百货 省钱省心'] },
    { src: '/gif/lunbo3.gif', description: ['潮电数码抢24期免息','数码焕新 不止5折','官方正品 在线选购'] },
    { src: '/gif/lunbo4.gif', description: ['宅家刷剧好伴侣','休闲零食美味升级','全网低价 限时直降'] },
    { src: '/gif/lunbo5.gif', description: ['智能家电新体验','开启便捷品质生活','品类齐全 现货热销'] }
]);

const active = ref(0)
let timer = null

const next  = () => (active.value = (active.value + 1) % list.value.length)
const prev  = () => (active.value = (active.value - 1 + list.value.length) % list.value.length)
const play  = () => (timer = setInterval(next, 3000))
const pause = () => clearInterval(timer)
const resume= () => play()

onMounted(play)
onUnmounted(pause)
</script>

<style scoped>
.carousel {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border-radius: 15px;
  margin: 0;
  transform: translateZ(0);
}

.carousel-list {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  margin: 0;
  transform: translateZ(0);
}

.carousel-list li {
  position: absolute;
  inset: 0; /* 确保完全覆盖父容器 */
  opacity: 0;
  transition: opacity .5s;
  pointer-events: none;
}

.carousel-list li.active {
  opacity: 1;
  pointer-events: auto;
}

/* 关键修改：图片尺寸自适应父容器，而非固定值 */
.carousel-list img {
  width: 100%; /* 宽度充满父容器 */
  height: 100%; /* 高度充满父容器 */
  object-fit: cover; /* 保持比例裁剪，避免拉伸 */
  display: block; /* 消除图片底部默认留白（因inline元素特性导致） */
}

.carousel-description {
  position: absolute;
  top: 35%;
  left: 0;
  transform: translateY(-50%);
  width: 100%;
  padding: 0 20px;
  background: none;
  color: #fff;
  text-align: left;
  box-sizing: border-box;
  z-index: 1;
}

.carousel-description p:nth-child(1),
.carousel-description p:nth-child(2) {
  font-size: 36px;
  font-weight: bold;
  height: 10px;
}

.carousel-description p:nth-child(3) {
  font-size: 24px;
  margin-top: 50px;
}

/* 箭头样式 */
.arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%); /* 垂直居中 */
  background: rgba(0,0,0,.4);
  color: #fff;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  z-index: 2;
  border-radius: 50%; /* 添加圆角 */
  opacity: 0; /* 默认隐藏 */
  transition: opacity 0.3s; /* 添加过渡效果 */
}

.carousel:hover .arrow { /* 鼠标悬停时显示 */
  opacity: 1;
}

.arrow.left { left: 10px; }
.arrow.right { right: 10px; }

/* 指示点样式保持不变 */
.dots {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}

.dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255,255,255,.5);
  cursor: pointer;
}

.dots .active { background: #fff; }

</style>