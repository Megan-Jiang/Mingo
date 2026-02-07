import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Settings,
  HelpCircle,
  Download,
  ChevronRight,
  Tag,
  BarChart3,
  LogOut,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { CloudDeco, StarDeco, HeartDeco, PlaneDeco } from "../components/DecoElements";
import { EmptyState } from "../components/EmptyState";
import { exportDataToJson, exportRecordsToCsv } from "../services/export";
import { signOut } from "../services/auth";
import {
  getPersonTags,
  getEventTags,
  createPersonTag,
  createEventTag,
  deletePersonTag,
  deleteEventTag,
} from "../services/tags";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("settings");
  const [isExporting, setIsExporting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [personTags, setPersonTags] = useState([]);
  const [eventTags, setEventTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [newPersonTag, setNewPersonTag] = useState("");
  const [newEventTag, setNewEventTag] = useState("");
  const [showAddPersonInput, setShowAddPersonInput] = useState(false);
  const [showAddEventInput, setShowAddEventInput] = useState(false);
  const navigate = useNavigate();

  // 模拟数据
  const monthlyStats = {
    totalInteractions: 42,
    topFriends: [
      { name: "小明", count: 12 },
      { name: "妈妈", count: 8 },
      { name: "小红", count: 6 },
    ],
  };

  // 加载标签
  const loadTags = async () => {
    setLoadingTags(true);
    try {
      const [person, event] = await Promise.all([
        getPersonTags(),
        getEventTags(),
      ]);
      setPersonTags(person);
      setEventTags(event);
    } catch (err) {
      console.error("加载标签失败:", err);
    } finally {
      setLoadingTags(false);
    }
  };

  useEffect(() => {
    if (activeTab === "tags") {
      loadTags();
    }
  }, [activeTab]);

  // 添加人物标签
  const handleAddPersonTag = async () => {
    if (!newPersonTag.trim()) return;

    try {
      const tag = await createPersonTag(newPersonTag.trim());
      setPersonTags([tag, ...personTags]);
      setNewPersonTag("");
      setShowAddPersonInput(false);
    } catch (err) {
      console.error("添加标签失败:", err);
      alert("添加失败，请重试");
    }
  };

  // 添加事件标签
  const handleAddEventTag = async () => {
    if (!newEventTag.trim()) return;

    try {
      const tag = await createEventTag(newEventTag.trim());
      setEventTags([tag, ...eventTags]);
      setNewEventTag("");
      setShowAddEventInput(false);
    } catch (err) {
      console.error("添加标签失败:", err);
      alert("添加失败，请重试");
    }
  };

  // 删除人物标签
  const handleDeletePersonTag = async (id) => {
    if (!window.confirm("确定要删除这个标签吗？")) return;

    try {
      await deletePersonTag(id);
      setPersonTags(personTags.filter((t) => t.id !== id));
    } catch (err) {
      console.error("删除标签失败:", err);
      alert("删除失败，请重试");
    }
  };

  // 删除事件标签
  const handleDeleteEventTag = async (id) => {
    if (!window.confirm("确定要删除这个标签吗？")) return;

    try {
      await deleteEventTag(id);
      setEventTags(eventTags.filter((t) => t.id !== id));
    } catch (err) {
      console.error("删除标签失败:", err);
      alert("删除失败，请重试");
    }
  };

  const handleExportData = async (format = "json") => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      if (format === "csv") {
        await exportRecordsToCsv();
        alert("CSV 导出成功！");
      } else {
        await exportDataToJson();
        alert("数据导出成功！");
      }
    } catch (err) {
      console.error("导出失败:", err);
      alert("导出失败，请检查网络连接或重试");
    } finally {
      setIsExporting(false);
    }
  };

  const showExportOptions = () => {
    const choice = window.confirm(
      "点击确定导出全部数据（JSON）\n点击取消导出为 CSV 格式"
    );
    if (choice) {
      handleExportData("json");
    } else {
      handleExportData("csv");
    }
  };

  const handleAIConfig = () => {
    alert("AI接口配置功能即将实现");
  };

  const handleSignOut = async () => {
    if (!window.confirm("确定要退出登录吗？")) return;

    setIsSigningOut(true);
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      console.error("登出失败:", err);
      alert("登出失败，请重试");
    } finally {
      setIsSigningOut(false);
    }
  };

  const renderSettings = () => (
    <div className="space-y-4">
      {/* 数据管理 */}
      <div className="bg-white rounded-3xl shadow-lg p-6 shadow-warm-purple/5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 tracking-wide">
          数据管理
        </h3>
        <motion.button
          onClick={showExportOptions}
          disabled={isExporting}
          className="w-full flex items-center justify-between p-4 bg-warm-cream rounded-2xl hover:bg-warm-yellow/30 transition-all disabled:opacity-50"
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-warm-purple" />
            <span className="text-gray-700 tracking-wide">
              {isExporting ? "导出中..." : "一键导出数据"}
            </span>
          </div>
          <ChevronRight className="h-5 w-5 text-warm-purple" />
        </motion.button>
      </div>

      {/* AI设置 */}
      <div className="bg-white rounded-3xl shadow-lg p-6 shadow-warm-purple/5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 tracking-wide">
          AI设置
        </h3>
        <motion.button
          onClick={handleAIConfig}
          className="w-full flex items-center justify-between p-4 bg-warm-cream rounded-2xl hover:bg-warm-yellow/30 transition-all"
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-warm-purple" />
            <span className="text-gray-700 tracking-wide">AI接口配置</span>
          </div>
          <ChevronRight className="h-5 w-5 text-warm-purple" />
        </motion.button>
      </div>

      {/* 帮助与反馈 */}
      <div className="bg-white rounded-3xl shadow-lg p-6 shadow-warm-purple/5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 tracking-wide">
          帮助与反馈
        </h3>
        <motion.button
          className="w-full flex items-center justify-between p-4 bg-warm-cream rounded-2xl hover:bg-warm-yellow/30 transition-all mb-3"
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-warm-purple" />
            <span className="text-gray-700 tracking-wide">帮助中心</span>
          </div>
          <ChevronRight className="h-5 w-5 text-warm-purple" />
        </motion.button>

        <motion.button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full flex items-center justify-between p-4 bg-warm-pink/20 rounded-2xl hover:bg-warm-pink/30 transition-all"
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <LogOut className="h-5 w-5 text-red-500" />
            <span className="text-red-600 tracking-wide">
              {isSigningOut ? "退出中..." : "退出登录"}
            </span>
          </div>
          <ChevronRight className="h-5 w-5 text-red-500" />
        </motion.button>
      </div>
    </div>
  );

  const renderMonthlySummary = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl shadow-lg p-6 shadow-warm-purple/5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 tracking-wide">
          <BarChart3 className="h-5 w-5 text-warm-purple" />
          本月统计
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-warm-cream rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-warm-purple">
              {monthlyStats.totalInteractions}
            </p>
            <p className="text-sm text-gray-600">总互动次数</p>
          </div>
          <div className="bg-warm-cream rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-warm-purple">
              {monthlyStats.topFriends.length}
            </p>
            <p className="text-sm text-gray-600">活跃好友</p>
          </div>
        </div>

        <h4 className="font-medium text-gray-700 mb-3 tracking-wide">
          交流最多的小伙伴
        </h4>
        <div className="space-y-3">
          {monthlyStats.topFriends.map((friend, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-warm-cream rounded-2xl"
            >
              <div className="w-10 h-10 bg-warm-yellow rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {friend.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{friend.name}</p>
                <p className="text-sm text-gray-600">{friend.count} 次互动</p>
              </div>
              <span className="text-warm-purple font-medium">#{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTagManagement = () => (
    <div className="space-y-4">
      {/* 人物标签管理 */}
      <div className="bg-white rounded-3xl shadow-lg p-6 shadow-warm-purple/5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 tracking-wide">
          <Tag className="h-5 w-5 text-warm-purple" />
          人物标签管理
        </h3>

        {loadingTags ? (
          <div className="text-center py-4 text-gray-500">加载中...</div>
        ) : (
          <>
            {/* 标签列表 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {personTags.map((tag) => (
                <div key={tag.id} className="flex items-center">
                  <span className="px-3 py-1 bg-warm-purple/10 text-warm-purple rounded-full text-sm tracking-wide">
                    {tag.name}
                  </span>
                  <button
                    onClick={() => handleDeletePersonTag(tag.id)}
                    className="px-2 py-1 bg-warm-pink/30 text-warm-pink rounded-r-full text-sm hover:bg-warm-pink/50"
                    title="删除标签"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {personTags.length === 0 && (
                <p className="text-gray-400 text-sm">暂无标签</p>
              )}
            </div>

            {/* 添加按钮/输入框 */}
            {showAddPersonInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPersonTag}
                  onChange={(e) => setNewPersonTag(e.target.value)}
                  placeholder="输入标签名称"
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-warm-purple/30 bg-warm-cream"
                  onKeyPress={(e) => e.key === "Enter" && handleAddPersonTag()}
                />
                <motion.button
                  onClick={handleAddPersonTag}
                  className="px-4 py-1.5 bg-warm-purple text-white rounded-xl hover:bg-warm-purpleLight text-sm"
                  whileTap={{ scale: 0.95 }}
                >
                  确定
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowAddPersonInput(false);
                    setNewPersonTag("");
                  }}
                  className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 text-sm"
                  whileTap={{ scale: 0.95 }}
                >
                  取消
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={() => setShowAddPersonInput(true)}
                className="px-4 py-1.5 bg-warm-yellow text-white rounded-full text-sm hover:bg-warm-yellowLight"
                whileTap={{ scale: 0.95 }}
              >
                + 添加标签
              </motion.button>
            )}
          </>
        )}
      </div>

      {/* 事件标签管理 */}
      <div className="bg-white rounded-3xl shadow-lg p-6 shadow-warm-purple/5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 tracking-wide">
          <Tag className="h-5 w-5 text-warm-purple" />
          事件标签管理
        </h3>

        {loadingTags ? (
          <div className="text-center py-4 text-gray-500">加载中...</div>
        ) : (
          <>
            {/* 标签列表 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {eventTags.map((tag) => (
                <div key={tag.id} className="flex items-center">
                  <span className="px-3 py-1 bg-warm-purple/10 text-warm-purple rounded-full text-sm tracking-wide">
                    {tag.name}
                  </span>
                  <button
                    onClick={() => handleDeleteEventTag(tag.id)}
                    className="px-2 py-1 bg-warm-pink/30 text-warm-pink rounded-r-full text-sm hover:bg-warm-pink/50"
                    title="删除标签"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {eventTags.length === 0 && (
                <p className="text-gray-400 text-sm">暂无标签</p>
              )}
            </div>

            {/* 添加按钮/输入框 */}
            {showAddEventInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newEventTag}
                  onChange={(e) => setNewEventTag(e.target.value)}
                  placeholder="输入标签名称"
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-warm-purple/30 bg-warm-cream"
                  onKeyPress={(e) => e.key === "Enter" && handleAddEventTag()}
                />
                <motion.button
                  onClick={handleAddEventTag}
                  className="px-4 py-1.5 bg-warm-purple text-white rounded-xl hover:bg-warm-purpleLight text-sm"
                  whileTap={{ scale: 0.95 }}
                >
                  确定
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowAddEventInput(false);
                    setNewEventTag("");
                  }}
                  className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 text-sm"
                  whileTap={{ scale: 0.95 }}
                >
                  取消
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={() => setShowAddEventInput(true)}
                className="px-4 py-1.5 bg-warm-yellow text-white rounded-full text-sm hover:bg-warm-yellowLight"
                whileTap={{ scale: 0.95 }}
              >
                + 添加标签
              </motion.button>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-warm-cream px-5 pt-8 pb-24 relative overflow-hidden">
      {/* 装饰元素 */}
      <CloudDeco className="absolute top-10 left-5 opacity-50" />
      <StarDeco className="absolute top-32 right-8 opacity-50" />
      <HeartDeco className="absolute bottom-40 left-10 opacity-50" />
      <PlaneDeco className="absolute bottom-20 right-5 opacity-40" />

      {/* 用户信息卡片 */}
      <div className="bg-white rounded-3xl p-6 mb-6 shadow-lg shadow-warm-purple/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-warm-yellow/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-warm-purple to-warm-purpleLight rounded-full flex items-center justify-center shadow-lg shadow-warm-purple/20">
            <User className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 tracking-wide">
              用户
            </h2>
            <p className="text-gray-500 text-sm tracking-wide">
              记录你的社交生活
            </p>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="flex bg-white rounded-2xl p-1.5 shadow-md shadow-warm-purple/5 mb-6">
        {[
          { id: "settings", label: "设置", icon: Settings },
          { id: "summary", label: "月度总结", icon: BarChart3 },
          { id: "tags", label: "标签管理", icon: Tag },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-warm-purple text-white shadow-lg shadow-warm-purple/20"
                  : "text-gray-600 hover:bg-warm-cream"
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </motion.button>
          );
        })}
      </div>

      {/* 标签页内容 */}
      {activeTab === "settings" && renderSettings()}
      {activeTab === "summary" && renderMonthlySummary()}
      {activeTab === "tags" && renderTagManagement()}
    </div>
  );
};

export default Profile;
