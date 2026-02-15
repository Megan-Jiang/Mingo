import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Cake,
  Flower,
  X,
  Clock,
  Users,
  Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudDeco,
  StarDeco,
} from "../components/DecoElements";
import { getFriends } from "../services/friends";
import { getRecordsByDateRange } from "../services/records";
import { Lunar } from "lunar-javascript";

/**
 * 将农历转换为指定年份的公历日期
 */
function lunarToSolar(lunarMonth, lunarDay, year) {
  try {
    const targetLunar = Lunar.fromYmd(year, lunarMonth, lunarDay);
    const targetSolar = targetLunar.getSolar();
    return {
      month: targetSolar.getMonth(),
      day: targetSolar.getDay()
    };
  } catch (e) {
    console.warn('农历转换失败:', e);
    return null;
  }
}

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [specialDays, setSpecialDays] = useState([]);
  const [recordsByDate, setRecordsByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null); // 选中的日期 { day, records }
  const [selectedDateRecords, setSelectedDateRecords] = useState([]); // 选中日期的记录详情

  // 获取朋友的生日和重要节日
  useEffect(() => {
    const fetchSpecialDays = async () => {
      try {
        const friends = await getFriends();
        console.log('【Calendar】获取到朋友数量:', friends.length);

        const year = currentMonth.getFullYear();
        const days = [];
        const holidayMap = new Map(); // 用于节日去重

        friends.forEach(friend => {
          // 生日
          if (friend.birthday) {
            const birthdayInfo = friend.important_dates?.find(d => d.name === '生日');
            const isLunar = birthdayInfo?.type === 'lunar';
            const b = friend.birthday.trim();

            let month, day;
            const parts = b.split('-');
            if (parts.length === 3) {
              month = parseInt(parts[1]);
              day = parseInt(parts[2]);
            } else if (parts.length === 2) {
              month = parseInt(parts[0]);
              day = parseInt(parts[1]);
            }

            if (month && day) {
              if (isLunar) {
                const solar = lunarToSolar(month, day, year);
                if (solar) {
                  month = solar.month;
                  day = solar.day;
                }
              }

              if (month && day) {
                days.push({
                  month,
                  day,
                  type: 'birthday',
                  displayName: `${friend.name}的生日`,
                  holidayName: '生日',
                  friendId: friend.id,
                  isLunar
                });
              }
            }
          }

          // 重要节日
          const festivals = friend.important_dates || [];
          festivals.forEach(f => {
            if (f.name !== '生日') {
              const dateValue = f.date || f.monthDay;
              if (!dateValue) return;

              const isLunar = f.type === 'lunar';
              let month, day;

              const parts = dateValue.split('-');
              if (parts.length === 3) {
                month = parseInt(parts[1]);
                day = parseInt(parts[2]);
              } else if (parts.length === 2) {
                month = parseInt(parts[0]);
                day = parseInt(parts[1]);
              }

              if (month && day) {
                if (isLunar) {
                  const solar = lunarToSolar(month, day, year);
                  if (solar) {
                    month = solar.month;
                    day = solar.day;
                  }
                }

                if (month && day) {
                  // 使用节日名称作为 key 去重
                  const holidayKey = `${month}-${day}-${f.name}`;
                  if (!holidayMap.has(holidayKey)) {
                    holidayMap.set(holidayKey, true);
                    days.push({
                      month,
                      day,
                      type: 'holiday',
                      displayName: f.name,  // 只显示节日名称，不显示人名
                      holidayName: f.name,
                      friendId: friend.id,
                      isLunar
                    });
                  }
                }
              }
            }
          });
        });

        console.log('【Calendar】解析后的 specialDays:', days);
        setSpecialDays(days);
      } catch (err) {
        console.error('获取特殊日期失败:', err);
      }
    };

    fetchSpecialDays();
  }, [currentMonth]);

  // 获取当月记录
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

        const records = await getRecordsByDateRange(startOfMonth, endOfMonth);

        const grouped = {};
        records.forEach(record => {
          const date = new Date(record.created_at);
          if (date.getMonth() === currentMonth.getMonth()) {
            const dateKey = date.getDate();
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(record);
          }
        });

        setRecordsByDate(grouped);
      } catch (err) {
        console.error('获取记录失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [currentMonth]);

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const monthName = currentMonth.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
  });

  const month = currentMonth.getMonth() + 1;
  const year = currentMonth.getFullYear();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const getSpecialDayForDate = (day) => {
    return specialDays.find(sd => sd.month === month && sd.day === day);
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const currentMonthSpecialDays = specialDays.filter(sd => sd.month === month);

  // 点击日期查看详情
  const handleDateClick = async (day) => {
    const dayRecords = recordsByDate[day] || [];

    if (dayRecords.length === 0) return;

    // 获取选中日期的记录详情
    const recordsWithDetails = dayRecords.map(record => ({
      id: record.id,
      date: record.created_at?.split('T')[0] || '',
      time: record.created_at ? new Date(record.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '',
      summary: record.summary || record.transcript || '暂无摘要',
      people: record.people || [],
      tags: record.tags || []
    })).sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));

    setSelectedDate({ day, records: recordsWithDetails });
  };

  return (
    <div className="min-h-screen bg-warm-cream px-5 pt-8 pb-24 relative overflow-hidden">
      <CloudDeco className="absolute top-12 left-5 opacity-60" />
      <StarDeco className="absolute top-40 right-8 opacity-60" />

      {/* 顶部月份切换 */}
      <div className="flex items-center justify-between mb-6">
        <motion.button
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
            )
          }
          className="p-2 rounded-full hover:bg-warm-yellow/30 transition-all"
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-6 h-6 text-warm-purple" />
        </motion.button>

        <h2 className="text-xl text-warm-purple tracking-wide">{monthName}</h2>

        <motion.button
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
            )
          }
          className="p-2 rounded-full hover:bg-warm-yellow/30 transition-all"
          whileTap={{ scale: 0.95 }}
        >
          <ChevronRight className="w-6 h-6 text-warm-purple" />
        </motion.button>
      </div>

      {/* 日历网格 */}
      <div className="bg-white rounded-3xl p-5 shadow-lg shadow-warm-purple/10">
        <div className="grid grid-cols-7 gap-2 mb-3">
          {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
            <div
              key={day}
              className="text-center text-sm text-gray-500"
              style={{ letterSpacing: "0.5px" }}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {emptyDays.map((i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {days.map((day) => {
            const friendDay = getSpecialDayForDate(day);
            const hasFriendDay = !!friendDay;
            const dayRecords = recordsByDate[day] || [];
            const hasRecords = dayRecords.length > 0;
            const currentToday = isToday(day);

            return (
              <motion.div
                key={day}
                className={`h-12 rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 cursor-pointer ${
                  currentToday
                    ? "bg-warm-yellow ring-2 ring-warm-yellow ring-offset-1"
                    : hasFriendDay
                    ? "bg-warm-pink/40"
                    : hasRecords
                    ? "bg-warm-purple/10"
                    : "bg-gray-50 hover:bg-warm-yellow/20"
                }`}
                whileHover={{ scale: hasRecords ? 1.05 : 1 }}
                whileTap={{ scale: hasRecords ? 0.95 : 1 }}
                onClick={() => handleDateClick(day)}
              >
                <span
                  className={`text-sm ${
                    currentToday ? "text-warm-purple" : "text-gray-700"
                  }`}
                  style={{ letterSpacing: "0.5px" }}
                >
                  {day}
                </span>

                {hasFriendDay && (
                  <div className="absolute -top-1 -right-1">
                    {friendDay.isLunar ? (
                      <Flower className="w-4 h-4 text-warm-purple" />
                    ) : (
                      <Cake className="w-4 h-4 text-warm-purple" />
                    )}
                  </div>
                )}

                {hasRecords && !hasFriendDay && (
                  <div className="absolute -bottom-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-warm-purple" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 重要日期列表 */}
      <div className="mt-6">
        <h3 className="text-lg text-warm-purple mb-4 px-2 tracking-wide">
          {month}月重要日期
        </h3>

        {loading ? (
          <div className="text-center py-8">
            <img
              src="/images/cat_wave.gif"
              alt="加载中..."
              className="w-12 h-12 mx-auto"
            />
          </div>
        ) : currentMonthSpecialDays.length > 0 ? (
          <div className="space-y-3">
            {currentMonthSpecialDays.map((sd, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-3xl p-4 shadow-md shadow-warm-purple/8 flex items-center gap-4"
                whileHover={{ scale: 1.01 }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-warm-pink to-warm-yellow flex items-center justify-center">
                  {sd.type === 'birthday' ? (
                    <Cake className="w-6 h-6 text-warm-purple" />
                  ) : (
                    <Flower className="w-6 h-6 text-warm-purple" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-warm-purple mb-1 tracking-wide">
                    {sd.displayName}
                    {sd.isLunar && sd.type === 'birthday' && (
                      <span className="ml-2 text-xs text-gray-400">(农历)</span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {sd.month}月{sd.day}日
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>本月没有重要日期</p>
          </div>
        )}
      </div>

      {/* 日期详情弹窗 */}
      <AnimatePresence>
        {selectedDate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl"
            >
              {/* 头部 */}
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-xl font-semibold text-gray-800">
                  {selectedDate.day}日互动记录
                </h2>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* 时间轴记录列表 */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                {selectedDate.records.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDate.records.map((record, index) => (
                      <div key={record.id} className="relative pl-6 pb-4 last:pb-0">
                        {/* 时间轴线 */}
                        {index < selectedDate.records.length - 1 && (
                          <div className="absolute left-[5px] top-6 bottom-0 w-0.5 bg-warm-purple/20" />
                        )}
                        {/* 时间轴点 */}
                        <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-warm-purple border-2 border-white shadow" />

                        {/* 记录内容 */}
                        <div className="bg-warm-cream rounded-xl p-4">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <Clock className="w-3 h-3" />
                            <span>{record.time}</span>
                          </div>

                          <p className="text-gray-700 mb-2">{record.summary}</p>

                          {/* 人物 */}
                          {record.people.length > 0 && (
                            <div className="flex items-center gap-1 mb-2">
                              <Users className="w-3 h-3 text-gray-400" />
                              <div className="flex gap-1 flex-wrap">
                                {record.people.map((person, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-warm-purple/10 text-warm-purple rounded-full text-xs"
                                  >
                                    {person}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 标签 */}
                          {record.tags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <Tag className="w-3 h-3 text-gray-400" />
                              {record.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-warm-yellow/30 text-warm-purple rounded-full text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>该日期没有互动记录</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Calendar;
