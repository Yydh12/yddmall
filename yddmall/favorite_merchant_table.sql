-- 用户收藏店铺表
CREATE TABLE IF NOT EXISTS `favorite_merchant` (
  `favorite_id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `merchant_id` BIGINT NOT NULL,
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_merchant` (`user_id`, `merchant_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_merchant` (`merchant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户收藏店铺表';