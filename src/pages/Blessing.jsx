import { useState, useEffect } from "react";
import {
  Star,
  Check,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Copy,
  X,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartDeco,
  PlaneDeco,
} from "../components/DecoElements";
import { EmptyState } from "../components/EmptyState";
import { getBlessings, getFriendWithDetails, toggleBlessingCompleted } from "../services/friends";
import { generateBlessing } from "../services/ai";
import { createBlessing, getBlessings as getAllBlessings } from "../services/blessings";
import { supabase } from "../lib/supabase";

// 祝福语弹窗组件
const BlessingDialog = ({ blessing, onClose, onConfirm }) => {
  const [blessingText, setBlessingText] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('BlessingDialog 初始化', blessing);
    generate();
  }, []);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('开始生成祝福语', blessing.name, blessing.holiday, blessing.type);

      // 获取朋友的详细信息（包含标签和互动记录）
      let tags = [];
      let recentRecords = [];
      let remark = '';
      try {
        const friendDetails = await getFriendWithDetails(blessing.friend_id);
        tags = friendDetails.tags || [];
        recentRecords = friendDetails.recentRecords || [];
        remark = friendDetails.remark || '';
        console.log('获取朋友详情成功', { tags, recentRecords, remark });
      } catch (err) {
        console.warn('获取朋友详情失败，使用默认信息', err);
      }

      const text = await generateBlessing(
        blessing.name,
        blessing.holiday,
        blessing.type,
        tags,
        recentRecords,
        remark
      );
      console.log('生成成功:', text);
      setBlessingText(text);
    } catch (err) {
      console.error('生成祝福语失败:', err);
      setError(err.message);
      setBlessingText('生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(blessingText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = () => {
    onConfirm(blessingText);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-warm-yellow" fill="#FFE082" />
              <h2 className="text-lg font-semibold text-gray-800">
                {blessing.name} · {blessing.holiday}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* 祝福语内容 */}
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-10 h-10 border-4 border-warm-purple/30 border-t-warm-purple rounded-full animate-spin mb-4" />
                <p className="text-gray-500">AI 正在生成祝福语...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 rounded-2xl p-5 mb-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            ) : (
              <div className="bg-warm-cream rounded-2xl p-5 mb-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {blessingText}
                </p>
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="flex gap-3 px-6 py-4 border-t bg-gray-50">
            <motion.button
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              重新生成
            </motion.button>
            <motion.button
              onClick={handleCopy}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              <Copy className="w-4 h-4" />
              {copied ? '已复制' : '复制'}
            </motion.button>
            <motion.button
              onClick={handleConfirm}
              disabled={loading || !blessingText}
              className="flex-1 px-6 py-3 bg-warm-purple text-white rounded-xl hover:bg-warm-purple/80 disabled:opacity-50 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              确认使用
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const Blessing = () => {
  const [showCompleted, setShowCompleted] = useState(false);
  const [blessings, setBlessings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlessing, setSelectedBlessing] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadBlessings();
    getCurrentUser();
  }, []);

  const loadBlessings = async () => {
    try {
      const data = await getBlessings();
      setBlessings(data);
    } catch (err) {
      console.error('加载祝福列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const toggleCompleted = async (id) => {
    const blessing = blessings.find(b => b.id === id);
    if (!blessing) return;

    const newStatus = !blessing.completed;

    // 先更新本地状态
    setBlessings(
      blessings.map((b) => (b.id === id ? { ...b, completed: newStatus } : b))
    );

    // 保存到数据库
    try {
      await toggleBlessingCompleted(blessing.friend_id, blessing.holiday, newStatus);
    } catch (err) {
      console.error('保存祝福状态失败:', err);
      // 如果保存失败，恢复原状态
      setBlessings(
        blessings.map((b) => (b.id === id ? { ...b, completed: !newStatus } : b))
      );
      alert('保存失败，请重试');
    }
  };

  const handleGenerateBlessing = async (text) => {
    // 复制到剪贴板
    navigator.clipboard.writeText(text);

    // 保存祝福到数据库
    if (selectedBlessing) {
      try {
        await createBlessing({
          user_id: userId,
          friend_id: selectedBlessing.friend_id,
          holiday_name: selectedBlessing.holiday,
          blessing_text: text,
          status: 'completed',
          completed_at: new Date().toISOString()
        });
        console.log('祝福已保存到数据库');
      } catch (err) {
        console.error('保存祝福失败:', err);
      }

      // 标记为已完成
      toggleCompleted(selectedBlessing.id);
    }
  };

  // 导出所有祝福为JSON格式
  const exportBlessings = async () => {
    try {
      const { data: blessings } = await supabase
        .from('blessings')
        .select('friend_id, holiday_name, blessing_text')
        .eq('status', 'completed');

      // 获取朋友名字
      const { data: friends } = await supabase
        .from('friends')
        .select('id, name');

      const friendMap = {};
      friends?.forEach(f => { friendMap[f.id] = f.name; });

      const exportData = blessings?.map(b => ({
        name: friendMap[b.friend_id] || '未知',
        holiday: b.holiday_name,
        blessing: b.blessing_text
      })) || [];

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blessings_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('导出祝福失败:', err);
      alert('导出失败，请重试');
    }
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
        <div className="flex items-center gap-2">
          <motion.button
            onClick={exportBlessings}
            className="p-2 rounded-full bg-white shadow-md shadow-warm-purple/8 transition-all hover:shadow-lg"
            whileTap={{ scale: 0.95 }}
            title="导出祝福"
          >
            <Download className="w-5 h-5 text-warm-purple" />
          </motion.button>
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
                    <button
                      onClick={() => {
                        console.log('点击星星按钮', blessing);
                        setSelectedBlessing(blessing);
                      }}
                      className="p-2 rounded-full hover:bg-warm-pink/30 transition-all"
                      title="生成祝福"
                    >
                      <Star
                        className="w-4 h-4 text-warm-yellow"
                        fill="#FFE082"
                      />
                    </button>
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

      {/* AI 祝福语弹窗 */}
      {selectedBlessing && (
        <BlessingDialog
          blessing={selectedBlessing}
          onClose={() => setSelectedBlessing(null)}
          onConfirm={handleGenerateBlessing}
        />
      )}
    </div>
  );
};

export default Blessing;
