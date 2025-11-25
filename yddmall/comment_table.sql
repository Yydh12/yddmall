-- 商品评论表 DDL
CREATE TABLE IF NOT EXISTS `item_comments` (
  `comment_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '评论ID',
  `item_id` BIGINT NOT NULL COMMENT '商品ID',
  `sku_id` BIGINT NULL COMMENT 'SKU ID（可空）',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `rating` TINYINT NOT NULL COMMENT '评分（1-5）',
  `content` TEXT NOT NULL COMMENT '评论内容',
  `reply_content` TEXT NULL COMMENT '商家回复内容',
  `reply_time` TIMESTAMP NULL COMMENT '商家回复时间',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态（1-正常，0-隐藏）',
  `create_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`comment_id`),
  KEY `idx_item_id` (`item_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品评论表';