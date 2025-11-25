-- 购物车表结构
CREATE TABLE IF NOT EXISTS `cart` (
  `cart_id` bigint NOT NULL AUTO_INCREMENT COMMENT '购物车ID（主键，自增）',
  `user_id` bigint NOT NULL COMMENT '用户ID（关联用户表）',
  `item_id` bigint NOT NULL COMMENT '商品ID（关联商品表）',
  `sku_id` bigint NOT NULL COMMENT 'SKU ID（关联商品SKU表）',
  `product_name` varchar(255) NOT NULL COMMENT '商品名称',
  `sku_name` varchar(255) DEFAULT NULL COMMENT 'SKU名称（规格信息）',
  `product_image` varchar(500) DEFAULT NULL COMMENT '商品图片URL',
  `price` decimal(10,2) NOT NULL COMMENT '商品价格',
  `quantity` int NOT NULL DEFAULT '1' COMMENT '商品数量',
  `stock` int NOT NULL DEFAULT '0' COMMENT '商品库存（冗余字段，用于校验）',
  `selected` tinyint NOT NULL DEFAULT '0' COMMENT '是否选中（0-未选中，1-选中）',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态（0-正常，1-已删除）',
  PRIMARY KEY (`cart_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_sku_id` (`sku_id`),
  KEY `idx_item_id` (`item_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='购物车表';

-- 添加外键约束（可选，根据实际需求）
-- ALTER TABLE `cart` ADD CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);
-- ALTER TABLE `cart` ADD CONSTRAINT `fk_cart_item` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`);
-- ALTER TABLE `cart` ADD CONSTRAINT `fk_cart_sku` FOREIGN KEY (`sku_id`) REFERENCES `item_sku` (`sku_id`);