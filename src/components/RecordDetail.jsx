import { useEffect, useState } from 'react';
import { X, Clock, Users, Tag, Calendar, Play, Edit3, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RecordEditDialog from './RecordEditDialog';

const RecordDetail = ({ record, onClose, onEdit, onDelete }) => {
  const [showEdit, setShowEdit] = useState(false);

  if (!record) return null;

  const { date, time } = formatDateTime(record.created_at);
  const summary = record.summary || record.transcript || '暂无摘要';
  const people = record.people || [];
  const tags = record.tags || [];
  const transcript = record.transcript || '';

  if (showEdit) {
    return (
      <RecordEditDialog
        record={record}
        onClose={() => setShowEdit(false)}
        onSave={onEdit}
        onDelete={onDelete}
      />
    );
  }

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
            <h2 className="text-xl font-semibold text-gray-800">记录详情</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEdit(true)}
                className="p-2 hover:bg-warm-purple/10 rounded-full transition-colors text-warm-purple"
                title="编辑"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* 内容 */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
            {/* 时间信息 */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{time}</span>
              </div>
            </div>

            {/* 涉及人物 */}
            {people.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  涉及人物
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {people.map((person, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-warm-purple/10 text-warm-purple rounded-full text-sm"
                    >
                      {person}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 摘要 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">摘要</h3>
              <p className="text-gray-600 leading-relaxed">{summary}</p>
            </div>

            {/* 原始转写 */}
            {transcript && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">原始转写</h3>
                <p className="text-gray-500 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl">
                  {transcript}
                </p>
              </div>
            )}

            {/* 标签 */}
            {tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  标签
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-warm-yellow/20 text-warm-purple rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="flex gap-3 px-6 py-4 border-t bg-gray-50">
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm('确定要删除这条记录吗？此操作不可恢复。')) {
                    onDelete();
                  }
                }}
                className="px-4 py-3 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
            >
              关闭
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const formatDateTime = (createdAt) => {
  if (!createdAt) {
    return { date: '-', time: '-' };
  }
  const date = new Date(createdAt);
  const dateStr = date.toLocaleDateString('zh-CN');
  const timeStr = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return { date: dateStr, time: timeStr };
};

export default RecordDetail;
