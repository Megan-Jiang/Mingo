import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Calendar, Tag, Edit3, Gift, Trash2, Mic, FileText, X, Clock, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecorder } from '../hooks/useRecorder';
import { processAudio, generateTags } from '../services/ai';
import { createRecord, updateRecordFriendId, getRecordsByPerson } from '../services/records';
import { getEventTagNames } from '../services/tags';
import { getFriendsByNames, deleteFriend, updateFriendLastInteraction } from '../services/friends';
import PersonEditDialog from './PersonEditDialog';

const PersonDetail = ({ person, onBack, onUpdate, onDelete }) => {
  const [showEdit, setShowEdit] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // 录音相关状态
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [organizedText, setOrganizedText] = useState("");
  const [generatedTags, setGeneratedTags] = useState([]);
  const [hasRecorded, setHasRecorded] = useState(false);

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

  // 从 important_dates 中获取生日
  const getBirthday = () => {
    const festivals = person.important_dates || [];
    const birthday = festivals.find(f => f.name === '生日');
    return birthday ? { date: birthday.date, type: birthday.type } : null;
  };

  // 从 important_dates 中排除生日
  const getOtherFestivals = () => {
    const festivals = person.important_dates || [];
    return festivals.filter(f => f.name !== '生日');
  };

  // 获取互动记录
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const records = await getRecordsByPerson(person.name);
        // 转换为 events 格式
        const formattedEvents = records.map(record => ({
          id: record.id,
          date: record.created_at?.split('T')[0] || '',
          summary: record.summary || record.transcript || '暂无摘要',
          tags: record.tags || []
        }));
        setEvents(formattedEvents);
      } catch (err) {
        console.error('获取互动记录失败:', err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    if (person?.name) {
      fetchEvents();
    }
  }, [person]);

  const birthday = getBirthday();
  const otherFestivals = getOtherFestivals();

  // 删除朋友
  const handleDelete = async () => {
    if (!window.confirm(`确定要删除朋友 "${person.name}" 吗？相关的互动记录会变成未归档状态。`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteFriend(person.id, person.name);
      onDelete && onDelete();
      onBack();
    } catch (err) {
      console.error('删除朋友失败:', err);
      alert('删除失败，请重试');
    } finally {
      setIsDeleting(false);
    }
  };

  // 录音处理
  const handleStartRecording = useCallback(() => {
    setHasRecorded(false);
    setTranscript("");
    setOrganizedText("");
    setGeneratedTags([]);
    startRecording();
  }, [startRecording]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    setHasRecorded(true);
  }, [stopRecording]);

  // AI 转写处理
  const handleTranscribe = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);
    try {
      const allowedTags = await getEventTagNames();

      const result = await processAudio(audioBlob);

      // 生成标签
      const tagsResult = await generateTags(
        result.organizedText || result.transcript,
        allowedTags
      );

      setTranscript(result.transcript);
      setOrganizedText(result.organizedText || result.transcript);
      setGeneratedTags(tagsResult);
    } catch (err) {
      console.error("转写失败:", err);
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
      // 创建记录，自动关联该朋友
      const newRecord = await createRecord({
        transcript: transcript,
        summary: textToSave,
        people: [person.name],  // 直接使用该朋友的名字
        tags: generatedTags,
        unarchived_people: []
      });

      // 更新朋友的最后互动时间
      await updateFriendLastInteraction(person.id, newRecord.id);

      // 重置并关闭
      resetRecording();
      setHasRecorded(false);
      setTranscript("");
      setOrganizedText("");
      setGeneratedTags([]);
      setShowRecordDialog(false);

      // 刷新列表
      onUpdate && onUpdate();
      fetchEvents();
    } catch (err) {
      console.error('保存失败:', err);
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
      // AI 整理文本并生成标签
      const allowedTags = await getEventTagNames();
      const tagsResult = await generateTags(textInput, allowedTags);

      // 创建记录，自动关联该朋友
      const newRecord = await createRecord({
        transcript: '',
        summary: textInput,
        people: [person.name],  // 直接使用该朋友的名字
        tags: tagsResult,
        unarchived_people: []
      });

      // 更新朋友的最后互动时间
      await updateFriendLastInteraction(person.id, newRecord.id);

      // 重置并关闭
      setTextInput('');
      setShowTextDialog(false);

      // 刷新列表
      onUpdate && onUpdate();
      fetchEvents();
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败，请重试');
    } finally {
      setIsSavingText(false);
    }
  };

  // 格式化录音时间
  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (showEdit) {
    return (
      <PersonEditDialog
        person={person}
        onClose={() => setShowEdit(false)}
        onSave={onUpdate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-warm-cream px-5 pb-24">
        {/* 头部导航 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">朋友详情</h1>
          </div>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 hover:bg-red-50 rounded-full transition-colors text-red-500"
            title="删除朋友"
          >
            {isDeleting ? (
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* 基本信息卡片 */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 bg-warm-yellow rounded-full flex items-center justify-center shadow-md">
              <span className="text-2xl font-bold text-white">
                {person.name?.charAt(0) || '?'}
              </span>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">{person.name}</h2>
              {person.remark && (
                <p className="text-lg text-warm-purple mb-2">{person.remark}</p>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Calendar className="h-4 w-4 text-warm-purple" />
                <span>最近互动: {person.lastInteraction}</span>
              </div>

              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-400" />
                <div className="flex gap-1">
                  {(person.tags || []).map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-warm-purple/10 text-warm-purple text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowEdit(true)}
              className="p-2 hover:bg-warm-purple/10 rounded-full transition-colors"
            >
              <Edit3 className="h-5 w-5 text-warm-purple" />
            </button>
          </div>

          {/* 生日 */}
          {birthday && (
            <div className="border-t border-gray-100 pt-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-warm-purple" />
                <span>生日: {birthday.date} ({birthday.type === 'lunar' ? '农历' : '公历'})</span>
              </div>
            </div>
          )}

          {/* 重要节日 */}
          {otherFestivals.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Gift className="h-5 w-5 text-warm-purple" />
                重要节日
              </h3>
              <div className="space-y-2">
                {otherFestivals.map((festival, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-warm-cream rounded-lg">
                    <span className="text-gray-700">{festival.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-warm-purple">
                        {/* 兼容 date 字段和 monthDay 字段 */}
                        {festival.date || festival.monthDay}
                      </span>
                      <span className="text-xs text-gray-400">({festival.type === 'lunar' ? '农历' : '公历'})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 时间轴事件列表 */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b flex-shrink-0">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-warm-purple" />
              互动记录
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-warm-purple border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="border-l-4 border-warm-yellow pl-4 py-3 hover:bg-warm-cream rounded-r-lg transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-500">
                        {event.date}
                      </div>
                    </div>

                    <p className="text-gray-700 mb-2">{event.summary}</p>

                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-gray-400" />
                      <div className="flex gap-1">
                        {event.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-warm-purple/10 text-warm-purple text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>还没有互动记录</p>
              </div>
            )}
          </div>

          {/* 底部输入按钮 */}
          <div className="p-4 border-t flex-shrink-0 bg-white">
            <div className="flex gap-3">
              <motion.button
                onClick={() => setShowRecordDialog(true)}
                className="flex-1 py-3 bg-[#fcd753] shadow-lg rounded-xl flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Mic className="w-5 h-5 text-white" />
                <span className="text-gray-800 font-medium">添加录音</span>
              </motion.button>

              <motion.button
                onClick={() => setShowTextDialog(true)}
                className="flex-1 py-3 bg-warm-purple shadow-lg shadow-warm-purple/30 rounded-xl flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FileText className="w-5 h-5 text-white" />
                <span className="text-white font-medium">添加文字</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* 录音弹窗 */}
        <AnimatePresence>
          {showRecordDialog && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
              >
                {/* 录音弹窗头部 */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-800">录音记录</h2>
                  <button
                    onClick={() => {
                      resetRecording();
                      setShowRecordDialog(false);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* 录音内容 */}
                <div className="p-8 flex flex-col items-center">
                  {/* 大录音按钮 */}
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

                  {/* 录音后显示转写按钮 */}
                  {hasRecorded && !isTranscribing && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full"
                    >
                      <button
                        onClick={handleTranscribe}
                        className="w-full py-3 bg-warm-purple text-white rounded-xl mb-3 hover:bg-warm-purple/80 transition-colors"
                      >
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
                      <div className="animate-spin w-8 h-8 border-2 border-warm-purple border-t-transparent rounded-full mx-auto mb-2"></div>
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
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div
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
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="p-6">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="记录和 {person.name} 的互动..."
                    className="w-full h-40 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-warm-purple/30"
                  />

                  <button
                    onClick={handleSaveText}
                    disabled={isSavingText || !textInput.trim()}
                    className="w-full mt-4 py-3 bg-warm-purple text-white rounded-xl hover:bg-warm-purple/80 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSavingText ? '保存中...' : '保存'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
  );
};

export default PersonDetail;
