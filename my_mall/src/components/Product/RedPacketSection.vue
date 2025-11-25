<template>
  <div
    class="discount-container"
    v-if="(redPackets && redPackets.length > 0) && !loading"
    aria-label="可领取红包"
  >
    <span class="discount-label">红包：</span>
    <div class="discount-list" role="list">
      <div
        class="discount-card redpacket"
        v-for="rp in redPackets"
        :key="'rp-' + getId(rp)"
        role="listitem"
      >
        <div class="discount-left">
          <div class="discount-amount">余额：¥{{ formatAmountLocal(rp.amount) }}</div>
        </div>
        <div class="discount-right">
          <el-tag v-if="isClaimed(rp)" type="success" size="small" class="claimed-badge">已领取</el-tag>
          <template v-else>
            <el-button
              v-if="isClaimable(rp)"
              size="small"
              type="danger"
              :loading="claimingRedPacketId === getId(rp)"
              @click="onClaim(rp)"
            >领取</el-button>
            <el-tag v-else type="info" size="small">{{ getStatusLabel(rp) }}</el-tag>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  redPackets: { type: Array, default: () => [] },
  myRedPacketIds: { type: Array, default: () => [] },
  claimingRedPacketId: { type: [Number, String, null], default: null },
  onClaim: { type: Function, required: true },
  loading: { type: Boolean, default: false },
});

const claimedSet = computed(() => new Set((props.myRedPacketIds || []).filter(Boolean)));

const getId = (rp) => rp?.id ?? rp?.packetId ?? null;
const isClaimed = (rp) => {
  const id = getId(rp);
  if (!id) return false;
  return claimedSet.value.has(id);
};
const formatAmountLocal = (amt) => {
  const n = Number(amt || 0);
  return n.toFixed(2);
};

// 领取资格与状态文案
const parseTs = (v) => {
  if (!v) return null;
  try {
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : null;
  } catch {
    return null;
  }
};
const isClaimable = (rp) => {
  const status = Number(rp?.status ?? 0) === 1;
  const remain = Number(rp?.remainingCount ?? 0) > 0;
  const now = Date.now();
  const st = parseTs(rp?.startTime);
  const et = parseTs(rp?.endTime);
  const startOk = st == null || st <= now;
  const endOk = et == null || et >= now;
  return status && remain && startOk && endOk;
};
const getStatusLabel = (rp) => {
  const now = Date.now();
  const st = parseTs(rp?.startTime);
  const et = parseTs(rp?.endTime);
  if (Number(rp?.status ?? 0) !== 1) return '已停用';
  if (st != null && st > now) return '未开始';
  if (et != null && et < now) return '已过期';
  if (Number(rp?.remainingCount ?? 0) <= 0) return '已抢光';
  return '不可领取';
};
</script>

<style scoped>
.discount-container {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.08);
  transition: all 0.3s ease;
}

.discount-container:hover {
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.12);
  transform: translateY(-1px);
}

.discount-label {
  font-size: 14px;
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 12px;
  display: block;
}

.discount-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.discount-card {
  background: white;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  min-width: 250px;
  flex: 1 1 calc(33.333% - 12px);
  max-width: calc(33.333% - 12px);
  box-sizing: border-box;
}

.discount-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(to bottom, #ef4444, #dc2626);
  border-radius: 4px 0 0 4px;
}

.discount-card:hover {
  border-color: #ef4444;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
  transform: translateY(-2px);
}

.discount-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.discount-amount {
  font-size: 16px;
  font-weight: 600;
  color: #dc2626;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.discount-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.claimed-badge {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  color: white;
  font-weight: 500;
  padding: 4px 8px;
  white-space: nowrap;
}

:deep(.el-button--danger) {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border: none;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

:deep(.el-button--danger:hover) {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

:deep(.el-button--danger:active) {
  transform: translateY(0);
}

:deep(.el-button--danger.is-loading) {
  opacity: 0.7;
  transform: none;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .discount-card {
    flex: 1 1 calc(50% - 12px);
    max-width: calc(50% - 12px);
  }
}

@media (max-width: 768px) {
  .discount-container {
    padding: 12px;
    margin: 12px 0;
  }
  
  .discount-list {
    gap: 10px;
  }
  
  .discount-card {
    flex: 1 1 100%;
    max-width: 100%;
    min-width: auto;
    padding: 10px 12px;
  }
  
  .discount-amount {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .discount-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .discount-right {
    align-self: flex-end;
  }
}

/* 动画效果 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.discount-card {
  animation: slideIn 0.3s ease-out;
}

.discount-card:nth-child(1) { animation-delay: 0.1s; }
.discount-card:nth-child(2) { animation-delay: 0.2s; }
.discount-card:nth-child(3) { animation-delay: 0.3s; }
.discount-card:nth-child(4) { animation-delay: 0.4s; }
.discount-card:nth-child(5) { animation-delay: 0.5s; }
</style>