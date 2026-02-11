import { useState, useEffect } from 'react';
import { X, Calendar, Tag, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateFriend, createFriend } from '../services/friends';
import { getPersonTags, createPersonTag } from '../services/tags';

// 预设节日列表（包含月日）
const PRESET_FESTIVALS = [
  { name: '元旦', monthDay: '01-01', type: 'solar' },
  { name: '春节', monthDay: '01-01', type: 'lunar' },
  { name: '情人节', monthDay: '02-14', type: 'solar' },
  { name: '元宵节', monthDay: '01-15', type: 'lunar' },
  { name: '妇女节', monthDay: '03-08', type: 'solar' },
  { name: '清明节', monthDay: '04-04', type: 'solar' },
  { name: '端午节', monthDay: '05-05', type: 'lunar' },
  { name: '七夕', monthDay: '07-07', type: 'lunar' },
  { name: '中秋节', monthDay: '08-15', type: 'lunar' },
  { name: '重阳节', monthDay: '09-09', type: 'lunar' },
  { name: '国庆节', monthDay: '10-01', type: 'solar' },
  { name: '圣诞节', monthDay: '12-25', type: 'solar' },
  { name: '纪念日', monthDay: '', type: 'solar' },
];

const PersonEditDialog = ({ person, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    remark: '',
    tags: [],
    birthday: '',
    birthdayType: 'solar',
    important_dates: []
  });
  const [newTag, setNewTag] = useState('');
  const [existingTags, setExistingTags] = useState([]);
  const [showTagSelect, setShowTagSelect] = useState(false);
  const [saving, setSaving] = useState(false);

  // 加载现有人物标签
  useEffect(() => {
    const loadTags = async () => {
      const tags = await getPersonTags();
      setExistingTags(tags.map(t => t.name));
    };
    loadTags();
  }, []);

  // 初始化表单数据
  useEffect(() => {
    if (person) {
      const festivals = person.important_dates || [];
      const birthdayFestival = festivals.find(f => f.name === '生日');
      const otherFestivals = festivals.filter(f => f.name !== '生日');

      setFormData({
        name: person.name || '',
        remark: person.remark || '',
        tags: person.tags || [],
        birthday: person.birthday || '',
        birthdayType: birthdayFestival?.type || 'solar',
        important_dates: otherFestivals
      });
    }
  }, [person]);

  // 处理标签添加
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
      setShowTagSelect(false);
    }
  };

  // 从现有标签选择
  const handleSelectExistingTag = (tagName) => {
    if (!formData.tags.includes(tagName)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagName] }));
    }
    setShowTagSelect(false);
  };

  // 处理标签删除
  const handleRemoveTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  // 添加重要节日
  const handleAddFestival = (festival) => {
    if (!formData.important_dates.some(d => d.name === festival.name)) {
      setFormData(prev => ({
        ...prev,
        important_dates: [...prev.important_dates, { ...festival }]
      }));
    }
  };

  // 删除重要节日
  const handleRemoveFestival = (name) => {
    setFormData(prev => ({
      ...prev,
      important_dates: prev.important_dates.filter(d => d.name !== name)
    }));
  };

  // 处理保存
  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      // 同步新标签到 person_tags 表
      const newTags = formData.tags.filter(tag => !existingTags.includes(tag));
      for (const tag of newTags) {
        try {
          await createPersonTag(tag);
        } catch (e) {
          console.warn('创建标签失败:', e);
        }
      }

      // 组装完整的重要日期
      const allDates = [...formData.important_dates];
      if (formData.birthday) {
        // 月日格式转换为完整日期
        const fullDate = formData.birthday + '-01';
        allDates.unshift({
          name: '生日',
          date: fullDate,
          type: formData.birthdayType
        });
      }

      const friendData = {
        name: formData.name,
        remark: formData.remark,
        tags: formData.tags,
        birthday: formData.birthday ? formData.birthday + '-01' : null,
        important_dates: allDates
      };

      if (person && person.id) {
        // 编辑现有朋友
        await updateFriend(person.id, friendData);
      } else {
        // 创建新朋友
        await createFriend(friendData);
      }

      onSave && onSave();
      onClose();
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">编辑朋友</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* 表单内容 */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
            {/* 姓名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-warm-purple/30 focus:border-warm-purple outline-none transition-all"
                placeholder="输入姓名"
              />
            </div>

            {/* 备注 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                备注名称
              </label>
              <input
                type="text"
                value={formData.remark}
                onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-warm-purple/30 focus:border-warm-purple outline-none transition-all"
                placeholder="输入备注（如：小明、大学同学）"
              />
            </div>

            {/* 生日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                生日
              </label>
              <div className="flex gap-2">
                <input
                  type="month"
                  value={formData.birthday}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-warm-purple/30 focus:border-warm-purple outline-none transition-all"
                />
                <select
                  value={formData.birthdayType}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthdayType: e.target.value }))}
                  className="px-3 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-warm-purple/30 focus:border-warm-purple outline-none bg-white"
                >
                  <option value="solar">公历</option>
                  <option value="lunar">农历</option>
                </select>
              </div>
            </div>

            {/* 标签 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签
              </label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-warm-purple/10 text-warm-purple rounded-full text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* 现有标签选择 */}
              {showTagSelect && existingTags.length > 0 && (
                <div className="mb-2 p-3 bg-gray-50 rounded-xl max-h-32 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {existingTags
                      .filter(t => !formData.tags.includes(t))
                      .map((tag, index) => (
                        <button
                          key={index}
                          onClick={() => handleSelectExistingTag(tag)}
                          className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm hover:bg-warm-purple/10 transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => {
                    setNewTag(e.target.value);
                    setShowTagSelect(e.target.value === '' && existingTags.length > 0);
                  }}
                  onFocus={() => setShowTagSelect(newTag === '' && existingTags.length > 0)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder={showTagSelect ? '选择现有标签或输入新标签' : '输入新标签'}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-warm-purple/30 focus:border-warm-purple outline-none transition-all"
                />
                <button
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                  className="px-4 py-2 bg-warm-purple text-white rounded-xl hover:bg-warm-purple/80 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 重要节日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                重要节日
              </label>

              {/* 已选节日 */}
              {formData.important_dates.length > 0 && (
                <div className="space-y-2 mb-3">
                  {formData.important_dates.map((festival, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg"
                    >
                      <span className="text-gray-700">{festival.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{festival.monthDay || festival.date}</span>
                        <span className="text-xs text-gray-400">({festival.type === 'lunar' ? '农历' : '公历'})</span>
                        <button
                          onClick={() => handleRemoveFestival(festival.name)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 预设节日选择 */}
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-3">点击添加节日</p>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_FESTIVALS.filter(f => f.name !== '生日').map((festival, index) => {
                    const isSelected = formData.important_dates.some(d => d.name === festival.name);
                    return (
                      <button
                        key={index}
                        onClick={() => isSelected ? handleRemoveFestival(festival.name) : handleAddFestival(festival)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          isSelected
                            ? 'bg-warm-purple text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {festival.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex gap-3 px-6 py-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formData.name.trim()}
              className="flex-1 px-6 py-3 bg-warm-purple text-white rounded-xl hover:bg-warm-purple/80 disabled:opacity-50 transition-colors"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PersonEditDialog;
