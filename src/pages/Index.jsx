import React, { useState, useCallback } from 'react';
import { Mic, MicOff, Image, Edit3 } from 'lucide-react';
import { useRecorder } from '../hooks/useRecorder';
import { createRecord } from '../services/records';
import RecordButton from '../components/RecordButton';
import RecentRecords from '../components/RecentRecords';
import ImageUpload from '../components/ImageUpload';
import TextInput from '../components/TextInput';

const Index = () => {
  const {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    resetRecording
  } = useRecorder();
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleStartRecording = useCallback(async () => {
    setHasRecorded(false);
    setTranscript('');
    await startRecording();
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
      // TODO: 调用实际的 AI 转写 API
      // 这里先模拟一个返回
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockTranscript = '今天和小明一起喝了咖啡，聊了聊最近的工作和生活。他说他最近在做一个新项目，压力挺大的。我们还讨论了周末去爬山的计划。';

      setTranscript(mockTranscript);
    } catch (err) {
      console.error('转写失败:', err);
      alert('转写失败，请重试');
    } finally {
      setIsTranscribing(false);
    }
  };

  // 保存记录
  const handleSave = async () => {
    if (!audioBlob) return;

    setIsSaving(true);
    try {
      // 直接创建记录（不保存录音文件到 Storage，节省空间）
      const record = {
        transcript: transcript || '暂无转写',
        summary: transcript ? `录音转写：${transcript.slice(0, 100)}...` : '',
        people: extractPeopleFromTranscript(transcript),
        events: [],
        tags: generateTagsFromTranscript(transcript)
      };

      await createRecord(record);

      // 重置状态
      setHasRecorded(false);
      setTranscript('');
      resetRecording();

      alert('保存成功！');
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 从转写文本中提取人物（简单实现，后续由AI完善）
  const extractPeopleFromTranscript = (text) => {
    if (!text) return [];
    // 简单规则：常见的称呼词后面可能是人名
    // TODO: 后续由 AI 精确提取
    return [];
  };

  // 从转写文本生成标签
  const generateTagsFromTranscript = (text) => {
    if (!text) return [];
    // TODO: 后续由 AI 精确生成
    return ['未分类'];
  };

  // 重新录音
  const handleReRecord = () => {
    setHasRecorded(false);
    setTranscript('');
    resetRecording();
  };

  // 文本输入保存
  const handleTextSave = async (text) => {
    setIsSaving(true);
    try {
      const record = {
        transcript: text,
        summary: `文本记录：${text.slice(0, 50)}...`,
        people: extractPeopleFromTranscript(text),
        events: [],
        tags: generateTagsFromTranscript(text)
      };

      await createRecord(record);
      alert('保存成功！');
    } catch (err) {
      console.error('保存失败:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // 格式化时间显示
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background-custom">
      <div className="container mx-auto px-4 py-8 pb-24">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Nice to meet you
          </h1>
          <p className="text-gray-600">记录你的社交互动</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error === 'Permission denied' ? '请允许麦克风权限' : `录音失败: ${error}`}
          </div>
        )}

        {/* 主录音区域 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="text-center">
            <RecordButton
              isRecording={isRecording}
              recordingTime={recordingTime}
              onStart={handleStartRecording}
              onStop={handleStopRecording}
            />

            {/* 录音中显示计时器 */}
            {isRecording && (
              <div className="mt-4">
                <div className="text-2xl font-mono text-red-500">
                  {formatTime(recordingTime)}
                </div>
                <p className="text-sm text-gray-500 mt-1">最长录制1分钟</p>
              </div>
            )}

            {/* 录音完成后显示播放和操作按钮 */}
            {!isRecording && audioUrl && (
              <div className="mt-4 space-y-4">
                {/* 播放器 */}
                <div className="bg-gray-100 rounded-lg p-4">
                  <audio controls src={audioUrl} className="w-full" />
                </div>

                {/* 转写结果显示 */}
                {transcript && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 text-left">
                    <p className="text-sm text-gray-600 mb-1">转写内容：</p>
                    <p className="text-gray-800">{transcript}</p>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex justify-center gap-3">
                  <button
                    onClick={handleReRecord}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    disabled={isSaving}
                  >
                    重新录音
                  </button>

                  {!transcript ? (
                    <button
                      onClick={handleTranscribe}
                      disabled={isTranscribing}
                      className="px-4 py-2 bg-[#897dbf] text-white rounded-lg hover:bg-[#6b5aa3] disabled:opacity-50"
                    >
                      {isTranscribing ? '转写中...' : 'AI转写'}
                    </button>
                  ) : (
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-[#fcd753] text-gray-800 rounded-lg hover:bg-[#e6c24a] disabled:opacity-50"
                    >
                      {isSaving ? '保存中...' : '保存'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 功能按钮 */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setShowImageUpload(true)}
            className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-md hover:shadow-lg transition-shadow"
          >
            <Image className="h-5 w-5 text-[#897dbf]" />
            <span className="text-gray-700">上传图片</span>
          </button>
          
          <button
            onClick={() => setShowTextInput(true)}
            className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-md hover:shadow-lg transition-shadow"
          >
            <Edit3 className="h-5 w-5 text-[#897dbf]" />
            <span className="text-gray-700">文本输入</span>
          </button>
        </div>

        {/* 最近记录 */}
        <RecentRecords />

        {/* 图片上传弹窗 */}
        {showImageUpload && (
          <ImageUpload onClose={() => setShowImageUpload(false)} />
        )}

        {/* 文本输入弹窗 */}
        {showTextInput && (
          <TextInput
            onClose={() => setShowTextInput(false)}
            onSave={handleTextSave}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
