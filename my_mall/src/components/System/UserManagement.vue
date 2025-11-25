<template>
    <div>
        <el-table :data="userList" v-loading="loading" style="width: 100%">
            <el-table-column prop="userId" label="ID" />
            <el-table-column prop="realName" label="真实姓名" :formatter="formatRealName" />
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="gender" label="性别" :formatter="formatGender" />
            <el-table-column prop="email" label="邮箱" :formatter="formatEmail" />
            <el-table-column prop="phone" label="手机号" :formatter="formatPhone" />
            <el-table-column prop="roleId" label="角色" :formatter="formatRole" />
            <el-table-column prop="status" label="状态">
                <template #default="scope">
                    <el-select v-model="scope.row.status" placeholder="选择状态" @change="updateUserStatus(scope.row.userId, scope.row.status)">
                        <el-option label="禁用" :value="0"></el-option>
                        <el-option label="正常" :value="1"></el-option>
                        <el-option label="待审核" :value="2"></el-option>
                    </el-select>
                </template>
            </el-table-column>
        </el-table>
        <div class="pagination-container">
            <el-pagination
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                :current-page="currentPage"
                :page-sizes="[10, 20, 50, 100]"
                :page-size="pageSize"
                layout="total, sizes, prev, pager, next, jumper"
                :total="total">
            </el-pagination>
        </div>
    </div>
</template>

<script setup>
import axios from '../../axios';
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

const userList = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/user', {
      params: {
        current: currentPage.value,
        size: pageSize.value,
      },
    });
    if (response.data.code === 200) {
      userList.value = response.data.data.records;
      total.value = response.data.data.total;
    } else {
      ElMessage.error('获取用户列表失败: ' + response.data.msg);
    }
  } catch (error) {
    ElMessage.error('请求用户列表失败: ' + error.message);
  } finally {
    loading.value = false;
  }
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchUsers();
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1; // 切换每页大小时回到第一页
  fetchUsers();
};

const updateUserStatus = async (userId, status) => {
  try {
    const response = await axios.put('/user', { userId, status });
    if (response.data.code === 200) {
      ElMessage.success(response.data.message);
      fetchUsers(); // Refresh user list after status change
    } else {
      ElMessage.error(response.data.message);
    }
  } catch (error) {
    ElMessage.error('更新用户状态失败');
    console.error('Error updating user status:', error);
  }
};

onMounted(() => {
  fetchUsers();
});

const formatGender = (row, column, cellValue) => {
  switch (cellValue) {
    case 0:
      return '未知';
    case 1:
      return '男';
    case 2:
      return '女';
    default:
      return cellValue;
  }
};

const formatRole = (row, column, cellValue) => {
  switch (cellValue) {
    case 1:
      return '管理员';
    case 2:
      return '运营专员';
    case 3:
      return '商家用户';
    case 4:
      return '普通用户';
    default:
      return cellValue;
  }
};

const formatRealName = (row, column, cellValue) => {
  return cellValue ? cellValue : '未实名';
};

const formatEmail = (row, column, cellValue) => {
  return cellValue ? cellValue : '未绑定';
};

const formatPhone = (row, column, cellValue) => {
  return cellValue ? cellValue : '未绑定';
};
</script>

<style scoped>
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>

