import { useState } from "react";
import {
  Star,
  Gift,
  Check,
  ToggleLeft,
  ToggleRight,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartDeco,
  PlaneDeco,
} from "../components/DecoElements";
import { EmptyState } from "../components/EmptyState";

const Blessing = () => {
  const [showCompleted, setShowCompleted] = useState(false);
  const [blessings, setBlessings] = useState([
    {
      id: "1",
      name: "妈妈",
      holiday: "生日",
      date: "2月20日",
      completed: false,
    },
    {
      id: "2",
      name: "小李",
      holiday: "春节",
      date: "1月29日",
      completed: true,
    },
    {
      id: "3",
      name: "小美",
      holiday: "情人节",
      date: "2月14日",
      completed: false,
    },
    {
      id: "4",
      name: "张老师",
      holiday: "教师节",
      date: "9月10日",
      completed: false,
    },
  ]);

  const toggleCompleted = (id) => {
    setBlessings(
      blessings.map((b) => (b.id === id ? { ...b, completed: !b.completed } : b))
    );
  };

  const filteredBlessings = showCompleted
    ? blessings
    : blessings.filter((b) => !b.completed);

  return (
    <div className="min-h-screen bg-warm-cream px-5 pt-8 pb-24 relative overflow-hidden">
      {/* 装饰元素 */}
      <HeartDeco className="absolute top-16 right-6 opacity-60" />
      <PlaneDeco className="absolute bottom-48 left-8 opacity-60" />

      {/* 顶部标题和开关 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl text-warm-purple tracking-wide">祝福</h1>
        <motion.button
          onClick={() => setShowCompleted(!showCompleted)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md shadow-warm-purple/8 transition-all hover:shadow-lg"
          whileTap={{ scale: 0.95 }}
        >
          {showCompleted ? (
            <ToggleRight className="w-5 h-5 text-warm-purple" />
          ) : (
            <ToggleLeft className="w-5 h-5 text-gray-400" />
          )}
          <span className="text-sm text-gray-600 tracking-wide">显示已完成</span>
        </motion.button>
      </div>

      {/* 祝福列表 */}
      <div className="bg-white rounded-3xl shadow-lg shadow-warm-purple/10 overflow-hidden">
        {/* 表头 */}
        <div className="bg-gradient-to-r from-warm-yellow to-[#FFEAA7] px-5 py-4">
          <div className="grid grid-cols-12 gap-3">
            <div
              className="col-span-3 text-sm text-warm-purple tracking-wide"
            >
              姓名
            </div>
            <div
              className="col-span-3 text-sm text-warm-purple tracking-wide"
            >
              节日名称
            </div>
            <div
              className="col-span-3 text-sm text-warm-purple tracking-wide"
            >
              日期
            </div>
            <div
              className="col-span-3 text-sm text-warm-purple tracking-wide text-center"
            >
              操作
            </div>
          </div>
        </div>

        {/* 列表项 */}
        <div className="divide-y divide-gray-100">
          {filteredBlessings.length === 0 ? (
            <div className="p-8">
              <EmptyState
                emoji="💝"
                message={
                  showCompleted ? "还没有祝福记录～" : "所有祝福都已完成啦！"
                }
                submessage={
                  showCompleted ? "开始添加你的第一个祝福吧" : "太棒了，继续保持"
                }
              />
            </div>
          ) : (
            filteredBlessings.map((blessing) => (
              <motion.div
                key={blessing.id}
                className="px-5 py-4 hover:bg-warm-cream/50 transition-all"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div
                    className="col-span-3 text-sm text-gray-700 tracking-wide"
                  >
                    {blessing.name}
                  </div>
                  <div
                    className="col-span-3 text-sm text-gray-700 tracking-wide"
                  >
                    {blessing.holiday}
                  </div>
                  <div
                    className="col-span-3 text-sm text-gray-600 tracking-wide"
                  >
                    {blessing.date}
                  </div>
                  <div className="col-span-3 flex items-center justify-center gap-2">
                    <motion.button
                      className="p-2 rounded-full hover:bg-warm-pink/30 transition-all"
                      whileTap={{ scale: 0.9 }}
                      title="查看详情"
                    >
                      <Star
                        className="w-4 h-4 text-warm-yellow"
                        fill="#FFE082"
                      />
                    </motion.button>
                    <motion.button
                      className="p-2 rounded-full hover:bg-warm-yellow/30 transition-all"
                      whileTap={{ scale: 0.9 }}
                      title="编辑祝福"
                    >
                      <Gift className="w-4 h-4 text-warm-purple" />
                    </motion.button>
                    <motion.button
                      onClick={() => toggleCompleted(blessing.id)}
                      className={`p-2 rounded-full transition-all ${
                        blessing.completed
                          ? "bg-warm-purple/20 hover:bg-warm-purple/30"
                          : "hover:bg-warm-purple/10"
                      }`}
                      whileTap={{ scale: 0.9 }}
                      title={blessing.completed ? "已完成" : "标记完成"}
                    >
                      <Check
                        className={`w-4 h-4 ${
                          blessing.completed
                            ? "text-warm-purple"
                            : "text-gray-400"
                        }`}
                      />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* 添加按钮 */}
      <motion.button
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-warm-purple to-warm-purpleLight rounded-full shadow-lg shadow-warm-purple/30 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>
    </div>
  );
};

export default Blessing;
