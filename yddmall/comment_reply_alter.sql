-- 为已有的 item_comments 表添加商家回复相关字段
ALTER TABLE `item_comments`
  ADD COLUMN `reply_content` TEXT NULL COMMENT '商家回复内容' AFTER `content`,
  ADD COLUMN `reply_time` TIMESTAMP NULL COMMENT '商家回复时间' AFTER `reply_content`;