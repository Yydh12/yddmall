-- 为已有的 item_comments 表添加评论图片字段
ALTER TABLE `item_comments`
  ADD COLUMN `image_urls` TEXT NULL COMMENT '评论图片URL（逗号分隔）' AFTER `content`;