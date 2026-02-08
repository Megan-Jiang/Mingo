# Mingo 后端开发待办

## 现有表结构

### 1. records（社交记录表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 用户ID（关联 auth.users） |
| friend_id | uuid | 朋友ID（可选，关联 friends 表） |
| content | text | 整理后的记录内容 |
| transcript | text | 原始语音转写文本 |
| summary | text | AI 生成的摘要 |
| people | jsonb | 涉及的人物列表 |
| tags | jsonb | 事件标签列表 |
| unarchived_people | jsonb | 未归档的人物列表 |
| audio_url | text | 录音文件URL（可选） |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

### 2. friends（朋友表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 用户ID（关联 auth.users） |
| name | text | 朋友姓名 |
| remark | text | 备注名称 |
| tags | jsonb | 人物标签列表 |
| birthday | date | 生日（可选） |
| important_dates | jsonb | 重要日期 {节日: 日期} |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

### 3. person_tags（人物标签表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 用户ID（关联 auth.users） |
| name | text | 标签名称 |
| created_at | timestamptz | 创建时间 |

### 4. event_tags（事件标签表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 用户ID（关联 auth.users） |
| name | text | 标签名称 |
| created_at | timestamptz | 创建时间 |

---

## 待实现功能

### 优先级高
- [ ] AI 对话功能
- [ ] 祝福语生成 API
- [ ] 用户认证完善

### 优先级中
- [ ] 节日提醒功能
- [ ] 数据导出功能
- [ ] 统计分析 API

### 优先级低
- [ ] 多设备同步
- [ ] 数据备份


## 任务列表
### 任务1
- [x] 实现从未归档人物自动添加到人物标签的功能（在 RecentRecords 中点击添加）

### 任务2
- 点击朋友界面卡片的编辑按钮时，弹出详细的界面，支持对以下内容进行修改。
    | name | text | 朋友姓名 |
    | remark | text | 备注名称 |
    | tags | jsonb | 人物标签列表 |
    | birthday | date | 生日（可选） |
    | important_dates | jsonb | 重要日期 {节日: 日期} |
- 重要节日可以是标签形式，添加时支持下拉列表。
- 生日处理成年月日，公历/农历。

### 任务3
- 朋友姓名修改后，保存失败。
- 人物标签列表支持从getPersonTags中选择，也可以自定义新建。新建后同步到PersonTags表中。
- 生日默认只有月日，忽略年；
- 重要节日不要年月日。

### 任务4
- [x] 生日默认只设置 月/日 公历/农历
- [x] 朋友姓名修改后，同步更新 records 表中相关记录的 people 字段

### 任务5
- [x] 最近列表中，未归档的人物，归档之后清除 unarchived_people，不再显示红色
- [x] 归档记录后自动更新朋友的最后互动时间

### 任务6
- [x] 朋友卡片界面，生日只需设置月/日 公历/农历 ✅
- [x] 朋友卡片界面中的互动记录从 records 表获取真实数据
- [x] 最近列表每个卡片可以点击查看详情


### 任务7
- [x] 删除顶部月周日切换按钮
- [x] 使用按月加载的方式得到数据

### 任务8
- [x] 自动把重要节日使用当前年份的公历日期显示

### 任务9
日历界面：
日历板块：可以显示公历节日，无法显示农历节日和朋友生日
重要日期板块：无显示


### 任务10
完成祝福界面的更新
获取到所有朋友的重要节日，按从近到远的时间顺序排列。