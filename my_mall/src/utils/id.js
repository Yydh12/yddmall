// src/utils/id.js
// 统一从对象中提取主键ID，并规范为字符串，避免数字/字符串类型不一致导致的对比失败
export function getId(obj) {
  if (obj == null) return null;
  const id = obj.id ?? obj.couponId ?? obj.redPacketId ?? obj.packetId ?? obj.rpId;
  return id == null ? null : String(id);
}

// 可选：直接比较两个对象或值是否同一ID
export function sameId(a, b) {
  const A = typeof a === 'object' ? getId(a) : (a == null ? null : String(a));
  const B = typeof b === 'object' ? getId(b) : (b == null ? null : String(b));
  if (A == null || B == null) return false;
  return A === B;
}