import React, { useState } from 'react';
import { X, Save, Sparkles } from 'lucide-react';
import { organizeTranscript, extractPeople, generateTags } from '../services/ai';
import { getEventTagNames } from '../services/tags';

/**
 * 文本输入弹窗
 *
 * 支持：
 * - 直接输入文本创建记录
 * - AI 转存（整理文本，提取人名和标签）
 */
const TextInput = ({ onClose, onSave }) => {
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [extractedPeople, setExtractedPeople] = useState([]);
  const [generatedTags, setGeneratedTags] = useState([]);

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

  // AI 转存（整理文本，提取人名和标签）
  const handleAITransfer = async () => {
    if (!text.trim()) {
      alert('请先输入一些内容');
      return;
    }

    setIsAIGenerating(true);
    try {
      // 获取预设事件标签
      const [allowedTags] = await Promise.all([
        getEventTagNames()
      ]);

      // 调用 AI 整理转写内容
      const organized = await organizeTranscript(text);

      // 提取人物
      const people = await extractPeople(text);

      // 生成标签
      const tags = await generateTags(text, allowedTags);

      //
      setExtractedPeople(people);
      setGeneratedTags(tags);

      // 用整理后的文本更新输入框
      setText(organized.organizedText);

      // 显示提取结果
      let message = 'AI 转存完成！';
      if (people.length > 0) {
        message += `\n识别到的人物：${people.join('、')}`;
      }
      if (tags.length > 0) {
        message += `\n事件标签：${tags.join('、')}`;
      }
      alert(message);
    } catch (err) {
      console.error('AI 转存失败:', err);
      alert('AI 转存失败，请重试');
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

        {/* 提取结果显示 */}
        {(extractedPeople.length > 0 || generatedTags.length > 0) && (
          <div className="mt-3 p-3 bg-warm-purpleBg rounded-lg">
            {extractedPeople.length > 0 && (
              <p className="text-sm text-warm-purple mb-1">
                人物：{extractedPeople.join('、')}
              </p>
            )}
            {generatedTags.length > 0 && (
              <p className="text-sm text-warm-purple">
                标签：{generatedTags.join('、')}
              </p>
            )}
          </div>
        )}

        {/* AI 转存按钮 */}
        <button
          onClick={handleAITransfer}
          disabled={isAIGenerating || !text.trim()}
          className="w-full mt-3 flex items-center justify-center gap-2 py-2 px-4 bg-[#897dbf] text-white rounded-lg hover:bg-[#6b5aa3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          {isAIGenerating ? 'AI 处理中...' : 'AI 转存'}
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
