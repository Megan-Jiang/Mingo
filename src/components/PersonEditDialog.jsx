import { useState, useEffect, useRef } from 'react';
import { X, Plus, ChevronDown, Mic, FileText, X as XIcon, Save, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateFriend, createFriend } from '../services/friends';
import { getPersonTags, createPersonTag } from '../services/tags';
import { processAudio, generateTags } from '../services/ai';
import { createRecord } from '../services/records';
import { getEventTagNames } from '../services/tags';
import { useRecorder } from '../hooks/useRecorder';

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
];

// 获取默认节日
const getDefaultFestivals = () => {
  const savedHolidays = localStorage.getItem('defaultHoliday');
  let defaultHolidays = ['春节'];
  try {
    defaultHolidays = savedHolidays ? JSON.parse(savedHolidays) : ['春节'];
  } catch {
    defaultHolidays = ['春节'];
  }
  return PRESET_FESTIVALS.filter(f => defaultHolidays.includes(f.name));
};

const PersonEditDialog = ({ person, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    remark: '',
    tags: [],
    birthdayMonth: '',
    birthdayDay: '',
    birthdayType: 'solar',
    important_dates: []
  });
  const [newTag, setNewTag] = useState('');
  const [existingTags, setExistingTags] = useState([]);
  const [showTagSelect, setShowTagSelect] = useState(false);
  const [showFestivalDropdown, setShowFestivalDropdown] = useState(false);
  const [saving, setSaving] = useState(false);

  // 录音相关状态
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [organizedText, setOrganizedText] = useState('');
  const [generatedTags, setGeneratedTags] = useState([]);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [quickRecord, setQuickRecord] = useState(false); // 快速录音模式

  // 文字输入相关状态
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isSavingText, setIsSavingText] = useState(false);

  const {
    isRecording,
    recordingTime,
    audioBlob,
    startRecording,
    stopRecording,
    resetRecording
  } = useRecorder();

  const festivalDropdownRef = useRef(null);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (festivalDropdownRef.current && !festivalDropdownRef.current.contains(event.target)) {
        setShowFestivalDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      let month = '', day = '';
      if (birthdayFestival?.monthDay) {
        const parts = birthdayFestival.monthDay.split('-');
        month = parts[0] || '';
        day = parts[1] || '';
      } else if (birthdayFestival?.date) {
        const parts = birthdayFestival.date.split('-');
        month = parts[1] || '';
        day = parts[2] || '';
      }

      setFormData({
        name: person.name || '',
        remark: person.remark || '',
        tags: person.tags || [],
        birthdayMonth: month,
        birthdayDay: day,
        birthdayType: birthdayFestival?.type || 'solar',
        important_dates: otherFestivals
      });
    } else {
      setFormData(prev => ({
        ...prev,
        important_dates: getDefaultFestivals()
      }));
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

  // 格式化录音时间
  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 录音开始
  const handleStartRecording = () => {
    setHasRecorded(false);
    setTranscript('');
    setOrganizedText('');
    setGeneratedTags([]);
    startRecording();
  };

  // 录音停止
  const handleStopRecording = () => {
    stopRecording();
    setHasRecorded(true);
    // 快速录音模式下自动转写
    if (quickRecord && audioBlob) {
      handleTranscribe();
    }
  };

  // AI 转写处理
  const handleTranscribe = async () => {
    if (!audioBlob) return;
    setIsTranscribing(true);
    try {
      const allowedTags = await getEventTagNames();
      const result = await processAudio(audioBlob);
      const tagsResult = await generateTags(
        result.organizedText || result.transcript,
        allowedTags
      );
      setTranscript(result.transcript);
      setOrganizedText(result.organizedText || result.transcript);
      setGeneratedTags(tagsResult);
    } catch (err) {
      console.error('转写失败:', err);
      alert(`转写失败: ${err.message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  // 保存录音记录
  const handleSaveRecording = async () => {
    const textToSave = organizedText || transcript;
    if (!textToSave.trim()) {
      alert('没有可保存的内容');
      return;
    }
    setIsTranscribing(true);
    try {
      const newRecord = await createRecord({
        transcript: transcript,
        summary: textToSave,
        people: [formData.name],
        tags: generatedTags.length > 0 ? generatedTags : ['未分类'],
        unarchived_people: []
      });
      console.log('录音记录已保存:', newRecord);
      alert('记录已保存！');
      resetRecording();
      setShowRecordDialog(false);
      setHasRecorded(false);
      setTranscript('');
      setOrganizedText('');
      setGeneratedTags([]);
      setQuickRecord(false);
    } catch (err) {
      console.error('保存录音记录失败:', err);
      alert('保存失败，请重试');
    } finally {
      setIsTranscribing(false);
    }
  };

  // 保存文字记录
  const handleSaveText = async () => {
    if (!textInput.trim()) {
      alert('请输入内容');
      return;
    }
    setIsSavingText(true);
    try {
      const allowedTags = await getEventTagNames();
      const tagsResult = await generateTags(textInput, allowedTags);
      const newRecord = await createRecord({
        transcript: '',
        summary: textInput,
        people: [formData.name],
        tags: tagsResult.length > 0 ? tagsResult : ['未分类'],
        unarchived_people: []
      });
      console.log('文字记录已保存:', newRecord);
      alert('记录已保存！');
      setTextInput('');
      setShowTextDialog(false);
    } catch (err) {
      console.error('保存文字记录失败:', err);
      alert('保存失败，请重试');
    } finally {
      setIsSavingText(false);
    }
  };

  // 保存逻辑
  const saveFriend = async () => {
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      const newTags = formData.tags.filter(tag => !existingTags.includes(tag));
      for (const tag of newTags) {
        try {
          await createPersonTag(tag);
        } catch (e) {
          console.warn('创建标签失败:', e);
        }
      }

      const allDates = [...formData.important_dates];
      if (formData.birthdayMonth && formData.birthdayDay) {
        const monthDay = `${formData.birthdayMonth}-${formData.birthdayDay}`;
        allDates.unshift({
          name: '生日',
          monthDay: monthDay,
          type: formData.birthdayType
        });
      }

      const friendData = {
        name: formData.name,
        remark: formData.remark,
        tags: formData.tags,
        birthday: formData.birthdayMonth && formData.birthdayDay
          ? `${formData.birthdayMonth}-${formData.birthdayDay}`
          : null,
        important_dates: allDates
      };

      if (person && person.id) {
        await updateFriend(person.id, friendData);
      } else {
        await createFriend(friendData);
      }

      onSave && onSave();
      return true;
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败，请重试');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // 保存并关闭
  const handleSave = async () => {
    const success = await saveFriend();
    if (success) {
      onClose();
    }
  };

  // 保存并继续添加
  const handleSaveAndContinue = async () => {
    const success = await saveFriend();
    if (success) {
      setFormData(prev => ({
        ...prev,
        name: ''
      }));
      setNewTag('');
    }
  };

  return (
    <AnimatePresence>
      {/* 主表单弹窗 */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          key="main-form"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">
              {person ? '编辑朋友' : '添加朋友'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* 表单内容 */}
          <div className="p-5 space-y-4">
            {/* 第一行：姓名和备注 */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-warm-purple/30 focus:border-warm-purple outline-none transition-all text-sm"
                  placeholder="姓名"
                  autoFocus
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  备注
                </label>
                <input
                  type="text"
                  value={formData.remark}
                  onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-warm-purple/30 focus:border-warm-purple outline-none transition-all text-sm"
                  placeholder="备注"
                />
              </div>
            </div>

            {/* 第二行：标签 */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                标签
              </label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-warm-purple/10 text-warm-purple rounded-full text-xs"
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
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-warm-purple/30 focus:border-warm-purple outline-none transition-all text-sm"
                  placeholder="当前的身份 or 和我的关系"
                />
                <button
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                  className="px-3 py-2 bg-warm-purple text-white rounded-xl hover:bg-warm-purple/80 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {showTagSelect && existingTags.length > 0 && (
                <div className="mt-2 p-2 bg-gray-50 rounded-xl max-h-24 overflow-y-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {existingTags
                      .filter(t => !formData.tags.includes(t))
                      .map((tag, index) => (
                        <button
                          key={index}
                          onClick={() => handleSelectExistingTag(tag)}
                          className="px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs hover:bg-warm-purple/10 transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* 第三行：生日和重要节日 */}
            <div className="flex gap-3">
              {/* 生日：月/日/公历/农历 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  生日
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={formData.birthdayMonth}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                      setFormData(prev => ({ ...prev, birthdayMonth: val }));
                    }}
                    className="w-14 px-2 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-warm-purple/30 focus:border-warm-purple outline-none transition-all text-sm text-center"
                    placeholder="月"
                  />
                  <span className="flex items-center text-gray-400">/</span>
                  <input
                    type="text"
                    value={formData.birthdayDay}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                      setFormData(prev => ({ ...prev, birthdayDay: val }));
                    }}
                    className="w-14 px-2 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-warm-purple/30 focus:border-warm-purple outline-none transition-all text-sm text-center"
                    placeholder="日"
                  />
                  <select
                    value={formData.birthdayType}
                    onChange={(e) => setFormData(prev => ({ ...prev, birthdayType: e.target.value }))}
                    className="px-2 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-warm-purple/30 focus:border-warm-purple outline-none bg-white text-xs"
                  >
                    <option value="solar">公历</option>
                    <option value="lunar">农历</option>
                  </select>
                </div>
              </div>

              {/* 重要节日：多选下拉框 */}
              <div className="flex-1 relative" ref={festivalDropdownRef}>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  重要节日
                </label>
                <button
                  onClick={() => setShowFestivalDropdown(!showFestivalDropdown)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-warm-purple/30 focus:border-warm-purple outline-none transition-all bg-white flex items-center justify-between text-left"
                >
                  <span className="text-sm truncate">
                    {formData.important_dates.length > 0
                      ? formData.important_dates.map(d => d.name).join('、')
                      : '选择节日'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showFestivalDropdown ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showFestivalDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto"
                    >
                      {PRESET_FESTIVALS.map((festival, index) => {
                        const isSelected = formData.important_dates.some(d => d.name === festival.name);
                        return (
                          <button
                            key={index}
                            onClick={() => isSelected ? handleRemoveFestival(festival.name) : handleAddFestival(festival)}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${
                              isSelected ? 'bg-warm-purple/5' : ''
                            }`}
                          >
                            <span>{festival.name}</span>
                            {isSelected && <span className="text-warm-purple">✓</span>}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* 添加录音和添加文字按钮（仅新增朋友时显示，在表单内部） */}
          {!person && formData.name.trim() && (
            <div className="flex gap-3 px-1">
              <motion.button
                onClick={() => {
                  setQuickRecord(true);
                  setShowRecordDialog(true);
                  // 延迟开始录音，确保弹窗打开后再开始
                  setTimeout(() => startRecording(), 100);
                }}
                disabled={saving}
                className="flex-1 px-4 py-2.5 border border-[#fcd753] text-gray-800 rounded-xl hover:bg-[#fcd753]/10 transition-colors text-sm flex items-center justify-center gap-1"
                whileTap={{ scale: 0.98 }}
              >
                <Mic className="w-4 h-4" />
                添加录音
              </motion.button>
              <motion.button
                onClick={() => setShowTextDialog(true)}
                disabled={saving}
                className="flex-1 px-4 py-2.5 border border-warm-purple text-warm-purple rounded-xl hover:bg-warm-purple/10 transition-colors text-sm flex items-center justify-center gap-1"
                whileTap={{ scale: 0.98 }}
              >
                <FileText className="w-4 h-4" />
                添加文字
              </motion.button>
            </div>
          )}

          {/* 底部按钮 */}
          <div className="flex gap-3 px-5 py-4 border-t bg-gray-50">
            {!person && (
              <motion.button
                onClick={handleSaveAndContinue}
                disabled={saving || !formData.name.trim()}
                className="flex-1 px-4 py-2.5 border border-warm-purple text-warm-purple rounded-xl hover:bg-warm-purple/5 disabled:opacity-50 transition-colors text-sm"
                whileTap={{ scale: 0.98 }}
              >
                {saving ? '保存中...' : '保存并继续添加'}
              </motion.button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !formData.name.trim()}
              className="flex-1 px-4 py-2.5 bg-warm-purple text-white rounded-xl hover:bg-warm-purple/80 disabled:opacity-50 transition-colors text-sm"
            >
              {saving ? '保存中...' : (person ? '保存' : '完成')}
            </button>
          </div>
        </motion.div>
      </div>

      {/* 录音弹窗 */}
      <AnimatePresence>
        {showRecordDialog && (
          <div key="record-dialog-overlay" className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <motion.div
              key="record-dialog"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">录音记录</h2>
                <button
                  onClick={() => {
                    resetRecording();
                    setShowRecordDialog(false);
                    setHasRecorded(false);
                    setTranscript('');
                    setOrganizedText('');
                    setGeneratedTags([]);
                    setQuickRecord(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-8 flex flex-col items-center">
                <motion.button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className={`w-28 h-28 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? 'bg-red-500 animate-pulse'
                      : 'bg-[#fcd753] hover:bg-[#e6c24a]'
                  } shadow-xl mb-6`}
                  whileTap={{ scale: 0.95 }}
                >
                  {isRecording ? (
                    <div className="text-white text-center">
                      <Mic className="w-10 h-10 mx-auto mb-1" />
                      <span className="text-sm">{formatRecordingTime(recordingTime)}</span>
                    </div>
                  ) : (
                    <Mic className="w-10 h-10 text-white" />
                  )}
                </motion.button>

                <p className="text-gray-500 mb-4">
                  {isRecording ? '点击停止录音' : '点击开始录音'}
                </p>

                {hasRecorded && !isTranscribing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full"
                  >
                    <button
                      onClick={handleTranscribe}
                      className="w-full py-3 bg-warm-purple text-white rounded-xl mb-3 hover:bg-warm-purple/80 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      AI 转写
                    </button>

                    {(organizedText || transcript) && (
                      <>
                        <div className="bg-warm-cream rounded-xl p-4 mb-4 text-left">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {organizedText || transcript}
                          </p>
                          {generatedTags.length > 0 && (
                            <div className="flex gap-2 mt-3 flex-wrap">
                              {generatedTags.map((tag, idx) => (
                                <span key={idx} className="px-2 py-1 bg-warm-purple/10 text-warm-purple rounded-full text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={handleSaveRecording}
                          className="w-full py-3 bg-[#fcd753] text-gray-800 rounded-xl hover:bg-[#e6c24a] transition-colors flex items-center justify-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          保存记录
                        </button>
                      </>
                    )}
                  </motion.div>
                )}

                {isTranscribing && (
                  <div className="text-center py-4">
                    <img
                      src="/images/cat_jump.gif"
                      alt="AI 处理中..."
                      className="w-12 h-12 mx-auto mb-2"
                    />
                    <p className="text-gray-500">AI 处理中...</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 文字输入弹窗 */}
      <AnimatePresence>
        {showTextDialog && (
          <div key="text-dialog-overlay" className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <motion.div
              key="text-dialog"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">文字记录</h2>
                <button
                  onClick={() => {
                    setTextInput('');
                    setShowTextDialog(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={`记录和 ${formData.name || '朋友'} 的互动...`}
                  className="w-full h-40 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-warm-purple/30"
                />

                <button
                  onClick={handleSaveText}
                  disabled={isSavingText || !textInput.trim()}
                  className="w-full mt-4 py-3 bg-warm-purple text-white rounded-xl hover:bg-warm-purple/80 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isSavingText ? (
                    <img
                      src="/images/cat_jump.gif"
                      alt=""
                      className="w-4 h-4"
                    />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSavingText ? '保存中...' : '保存'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default PersonEditDialog;
