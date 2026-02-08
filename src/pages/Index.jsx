import { useState, useCallback } from "react";
import { Mic, Image as ImageIcon, FileText, Tag, Clock, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudDeco, StarDeco, HeartDeco } from "../components/DecoElements";
import { EmptyState } from "../components/EmptyState";
import { useRecorder } from "../hooks/useRecorder";
import { createRecord } from "../services/records";
import { processAudio, extractPeople, generateTags, organizeTranscript } from "../services/ai";
import { getFriendsByNames } from "../services/friends";
import { getEventTagNames } from "../services/tags";
import RecordButton from "../components/RecordButton";
import RecentRecords from "../components/RecentRecords";
import ImageUpload from "../components/ImageUpload";
import TextInput from "../components/TextInput";

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
  const [transcript, setTranscript] = useState("");
  const [organizedText, setOrganizedText] = useState("");
  const [extractedPeople, setExtractedPeople] = useState([]);
  const [generatedTags, setGeneratedTags] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [addedFriends, setAddedFriends] = useState([]);

  const handleStartRecording = useCallback(async () => {
    setHasRecorded(false);
    setTranscript("");
    await startRecording();
  }, [startRecording]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    setHasRecorded(true);
  }, [stopRecording]);

  // AI 转写处理（包含整理功能）
  const handleTranscribe = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);
    try {
      // 并行获取预设事件标签
      const [allowedTags, friendsMap] = await Promise.all([
        getEventTagNames(),
        getFriendsByNames([]) // 先获取空，后面再查
      ]);

      const result = await processAudio(audioBlob);

      // 1. 匹配事件标签（使用预设标签）
      const tagsResult = await generateTags(
        result.organizedText || result.transcript,
        allowedTags
      );

      // 2. 匹配朋友
      const peopleToMatch = result.people || [];
      let existingFriends = [];
      let unarchivedPeople = [];

      if (peopleToMatch.length > 0) {
        const friendsMapResult = await getFriendsByNames(peopleToMatch);
        peopleToMatch.forEach(person => {
          if (friendsMapResult[person]) {
            existingFriends.push(person);
          } else {
            unarchivedPeople.push(person);
          }
        });
      }

      console.log('匹配结果:', {
        existingFriends,
        unarchivedPeople,
        tags: tagsResult
      });

      setTranscript(result.transcript);
      setOrganizedText(result.organizedText || result.transcript);
      setExtractedPeople(result.people);
      setGeneratedTags(tagsResult);
    } catch (err) {
      console.error("转写失败:", err);
      if (err.message.includes("未配置")) {
        alert(err.message);
      } else {
        alert(`转写失败: ${err.message}，请检查 API 配置`);
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  // 手动整理转写内容
  const handleOrganize = async () => {
    if (!transcript) return;

    setIsTranscribing(true);
    try {
      const result = await organizeTranscript(transcript, extractedPeople);
      setOrganizedText(result.organizedText);
      if (result.people.length > 0) {
        setExtractedPeople([...new Set([...extractedPeople, ...result.people])]);
      }
      if (result.tags.length > 0) {
        setGeneratedTags(result.tags);
      }
    } catch (err) {
      console.error("整理失败:", err);
    } finally {
      setIsTranscribing(false);
    }
  };

  // 保存记录（支持多人物拆分）
  const handleSave = async () => {
    if (!audioBlob) return;

    setIsSaving(true);
    try {
      const descriptionToSave = organizedText || transcript;
      const people = extractedPeople;
      const tags = generatedTags.length > 0 ? generatedTags : ["未分类"];

      // 匹配朋友获取 friend_id
      const friendsMap = people.length > 0 ? await getFriendsByNames(people) : {};

      const baseRecord = {
        transcript: descriptionToSave || "暂无转写",
        summary: descriptionToSave ? `录音记录：${descriptionToSave.slice(0, 100)}...` : "",
        events: [],
        tags: tags
      };

      if (people.length === 0) {
        await createRecord({ ...baseRecord, people: [] });
      } else if (people.length === 1) {
        const person = people[0];
        const friend = friendsMap[person];
        await createRecord({
          ...baseRecord,
          people: [person],
          friend_id: friend?.id || null,
          unarchived_people: friend ? [] : [person]
        });
      } else {
        for (const person of people) {
          const friend = friendsMap[person];
          await createRecord({
            ...baseRecord,
            people: [person],
            friend_id: friend?.id || null,
            unarchived_people: friend ? [] : [person]
          });
        }
      }

      setHasRecorded(false);
      setTranscript("");
      setOrganizedText("");
      setExtractedPeople([]);
      setGeneratedTags([]);
      setAddedFriends([]);
      resetRecording();

      alert(people.length > 1 ? `已保存 ${people.length} 条记录` : "保存成功！");
    } catch (err) {
      console.error("保存失败:", err);
      alert("保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  // 重新录音
  const handleReRecord = () => {
    setHasRecorded(false);
    setTranscript("");
    setOrganizedText("");
    setExtractedPeople([]);
    setGeneratedTags([]);
    setAddedFriends([]);
    resetRecording();
  };

  // 文本输入保存（支持多人物拆分）
  const handleTextSave = async (text) => {
    setIsSaving(true);
    try {
      // 获取预设事件标签和匹配朋友
      const [allowedTags, friendsMap] = await Promise.all([
        getEventTagNames(),
        getFriendsByNames([])
      ]);

      const [people, tags] = await Promise.all([
        extractPeople(text),
        generateTags(text, allowedTags)
      ]);

      // 匹配朋友
      const matchedFriendsMap = people.length > 0 ? await getFriendsByNames(people) : {};

      const baseRecord = {
        transcript: text,
        summary: `文本记录：${text.slice(0, 50)}...`,
        events: [],
        tags: tags.length > 0 ? tags : ["未分类"]
      };

      if (people.length === 0) {
        await createRecord({ ...baseRecord, people: [] });
      } else if (people.length === 1) {
        const person = people[0];
        const friend = matchedFriendsMap[person];
        await createRecord({
          ...baseRecord,
          people: [person],
          friend_id: friend?.id || null,
          unarchived_people: friend ? [] : [person]
        });
      } else {
        for (const person of people) {
          const friend = matchedFriendsMap[person];
          await createRecord({
            ...baseRecord,
            people: [person],
            friend_id: friend?.id || null,
            unarchived_people: friend ? [] : [person]
          });
        }
      }

      alert(people.length > 1 ? `已保存 ${people.length} 条记录` : "保存成功！");
    } catch (err) {
      console.error("保存失败:", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // 格式化时间显示
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 将人物添加为朋友
  const handleAddFriend = async (personName) => {
    try {
      const { createFriend } = await import("../services/friends");
      await createFriend({
        name: personName,
        tags: ["新朋友"]
      });
      setAddedFriends([...addedFriends, personName]);
      alert(`已添加 ${personName} 为朋友`);
    } catch (err) {
      console.error("添加朋友失败:", err);
      alert("添加朋友失败，请重试");
    }
  };

  return (
    <div className="min-h-screen bg-warm-cream px-5 pt-8 pb-24 relative overflow-hidden">
      {/* 装饰元素 */}
      <CloudDeco className="absolute top-10 right-5 opacity-60" />
      <StarDeco className="absolute top-32 left-8 opacity-60" />
      <HeartDeco className="absolute bottom-40 right-10 opacity-60" />

      {/* 顶部标题 */}
      <div className="text-center mb-8">
        <h1 className="text-2xl text-warm-purple mb-2 tracking-wide">
          Nice to meet you
        </h1>
        <p className="text-sm text-gray-500 tracking-wide">
          记录你的社交互动
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error === "Permission denied"
            ? "请允许麦克风权限"
            : `录音失败: ${error}`}
        </div>
      )}

      {/* 主录音区域 */}
      <div className="bg-white rounded-3xl p-6 mb-6 shadow-lg shadow-warm-purple/10 relative">
        {/* 录音按钮 */}
        <div className="flex flex-col items-center mb-6">
          <RecordButton
            isRecording={isRecording}
            recordingTime={recordingTime}
            onStart={handleStartRecording}
            onStop={handleStopRecording}
          />
          <span className="text-sm text-gray-500 mt-3 tracking-wide">
            {isRecording
              ? "录音中..."
              : hasRecorded
              ? "点击重新录音"
              : "点击开始录音"}
          </span>
        </div>

        {/* 其他输入方式 */}
        <div className="flex gap-3">
          <motion.button
            className="flex-1 bg-warm-pink/30 hover:bg-warm-pink/50 rounded-2xl py-3 px-4 flex items-center justify-center gap-2 transition-all duration-300"
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowImageUpload(true)}
          >
            <ImageIcon className="w-5 h-5 text-warm-purple" />
            <span className="text-sm text-warm-purple">上传图片</span>
          </motion.button>
          <motion.button
            className="flex-1 bg-warm-yellow/30 hover:bg-warm-yellow/50 rounded-2xl py-3 px-4 flex items-center justify-center gap-2 transition-all duration-300"
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowTextInput(true)}
          >
            <FileText className="w-5 h-5 text-warm-purple" />
            <span className="text-sm text-warm-purple">文本输入</span>
          </motion.button>
        </div>

        {/* 录音结果显示 */}
        <AnimatePresence>
          {hasRecorded && audioUrl && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 overflow-hidden"
            >
              {/* 播放器 */}
              <div className="bg-warm-cream rounded-2xl p-4 mb-4">
                <audio controls src={audioUrl} className="w-full" />
              </div>

              {/* 转写结果显示 */}
              {transcript && (
                <div className="space-y-3">
                  {/* 原始转写 */}
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm text-gray-600 mb-2">原始转写：</p>
                    <p className="text-gray-700">{transcript}</p>
                  </div>

                  {/* 整理后的描述 */}
                  {organizedText && organizedText !== transcript && (
                    <div className="bg-warm-purpleBg rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-warm-purple">整理后：</span>
                      </div>
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {organizedText}
                      </p>
                    </div>
                  )}

                  {/* 人物和标签 */}
                  {(extractedPeople.length > 0 || generatedTags.length > 0) && (
                    <div className="bg-white rounded-2xl p-4 border border-gray-100">
                      {/* 人物标签 */}
                      {extractedPeople.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-2">识别到的人物：</p>
                          <div className="flex flex-wrap gap-2">
                            {extractedPeople.map((person, idx) => {
                              const isAdded = addedFriends.includes(person);
                              return (
                                <div key={idx} className="flex items-center gap-1">
                                  <span className={`px-3 py-1 rounded-full text-sm ${
                                    isAdded
                                      ? "bg-green-100 text-green-700"
                                      : "bg-warm-purpleBg text-warm-purple"
                                  }`}>
                                    {person}
                                    {isAdded && (
                                      <span className="ml-1 text-xs">✓</span>
                                    )}
                                  </span>
                                  {!isAdded && (
                                    <button
                                      onClick={() => handleAddFriend(person)}
                                      className="p-1 text-warm-purple hover:text-warm-purpleLight"
                                      title="添加为朋友"
                                    >
                                      <Tag className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 事件标签 */}
                      {generatedTags.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">事件标签：</p>
                          <div className="flex flex-wrap gap-2">
                            {generatedTags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-warm-yellow/30 text-warm-purple rounded-full text-sm"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-center gap-3 mt-4">
                <motion.button
                  onClick={handleReRecord}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300"
                  whileTap={{ scale: 0.98 }}
                  disabled={isSaving}
                >
                  重新录音
                </motion.button>

                {!transcript ? (
                  <motion.button
                    onClick={handleTranscribe}
                    disabled={isTranscribing}
                    className="px-4 py-2 bg-warm-purple text-white rounded-xl hover:bg-warm-purpleLight disabled:opacity-50"
                    whileTap={{ scale: 0.98 }}
                  >
                    {isTranscribing ? "转写中..." : "AI转写"}
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-warm-yellow text-gray-800 rounded-xl hover:bg-warm-yellowLight disabled:opacity-50"
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSaving ? "保存中..." : "保存"}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 最近记录 */}
      <div className="mb-6">
        <h3 className="text-lg text-warm-purple mb-4 px-2 tracking-wide">
          最近记录
        </h3>
        <RecentRecords />
      </div>

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
  );
};

export default Index;
