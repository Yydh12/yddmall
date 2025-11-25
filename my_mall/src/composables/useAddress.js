import { ref, reactive } from 'vue';
import axios from '../axios';
import { useRegionPicker } from '../utils/useRegionPicker';

export function useAddress(userId) {
  const addresses = ref([]);
  const addressLoading = ref(false);
  const showAddressDialog = ref(false);
  const isEditAddress = ref(false);

  const { regionOptions, createAddressPicker } = useRegionPicker();
  let addressPicker = createAddressPicker();

  const addressForm = reactive({
  addressId: null,
  receiverName: '',
  receiverPhone: '',
  province: '',
  city: '',
  district: '',
  detailAddress: '',   // ← 改成和后端一样
  postalCode: '',
  isDefault: 0,
});

  const addressRules = {
    receiverName: [{ required: true, message: '请输入收货人姓名', trigger: 'blur' }],
    receiverPhone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
    province: [{ required: true, message: '请选择省份', trigger: 'change' }],
    city: [{ required: true, message: '请选择城市', trigger: 'change' }],
    district: [{ required: true, message: '请选择区县', trigger: 'change' }],
    detailAddress: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
  };

  const fetchAddresses = async () => {
    addressLoading.value = true;
    try {
      const res = await axios.get('/address/list');
      if (res.data.code === 200) addresses.value = res.data.data;
    } finally {
      addressLoading.value = false;
    }
  };

  const resetAddressForm = () => {
  Object.assign(addressForm, {
    addressId: null,
    receiverName: '',
    receiverPhone: '',
    province: '',
    city: '',
    district: '',
    detailAddress: '',
    postalCode: '',
    isDefault: 0,
  });
  showAddressDialog.value = false;
};

  const openAddAddress = () => {
    isEditAddress.value = false;
    resetAddressForm();
    addressPicker = createAddressPicker();
    showAddressDialog.value = true;
  };

  // ✅ 纯提交，不再做校验
  const saveAddress = async () => {
    const payload = { ...addressForm, ...addressPicker.getAddress() };
    payload.isDefault = Number(addressForm.isDefault);
    try {
      const res = isEditAddress.value
        ? await axios.put(`/address/update/${payload.addressId}`, payload)
        : await axios.post('/address/add', payload);
      if (res.data.code === 200) {
        showAddressDialog.value = false;
        resetAddressForm();
        await fetchAddresses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const editAddress = (addr) => {
    isEditAddress.value = true;
    addressPicker = createAddressPicker(addr);
    Object.assign(addressForm, {
      addressId: addr.addressId,
      receiverName: addr.receiverName,
      receiverPhone: addr.receiverPhone,
      province: addr.province,
      city: addr.city,
      district: addr.district,
      detailAddress: addr.detailAddress, // ← 同名
      postalCode: addr.postalCode,
      isDefault: Number(addr.isDefault),
    });
    showAddressDialog.value = true;
  };

  const setDefault = async (addr) => {
    await axios.post(`/address/setDefault/${addr.addressId}`);
    await fetchAddresses();
  };

  const removeAddress = async (addr) => {
    await axios.delete(`/address/delete/${addr.addressId}`);
    await fetchAddresses();
  };

  return {
    addresses,
    addressLoading,
    showAddressDialog,
    isEditAddress,
    addressForm,
    addressRules,
    regionOptions,
    addressPicker,
    fetchAddresses,
    openAddAddress,
    saveAddress,
    editAddress,
    setDefault,
    removeAddress,
    resetAddressForm,
  };
}