<template>
<div class="search-container">
  <img :src="logo" alt="Logo" class="outside-logo" />
  <div class="search-bar">
    <div class="dropdown">
      <select v-model="selectedOption">
        <option v-for="option in options" :key="option.value" :value="option.value">{{ option.text }}</option>
      </select>
    </div>
    <input 
      type="text" 
      :placeholder="selectedOption === 'shop' ? '搜索店铺（支持店铺编号或店铺名称模糊）' : '搜索商品'"
      v-model="keyword"
      @keyup.enter="handleSearch"
    />
    <button @click="handleSearch">搜索</button>
  </div>
</div>
</template>

<script setup>
import logo from '../../assets/images/logo.png';
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const selectedOption = ref('item');
const options = ref([
  { text: '宝贝', value: 'item' },
  { text: '店铺', value: 'shop' }
]);

const keyword = ref('');
const router = useRouter();
const route = useRoute();

// 初始化：从路由查询参数同步类型与关键字
const initFromRoute = () => {
  const type = typeof route.query.type === 'string' && route.query.type.trim().length > 0 ? route.query.type : 'item';
  const q = typeof route.query.q === 'string' ? route.query.q : '';
  selectedOption.value = type;
  keyword.value = q;
};
initFromRoute();

// 监听路由变化：保持输入框与下拉选项与路由参数同步
watch(
  () => [route.query.type, route.query.q],
  ([newType, newQ]) => {
    const typeStr = typeof newType === 'string' && newType.trim().length > 0 ? newType : 'item';
    selectedOption.value = typeStr;
    keyword.value = typeof newQ === 'string' ? newQ : '';
  }
);

const handleSearch = () => {
  const q = keyword.value.trim();
  const type = selectedOption.value; // 'item' 或 'shop'
  if (q) {
    router.push({ path: '/index', query: { type, q } });
  } else {
    router.push({ path: '/index', query: { type } });
  }
};
</script>

<style scoped>
.search-bar {
    width: 680px;
    height: 45px;
    position: relative;
    display: flex;
    align-items: center;
    border: 1px solid #FF0036;
    border-radius: 15px;
}

.dropdown {
  position: relative;
  display: inline-block;
  border: none;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  margin-right: 0;
  height: 40px;
  overflow: hidden;
  border-right: 1px solid #FF0036;
}

.dropdown select {

  background-color: transparent;
  border: none;
  margin-left: 15px;
  margin-right: 25px;
  height: 100%;
  cursor: pointer;
  outline: none;
  font-size: 16px;
  color: #333;
}


.search-bar input {
  width: 500px;
  height: 40px;
  margin-left: 15px;
  border: none;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  outline: none;

}

.search-bar button {
    width: 80px;
    height: 40px;
    padding: 10px 20px;
    background-color: #FF0036;
    border-radius: 15px;
    margin-left: -1px;
    color: white;
    border: none;
    cursor: pointer;
}
.outside-logo {
  width: 240px;
  height: 100px;
  margin-right: 70px;
  margin-left: -300px;
  vertical-align: middle;
}

.search-container {
  display: flex;
  align-items: center;
  justify-content: center;
  /* margin: 20px auto; */
}
</style>
