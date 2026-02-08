-- Mingo 数据库迁移脚本
-- 添加 unarchived_people 字段支持未归档人物功能

-- 1. 为 records 表添加 unarchived_people 字段（JSONB 数组类型）
ALTER TABLE records ADD COLUMN IF NOT EXISTS unarchived_people JSONB DEFAULT '[]'::jsonb;

-- 2. 添加注释说明字段用途
COMMENT ON COLUMN records.unarchived_people IS '未归档的人物列表（JSON数组），用于标记识别出但尚未添加到朋友档案的人物';

-- 3. 如果需要，可以创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_records_unarchived_people ON records USING GIN (unarchived_people);

-- 4. 更新 RLS 策略（如果启用了行级安全）
-- 让用户可以读取和修改自己的 unarchived_people 字段

-- 5. 验证字段已添加
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'records' AND column_name = 'unarchived_people';
