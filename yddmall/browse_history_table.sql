-- 用户商品浏览足迹表
CREATE TABLE IF NOT EXISTS `browse_history` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `item_id` BIGINT NOT NULL,
  `sku_id` BIGINT NULL,
  `visited_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_user` (`user_id`),
  KEY `idx_user_visited` (`user_id`, `visited_at` DESC),
  KEY `idx_item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户商品浏览足迹表';