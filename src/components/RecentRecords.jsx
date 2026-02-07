import { useEffect, useState } from "react";
import { Clock, Users, Tag, Play } from "lucide-react";
import { motion } from "framer-motion";
import { getRecords } from "../services/records";
import { EmptyState } from "./EmptyState";

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

const RecentRecords = ({ records: propRecords }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(!propRecords);

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

            return (
              <motion.div
                key={record.id}
                className="bg-white rounded-3xl p-4 shadow-md shadow-warm-purple/8 relative overflow-hidden"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                {/* 左侧装饰线 */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-warm-yellow to-[#FFEAA7] rounded-l-3xl" />

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
    </div>
  );
};

export default RecentRecords;
