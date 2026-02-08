import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Cake,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  CloudDeco,
  StarDeco,
} from "../components/DecoElements";
import { getFriends } from "../services/friends";
import { getRecordsByDateRange } from "../services/records";
import { Lunar } from "lunar-javascript";

// 预设公历节日
const PRESET_SOLAR_HOLIDAYS = {
  '01-01': '元旦',
  '02-14': '情人节',
  '03-08': '妇女节',
  '04-04': '清明节',
  '05-01': '劳动节',
  '06-01': '儿童节',
  '10-01': '国庆节',
  '12-25': '圣诞节',
};

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

  // 获取朋友的生日和重要节日
  useEffect(() => {
    const fetchSpecialDays = async () => {
      try {
        const friends = await getFriends();
        console.log('【Calendar】获取到朋友数量:', friends.length);

        // 检查所有朋友的 birthday 和 important_dates 字段
        friends.forEach((f, i) => {
          console.log(`朋友 ${i} [${f.name}]:`, {
            birthday: f.birthday,
            important_dates: f.important_dates
          });

          // 检查农历节日数据
          if (f.important_dates && f.important_dates.length > 0) {
            f.important_dates.forEach((d, j) => {
              console.log(`  节日 ${j}: name=${d.name}, date=${d.date}, type=${d.type}`);
            });
          }
        });

        const year = currentMonth.getFullYear();
        const days = [];

        friends.forEach(friend => {
          // 生日
          if (friend.birthday) {
            const birthdayInfo = friend.important_dates?.find(d => d.name === '生日');
            const isLunar = birthdayInfo?.type === 'lunar';
            const b = friend.birthday.trim();

            let month, day;
            // 生日格式可能是 YYYY-MM-DD 或 MM-DD
            const parts = b.split('-');
            if (parts.length === 3) {
              // YYYY-MM-DD
              month = parseInt(parts[1]);
              day = parseInt(parts[2]);
            } else if (parts.length === 2) {
              // MM-DD
              month = parseInt(parts[0]);
              day = parseInt(parts[1]);
            }

            if (month && day) {
              // 农历生日需要转换
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
                  name: `${friend.name}的生日`,
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
              // 兼容 monthDay 和 date 两种字段名
              const dateValue = f.date || f.monthDay;
              if (!dateValue) {
                console.log(`  节日 ${f.name} 没有日期值，跳过`);
                return;
              }

              const isLunar = f.type === 'lunar';
              console.log(`  处理节日: name=${f.name}, dateValue=${dateValue}, type=${f.type}, isLunar=${isLunar}`);

              let month, day;

              // 格式可能是 MM-DD 或 YYYY-MM-DD
              const parts = dateValue.split('-');
              if (parts.length === 3) {
                month = parseInt(parts[1]);
                day = parseInt(parts[2]);
              } else if (parts.length === 2) {
                month = parseInt(parts[0]);
                day = parseInt(parts[1]);
              }

              console.log(`  解析: month=${month}, day=${day}`);

              if (month && day) {
                // 农历节日需要转换
                if (isLunar) {
                  console.log(`  农历转换: lunarMonth=${month}, lunarDay=${day}, year=${year}`);
                  const solar = lunarToSolar(month, day, year);
                  console.log(`  转换结果:`, solar);
                  if (solar) {
                    month = solar.month;
                    day = solar.day;
                  }
                }

                if (month && day) {
                  days.push({
                    month,
                    day,
                    type: 'holiday',
                    name: `${friend.name}-${f.name}`,
                    friendId: friend.id,
                    isLunar
                  });
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

  const getPresetSolarHoliday = (day) => {
    const key = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return PRESET_SOLAR_HOLIDAYS[key];
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  // 获取当月所有特殊日期列表（朋友的 + 预设节日）
  const currentMonthSpecialDaysRaw = specialDays.filter(sd => sd.month === month);
  const presetDays = Object.entries(PRESET_SOLAR_HOLIDAYS)
    .filter(([key]) => parseInt(key.split('-')[0]) === month)
    .map(([key, name]) => {
      const [m, d] = key.split('-');
      return {
        month: parseInt(m),
        day: parseInt(d),
        type: 'preset',
        name: name,
        friendId: null,
        isLunar: false
      };
    });

  console.log('【Calendar】当月特殊日期:', { month, friendDays: currentMonthSpecialDaysRaw.length, presetDays: presetDays.length });

  const currentMonthSpecialDays = [...currentMonthSpecialDaysRaw, ...presetDays];

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
            const presetHoliday = getPresetSolarHoliday(day);
            const hasFriendDay = !!friendDay;
            const hasPresetHoliday = !!presetHoliday;
            const dayRecords = recordsByDate[day] || [];
            const hasRecords = dayRecords.length > 0;
            const currentToday = isToday(day);

            return (
              <motion.div
                key={day}
                className={`h-12 rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 ${
                  currentToday
                    ? "bg-warm-yellow ring-2 ring-warm-yellow ring-offset-1"
                    : hasFriendDay || hasPresetHoliday
                    ? "bg-warm-pink/40"
                    : "bg-gray-50 hover:bg-warm-yellow/20"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
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
                    <Cake className="w-4 h-4 text-warm-purple" />
                  </div>
                )}

                {hasPresetHoliday && !hasFriendDay && (
                  <div className="absolute -top-1 -right-1">
                    <Star
                      className="w-4 h-4 text-warm-yellow"
                      fill="#FFE082"
                    />
                  </div>
                )}

                {hasRecords && !hasFriendDay && !hasPresetHoliday && (
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
            <div className="animate-spin h-6 w-6 border-2 border-warm-purple border-t-transparent rounded-full mx-auto"></div>
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
                    <Star className="w-6 h-6 text-warm-purple" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-warm-purple mb-1 tracking-wide">
                    {sd.name}
                    {sd.isLunar && (
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
    </div>
  );
};

export default Calendar;
