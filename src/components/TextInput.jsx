import React, { useState } from 'react';
import { X, Save, Sparkles } from 'lucide-react';

/**
 * 文本输入弹窗
 *
 * 支持：
 * - 直接输入文本创建记录
 * - AI 优化文本（后续接入）
 */
const TextInput = ({ onClose, onSave }) => {
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  // 简单统计
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleSave = async () => {
    if (!text.trim()) {
      alert('请输入内容');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(text);
      onClose();
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // AI 优化（模拟）
  const handleAIGenerate = async () => {
    if (!text.trim()) {
      alert('请先输入一些内容');
      return;
    }

    setIsAIGenerating(true);
    try {
      // TODO: 调用 AI 接口优化
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 模拟 AI 润色
      const aiText = `今天的交流：${text}\n\n记录要点：\n- 互动时间：刚刚\nn- 涉及话题：日常交流\n- 情感状态：积极`;
      setText(aiText);
    } catch (err) {
      console.error('AI 生成失败:', err);
      alert('AI 生成失败，请重试');
    } finally {
      setIsAIGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">文本记录</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* 输入区域 */}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入今天的交流内容..."
            className="w-full h-48 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-[#fcd753] focus:ring-2 focus:ring-[#fcd753]/20 text-gray-800 placeholder-gray-400"
            autoFocus
          />

          {/* 字数统计 */}
          <div className="absolute bottom-3 right-3 text-xs text-gray-400">
            {charCount} 字 / {wordCount} 词
          </div>
        </div>

        {/* AI 辅助按钮 */}
        <button
          onClick={handleAIGenerate}
          disabled={isAIGenerating || !text.trim()}
          className="w-full mt-3 flex items-center justify-center gap-2 py-2 px-4 bg-[#897dbf] text-white rounded-lg hover:bg-[#6b5aa3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          {isAIGenerating ? 'AI 处理中...' : 'AI 辅助优化'}
        </button>

        {/* 底部按钮 */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !text.trim()}
            className="flex-1 py-2 px-4 bg-[#fcd753] text-gray-800 rounded-lg hover:bg-[#e6c24a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextInput;
