import { useState } from 'react';
import { X, Save, Users, Tag } from 'lucide-react';
import { updateRecordInfo } from '../services/records';

const RecordEditDialog = ({ record, onClose, onSave }) => {
  const [people, setPeople] = useState((record.people || []).join(', '));
  const [summary, setSummary] = useState(record.summary || record.transcript || '');
  const [tags, setTags] = useState((record.tags || []).join(', '));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 解析输入
      const peopleArray = people.split(',').map(p => p.trim()).filter(p => p);
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);

      await updateRecordInfo(record.id, {
        summary,
        people: peopleArray,
        tags: tagsArray
      });

      onSave && onSave();
      onClose();
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">编辑记录</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* 涉及人物 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              涉及人物
            </label>
            <input
              type="text"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              placeholder="多个用逗号分隔，如：张三, 李四"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-warm-purple/30"
            />
          </div>

          {/* 摘要 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              摘要
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="输入记录摘要..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-warm-purple/30 resize-none"
            />
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              标签
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="多个用逗号分隔，如：咖啡, 饭局"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-warm-purple/30"
            />
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-6 py-3 bg-warm-purple text-white rounded-xl hover:bg-warm-purple/80 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordEditDialog;
