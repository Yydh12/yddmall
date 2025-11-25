<template>
  <div class="address-manage-section">
    <div v-if="addressLoading" class="address-loading">
      <div class="spinner"></div>
      <p>地址加载中...</p>
    </div>

    <div v-else>
      <div class="address-list" v-if="addresses.length">
        <div
          class="address-item"
          :class="{ 'is-default': addresses[0].isDefault === 1 }"
        >
          <div class="address-info">
            <div class="receiver-info">
              <span class="receiver-name">{{ addresses[0].receiverName }}</span>
              <span class="receiver-phone">{{ addresses[0].receiverPhone }}</span>
              <el-tag v-if="addresses[0].isDefault === 1" type="success" size="small">
                <span class="icon-wrapper"><Star /></span> 默认地址
              </el-tag>
            </div>
            <div class="address-detail">
              <span class="icon-wrapper"><Location /></span>
              {{ addresses[0].province }} {{ addresses[0].city }} {{ addresses[0].district }} {{ addresses[0].detailAddress }}
            </div>
            <el-button link size="small" type="primary" @click="editAddress(addresses[0])">
              <span class="icon-wrapper"><Edit /></span> 编辑
            </el-button>
            <el-button
              v-if="addresses[0].isDefault !== 1"
              link
              size="small"
              type="warning"
              @click="setDefault(addresses[0])"
            >
              <span class="icon-wrapper"><Star /></span> 设为默认
            </el-button>
            <el-button link size="small" type="danger" @click="removeAddress(addresses[0])">
              <span class="icon-wrapper"><Delete /></span> 删除
            </el-button>
            <el-button link size="small" type="primary" @click="openAddAddress">
              <span class="icon-wrapper"><CirclePlus /></span> 添加
            </el-button>
            <!-- 终极修复：ElPopover 结构简化，确保单根内容 + 直接触发按钮 -->
            <el-popover
              v-model:visible="popoverVisible[addresses[0].addressId]"
              trigger="click"
              placement="bottom"
              width="300"
            >
              <!-- 浮窗内容：强制单根节点，无多余嵌套 -->
              <div class="address-popover">
                <div class="popover-header">所有收货地址</div>
                <div class="popover-address-list">
                  <div
                    v-for="item in addresses"
                    :key="item.addressId"
                    :class="{ 'popover-address-item': true, 'active': item.addressId === addresses[0].addressId }"
                    @click="handleAddressClick(item)"
                  >
                    <div class="popover-receiver">
                      <span>{{ item.receiverName }}</span>
                      <span>{{ item.receiverPhone }}</span>
                    </div>
                    <div class="popover-address">
                      <span class="icon-wrapper"><Location /></span>
                      {{ item.province }} {{ item.city }} {{ item.district }} {{ item.detailAddress }}
                    </div>
                    <el-tag v-if="item.isDefault === 1" type="success" size="small">默认</el-tag>
                  </div>
                </div>
              </div>
              
              <!-- 触发按钮：无任何嵌套，直接作为 ElPopover 子元素 -->
              <template #reference>
                <el-button size="small" type="primary" link>
                  <span class="icon-wrapper"><More /></span> 更多地址
                </el-button>
              </template>
            </el-popover>
          </div>

        </div>
      </div>
      <div v-else class="no-address">
        <p>暂无收货地址</p>
        <el-button type="primary" @click="openAddAddress">添加地址</el-button>
      </div>
    </div>

    <el-dialog
      :title="isEditAddress ? '编辑收货地址' : '添加收货地址'"
      :model-value="showAddressDialog"
      @update:model-value="val => $emit('update:showAddressDialog', val)" 
      width="650px"
      @close="resetAddressForm"
    >
      <el-form
        :model="addressForm"
        :rules="addressRules"
        ref="formRef"
        label-width="100px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="收货人" prop="receiverName">
              <el-input v-model="addressForm.receiverName" placeholder="请输入收货人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="receiverPhone">
              <el-input v-model="addressForm.receiverPhone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          </el-row>

          <el-form-item label="地址选择">
            <AddressPicker
              :addressPicker="addressPicker"
              v-model:detailAddress="addressForm.detailAddress"
            />
          </el-form-item>

          <el-row :gutter="16">
            <el-col :span="16">
              <el-form-item label="邮政编码">
                <el-input v-model="addressForm.postalCode" placeholder="请输入邮政编码（可选）" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="设为默认">
                <el-switch v-model="addressForm.isDefault"/>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <template #footer>
          <div class="dialog-footer">
            <el-button @click="$emit('update:showAddressDialog', false)">取消</el-button>
            <el-button type="primary" @click="handleSave">保存</el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </template>

  <script setup>
  // 导入低版本兼容图标（Menu 所有版本都支持）
  import { Plus, Star, Location, Edit, Delete, CirclePlus, More } from '@element-plus/icons-vue';
  import AddressPicker from './Common/AddressPicker.vue';
  import { ref, onMounted } from 'vue';
  // 仅导入必要组件，避免冗余
  import { ElPopover, ElTag, ElButton } from 'element-plus';

  const props = defineProps({
    addresses: Array,
    addressLoading: Boolean,
    showAddressDialog: Boolean,
    isEditAddress: Boolean,
    addressForm: Object,
    addressRules: Object,
    addressPicker: Object,
    openAddAddress: Function,
    saveAddress: Function,
    editAddress: Function,
    setDefault: Function,
    removeAddress: Function,
    resetAddressForm: Function,
  });

  const formRef = ref(null);
  const popoverVisible = ref({});

  // 初始化浮窗状态（避免初始值异常）
  onMounted(() => {
    props.addresses.forEach(addr => {
      popoverVisible.value[addr.addressId] = false;
    });
  });

  // 简化浮窗点击逻辑
  const handleAddressClick = (item) => {
    popoverVisible.value[item.addressId] = false;
    if (item.addressId !== props.addressForm.addressId) {
      item.isDefault !== 1 ? props.setDefault(item) : props.editAddress(item);
    }
  };

  // 表单提交逻辑
  const handleSave = async () => {
    const form = formRef.value;
    if (form) {
      form.validate(async (valid) => {
        if (valid) await props.saveAddress();
      });
    }
  };
  </script>

  <style scoped>
  .address-manage-section {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .address-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #666;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .address-list {
    flex: 1;
    overflow-y: auto;
    max-height: 400px;
  }

  .address-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px;
    margin-bottom: 12px;
    background: #fff;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    transition: all 0.2s ease;
    position: relative;
  }

  .address-item:hover {
    border-color: #007bff;
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
  }

  .address-item.is-default {
    border-color: #28a745;
    background: linear-gradient(135deg, #fff 0%, #f8fff9 100%);
  }

  .address-item.is-default::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 20px 20px 0;
    border-color: transparent #28a745 transparent transparent;
  }

  .address-info {
    flex: 1;
    margin-right: 16px;
  }

  .receiver-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  .receiver-name {
    font-weight: 600;
    color: #333;
    font-size: 14px;
  }

  .receiver-phone {
    color: #666;
    font-size: 14px;
  }

  .address-detail {
    color: #666;
    font-size: 13px;
    line-height: 1.4;
    word-break: break-all;
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }

  /* 图标包裹器：替代 ElIcon，避免组件嵌套问题 */
  .icon-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: inherit;
  }

  .no-address {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    /* padding: 6px 2px; */
    text-align: center;
    color: #999;
  }

  .no-address p {
    margin: 0 0 16px 0;
    font-size: 14px;
  }

  :deep(.el-dialog) {
    border-radius: 12px;
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    padding: 20px 24px;
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
  }

  :deep(.el-dialog__title) {
    font-size: 18px;
    font-weight: 600;
  }

  :deep(.el-dialog__body) {
    padding: 24px;
    background: #fafafa;
  }

  :deep(.el-dialog__footer) {
    padding: 0;
    background: #f8f9fa;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 24px;
  }

  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #333;
  }

  :deep(.el-input__wrapper) {
    border-radius: 6px;
  }

  :deep(.el-switch) {
    --el-switch-on-color: #28a745;
  }

  /* 浮窗样式：确保无多余嵌套 */
  .address-popover {
    padding: 8px 0;
  }

  .popover-header {
    padding: 0 16px 8px;
    border-bottom: 1px solid #eee;
    font-size: 14px;
    font-weight: 600;
  }

  .popover-address-list {
    max-height: 200px;
    overflow-y: auto;
  }

  .popover-address-item {
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .popover-address-item:hover {
    background-color: #f5f7fa;
  }

  .popover-address-item.active {
    background-color: #e8f4f8;
    border-left: 2px solid #007bff;
  }

  .popover-receiver {
    display: flex;
    gap: 12px;
    margin-bottom: 4px;
    font-size: 13px;
  }

  .popover-address {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    color: #666;
    font-size: 12px;
    line-height: 1.4;
    word-break: break-all;
  }
  </style>