-- 折扣相关表结构（优惠券、红包、用户领取记录、金币钱包）
-- 使用MySQL数据库

-- 1. 优惠券表（平台发布）
CREATE TABLE IF NOT EXISTS `coupon` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '优惠券ID',
  `title` VARCHAR(100) NOT NULL COMMENT '标题',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
  `discount_type` TINYINT NOT NULL COMMENT '优惠类型：1-固定金额，2-折扣百分比',
  `discount_value` DECIMAL(10,2) NOT NULL COMMENT '优惠值：固定金额或百分比（如15表示15%）',
  `min_spend` DECIMAL(10,2) DEFAULT '0.00' COMMENT '使用门槛金额',
  `start_time` DATETIME DEFAULT NULL COMMENT '开始时间',
  `end_time` DATETIME DEFAULT NULL COMMENT '结束时间',
  `total_count` INT NOT NULL DEFAULT 0 COMMENT '发行总量',
  `remaining_count` INT NOT NULL DEFAULT 0 COMMENT '剩余可领数量',
  `per_user_limit` INT NOT NULL DEFAULT 1 COMMENT '每用户可领取次数',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用，0-停用',
  `created_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_time_window` (`start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='平台优惠券表';

-- 2. 用户优惠券表（用户领取/使用状态）
CREATE TABLE IF NOT EXISTS `user_coupon` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `coupon_id` BIGINT NOT NULL COMMENT '优惠券ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0-已领取，1-已使用，2-已过期',
  `claimed_at` DATETIME DEFAULT NULL COMMENT '领取时间',
  `used_at` DATETIME DEFAULT NULL COMMENT '使用时间',
  `order_no` VARCHAR(32) DEFAULT NULL COMMENT '使用订单号',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_coupon` (`user_id`, `coupon_id`),
  KEY `idx_status` (`status`),
  KEY `idx_order_no` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户优惠券领取记录';

-- 3. 红包表（商家发布）
CREATE TABLE IF NOT EXISTS `red_packet` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '红包ID',
  `merchant_id` BIGINT NOT NULL COMMENT '商家ID',
  `title` VARCHAR(100) NOT NULL COMMENT '标题',
  `amount` DECIMAL(10,2) NOT NULL DEFAULT '0.00' COMMENT '红包固定金额',
  `total_count` INT NOT NULL DEFAULT 0 COMMENT '发行总量',
  `remaining_count` INT NOT NULL DEFAULT 0 COMMENT '剩余可领数量',
  `per_user_limit` INT NOT NULL DEFAULT 1 COMMENT '每用户可领取次数',
  `start_time` DATETIME DEFAULT NULL COMMENT '开始时间',
  `end_time` DATETIME DEFAULT NULL COMMENT '结束时间',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用，0-停用',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_merchant` (`merchant_id`),
  KEY `idx_status` (`status`),
  KEY `idx_time_window` (`start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商家红包表';

-- 4. 用户红包表（用户领取/使用状态）
CREATE TABLE IF NOT EXISTS `user_red_packet` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `red_packet_id` BIGINT NOT NULL COMMENT '红包ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0-已领取，1-已使用，2-已过期',
  `claimed_at` DATETIME DEFAULT NULL COMMENT '领取时间',
  `used_at` DATETIME DEFAULT NULL COMMENT '使用时间',
  `order_no` VARCHAR(32) DEFAULT NULL COMMENT '使用订单号',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_red_packet` (`user_id`, `red_packet_id`),
  KEY `idx_status` (`status`),
  KEY `idx_order_no` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户红包领取记录';

-- 5. 用户金币钱包（签到与抵扣）
CREATE TABLE IF NOT EXISTS `user_coin_wallet` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '钱包ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `balance` BIGINT NOT NULL DEFAULT 0 COMMENT '金币余额（整数，1金币=¥0.01）',
  `last_sign_time` DATETIME DEFAULT NULL COMMENT '最后签到时间',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户金币钱包';