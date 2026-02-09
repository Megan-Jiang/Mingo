import { useEffect, useState } from "react";
import { Clock, Users, Tag, Play, AlertCircle, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { getRecords, updateRecordFriendId } from "../services/records";
import { createFriend, updateFriendLastInteraction } from "../services/friends";
import { EmptyState } from "./EmptyState";
import RecordDetail from "./RecordDetail";

// 归档成功音效
import successSoundFile from '../assets/success.mp3';
const successSound = new Audio(successSoundFile);

/**
 * 格式化日期时间
 */
const formatDateTime = (createdAt) => {
  if (!createdAt) {
    return { date: "-", time: "-" };
  }
  const date = new Date(createdAt);
  const dateStr = date.toLocaleDateString("zh-CN");
  const timeStr = date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date: dateStr, time: timeStr };
};

/**
 * 计算相对时间
 */
const getRelativeTime = (createdAt) => {
  if (!createdAt) return "";

  const now = new Date();
  const date = new Date(createdAt);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "刚刚";
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  return date.toLocaleDateString("zh-CN");
};

const RecentRecords = ({ records: propRecords, onRefresh }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(!propRecords);
  const [addingFriend, setAddingFriend] = useState(null); // 格式: "recordId-personName"
  const [selectedRecord, setSelectedRecord] = useState(null); // 查看详情的记录

  // 如果传入了 records prop，直接使用
  useEffect(() => {
    if (propRecords) {
      setRecords(propRecords);
      return;
    }

    // 从接口加载数据
    const fetchRecords = async () => {
      try {
        const data = await getRecords({ limit: 10 });
        if (data && data.length > 0) {
          setRecords(data);
        }
      } catch (err) {
        console.warn("加载记录失败:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [propRecords]);

  // 添加未归档人物为朋友
  const handleAddToFriends = async (record, personName) => {
    try {
      const stateKey = `${record.id}-${personName}`;
      setAddingFriend(stateKey);
      // 创建朋友
      const newFriend = await createFriend({
        name: personName,
        tags: ["新朋友"]
      });
      // 更新记录的 friend_id，同时清除 unarchived_people
      await updateRecordFriendId(record.id, newFriend.id);
      // 更新朋友的最后互动时间
      await updateFriendLastInteraction(newFriend.id, record.id);
      // 播放归档成功音效
      successSound.currentTime = 0;
      successSound.play().catch(err => console.warn('播放音效失败:', err));
      // 重新获取记录
      const data = await getRecords({ limit: 10 });
      setRecords(data);
    } catch (err) {
      console.error("添加朋友失败:", err);
      alert("添加失败，请重试");
    } finally {
      setAddingFriend(null);
    }
  };

  const displayRecords = records.length > 0 ? records : null;

  return (
    <div>
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-warm-purple border-t-transparent rounded-full mx-auto"></div>
        </div>
      )}

      {!loading && !displayRecords && (
        <EmptyState
          emoji="📝"
          message="还没有记录呢，开始添加吧～"
          submessage="记录每一次温暖的互动"
        />
      )}

      {!loading && displayRecords && (
        <div className="space-y-3">
          {displayRecords.map((record) => {
            const { date: dateStr, time: timeStr } =
              formatDateTime(record.created_at || record.date);
            const summary =
              record.summary || record.transcript || "暂无摘要";
            const people = record.people || [];
            const tags = record.tags || [];
            const relativeTime = getRelativeTime(
              record.created_at || record.date
            );

            const hasUnarchived = (record.unarchived_people?.length || 0) > 0;

            return (
              <motion.div
                key={record.id}
                className={`bg-white rounded-3xl p-4 shadow-md shadow-warm-purple/8 relative overflow-hidden cursor-pointer ${
                  hasUnarchived ? "ring-2 ring-red-300" : ""
                }`}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedRecord(record)}
              >
                {/* 未归档提示 */}
                {hasUnarchived && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-red-500 text-xs bg-red-50 px-2 py-1 rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    <span>人物未归档</span>
                  </div>
                )}

                {/* 左侧装饰线 */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl ${
                  hasUnarchived
                    ? "bg-gradient-to-b from-red-400 to-red-300"
                    : "bg-gradient-to-b from-warm-yellow to-[#FFEAA7]"
                }`} />

                <div className="flex gap-3 ml-3">
                  {/* 头像 */}
                  <div className="w-12 h-12 rounded-full border-2 border-warm-yellow/50 bg-warm-cream flex items-center justify-center flex-shrink-0">
                    {people.length > 0 ? (
                      <span className="text-warm-purple font-medium">
                        {people[0].charAt(0)}
                      </span>
                    ) : (
                      <Users className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-warm-purple font-medium tracking-wide">
                        {people.length > 0 ? people.join(", ") : "未知"}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{relativeTime || timeStr}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2 leading-relaxed line-clamp-2 tracking-wide">
                      {summary}
                    </p>

                    {/* 未归档人物（可点击添加） */}
                    {hasUnarchived && (
                      <div className="flex gap-2 flex-wrap mb-2">
                        {record.unarchived_people.map((person, idx) => {
                          const stateKey = `${record.id}-${person}`;
                          const isAdding = addingFriend === stateKey;
                          return (
                            <motion.button
                              key={idx}
                              onClick={() => handleAddToFriends(record, person)}
                              disabled={isAdding}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs tracking-wide hover:bg-red-200 transition-colors"
                              whileTap={{ scale: 0.95 }}
                            >
                              <Plus className="w-3 h-3" />
                              {isAdding ? "添加中..." : `添加 ${person}`}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}

                    {/* 标签 */}
                    {tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-warm-purple/10 text-warm-purple rounded-full text-xs tracking-wide"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 记录详情弹窗 */}
      {selectedRecord && (
        <RecordDetail
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};

export default RecentRecords;
