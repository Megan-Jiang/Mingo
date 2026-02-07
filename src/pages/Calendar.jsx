import { useState } from "react";
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

type ViewMode = "month" | "week" | "day";

interface SpecialDay {
  date: number;
  type: "birthday" | "holiday" | "anniversary";
  name: string;
}

const specialDays = [
  { date: 14, type: "holiday", name: "情人节" },
  { date: 20, type: "birthday", name: "妈妈生日" },
  { date: 28, type: "anniversary", name: "纪念日" },
];

const Calendar = () => {
  const [viewMode, setViewMode] = useState("month");
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1)); // 2026年2月
  const today = new Date(2026, 1, 7); // 2026年2月7日

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

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const getSpecialDay = (date) => {
    return specialDays.find((sd) => sd.date === date);
  };

  const isToday = (date) => {
    return (
      date === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="min-h-screen bg-warm-cream px-5 pt-8 pb-24 relative overflow-hidden">
      {/* 装饰元素 */}
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

      {/* 视图切换 */}
      <div className="flex gap-2 mb-6 justify-center">
        {(["month", "week", "day"] as ViewMode[]).map((mode) => (
          <motion.button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-6 py-2 rounded-full text-sm transition-all duration-300 ${
              viewMode === mode
                ? "bg-warm-yellow text-warm-purple shadow-md shadow-warm-yellow/30"
                : "bg-white text-gray-500 hover:bg-warm-yellow/30"
            }`}
            whileTap={{ scale: 0.95 }}
            style={{ letterSpacing: "0.5px" }}
          >
            {mode === "month" ? "月" : mode === "week" ? "周" : "日"}
          </motion.button>
        ))}
      </div>

      {/* 日历网格 */}
      <div className="bg-white rounded-3xl p-5 shadow-lg shadow-warm-purple/10">
        {/* 星期标题 */}
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

        {/* 日期网格 */}
        <div className="grid grid-cols-7 gap-2">
          {emptyDays.map((i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {days.map((date) => {
            const specialDay = getSpecialDay(date);
            const isCurrentToday = isToday(date);

            return (
              <motion.div
                key={date}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 ${
                  isCurrentToday
                    ? "bg-warm-yellow ring-2 ring-warm-yellow ring-offset-2"
                    : specialDay
                    ? "bg-warm-pink/40"
                    : "bg-gray-50 hover:bg-warm-yellow/20"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span
                  className={`text-sm ${
                    isCurrentToday ? "text-warm-purple" : "text-gray-700"
                  }`}
                  style={{ letterSpacing: "0.5px" }}
                >
                  {date}
                </span>
                {specialDay && (
                  <div className="absolute -top-1 -right-1">
                    {specialDay.type === "birthday" ? (
                      <Cake className="w-4 h-4 text-warm-purple" />
                    ) : (
                      <Star
                        className="w-4 h-4 text-warm-yellow"
                        fill="#FFE082"
                      />
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 重要日期列表 */}
      <div className="mt-6">
        <h3
          className="text-lg text-warm-purple mb-4 px-2 tracking-wide"
        >
          本月重要日期
        </h3>
        <div className="space-y-3">
          {specialDays.map((sd, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-3xl p-4 shadow-md shadow-warm-purple/8 flex items-center gap-4"
              whileHover={{ scale: 1.01 }}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-warm-pink to-warm-yellow flex items-center justify-center">
                {sd.type === "birthday" ? (
                  <Cake className="w-6 h-6 text-warm-purple" />
                ) : (
                  <Star className="w-6 h-6 text-warm-purple" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-warm-purple mb-1 tracking-wide">
                  {sd.name}
                </h4>
                <p className="text-sm text-gray-500">
                  {currentMonth.getMonth() + 1}月{sd.date}日
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
