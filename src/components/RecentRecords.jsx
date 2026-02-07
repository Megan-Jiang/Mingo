import React, { useEffect, useState } from 'react';
import { Clock, Users, Tag, Play } from 'lucide-react';
import { getRecords } from '../services/records';

/**
 * 格式化日期时间
 * @param {string} createdAt - ISO 日期字符串
 * @returns {{ date: string, time: string }}
 */
const formatDateTime = (createdAt) => {
  if (!createdAt) {
    return { date: '-', time: '-' };
  }
  const date = new Date(createdAt);
  const dateStr = date.toLocaleDateString('zh-CN');
  const timeStr = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return { date: dateStr, time: timeStr };
};

/**
 * 最近记录组件
 * @param {Object} props
 * @param {Array} props.records - 记录数组（可选，不传则从接口加载）
 */
const RecentRecords = ({ records: propRecords }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(!propRecords);

  // 默认模拟数据（当没有真实数据时显示）
  const defaultRecords = [
    {
      id: 1,
      summary: '和小明讨论了项目进展，他最近工作压力比较大',
      people: ['小明'],
      tags: ['工作', '压力'],
      date: '2024-01-15',
      time: '14:30',
      audio_url: null
    },
    {
      id: 2,
      summary: '和妈妈视频通话，她身体很好，不用担心',
      people: ['妈妈'],
      tags: ['家庭', '健康'],
      date: '2024-01-14',
      time: '19:00',
      audio_url: null
    },
    {
      id: 3,
      summary: '参加同事生日聚会，大家玩得很开心',
      people: ['同事'],
      tags: ['聚会', '生日'],
      date: '2024-01-13',
      time: '18:30',
      audio_url: null
    }
  ];

  // 如果传入了 records prop，直接使用
  // 否则从接口加载
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
        console.warn('加载记录失败，使用默认数据:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [propRecords]);

  // 确定显示的记录列表
  const displayRecords = records.length > 0 ? records : defaultRecords;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-[#897dbf]" />
        最近记录
      </h2>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-[#897dbf] border-t-transparent rounded-full mx-auto"></div>
        </div>
      )}

      {!loading && (
        <div className="space-y-4">
          {displayRecords.map((record) => {
            const { date: dateStr, time: timeStr } = formatDateTime(record.created_at || record.date);
            const summary = record.summary || record.transcript || '暂无摘要';
            const people = record.people || [];
            const tags = record.tags || [];

            return (
              <div
                key={record.id}
                className="border-l-4 border-[#fcd753] pl-4 py-3 hover:bg-[#e7e3b3] rounded-r-lg transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="h-4 w-4 text-[#897dbf]" />
                    <span>{people.length > 0 ? people.join(', ') : '未知'}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {dateStr} {timeStr}
                  </div>
                </div>

                {/* 录音播放按钮 */}
                {(record.audio_url || record.audioUrl) && (
                  <div className="mb-2">
                    <button className="flex items-center gap-2 text-[#897dbf] hover:text-[#6b5aa3] text-sm">
                      <Play className="h-4 w-4" />
                      播放录音
                    </button>
                  </div>
                )}

                <p className="text-gray-700 mb-2">{summary}</p>

                {tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <div className="flex gap-1">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-[#d6b7d6] text-[#897dbf] text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {displayRecords.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>还没有记录，开始你的第一次录音吧！</p>
        </div>
      )}
    </div>
  );
};

export default RecentRecords;
