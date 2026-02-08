import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Tag, Edit3, Gift } from 'lucide-react';
import PersonEditDialog from './PersonEditDialog';
import { getRecordsByPerson } from '../services/records';

const PersonDetail = ({ person, onBack, onUpdate }) => {
  const [showEdit, setShowEdit] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-warm-cream">
      <div className="container mx-auto px-5 pt-8 pb-24">
        {/* 头部导航 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">朋友详情</h1>
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
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-warm-purple" />
            互动记录
          </h3>

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
      </div>
    </div>
  );
};

export default PersonDetail;
