import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, HelpCircle, Download, ChevronRight, Tag, BarChart3, LogOut, X } from 'lucide-react';
import { exportDataToJson, exportRecordsToCsv } from '../services/export';
import { signOut } from '../services/auth';
import { getPersonTags, getEventTags, createPersonTag, createEventTag, deletePersonTag, deleteEventTag } from '../services/tags';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const [isExporting, setIsExporting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [personTags, setPersonTags] = useState([]);
  const [eventTags, setEventTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [newPersonTag, setNewPersonTag] = useState('');
  const [newEventTag, setNewEventTag] = useState('');
  const [showAddPersonInput, setShowAddPersonInput] = useState(false);
  const [showAddEventInput, setShowAddEventInput] = useState(false);
  const navigate = useNavigate();

  // 模拟数据
  const monthlyStats = {
    totalInteractions: 42,
    topFriends: [
      { name: '小明', count: 12 },
      { name: '妈妈', count: 8 },
      { name: '小红', count: 6 }
    ]
  };

  // 加载标签
  const loadTags = async () => {
    setLoadingTags(true);
    try {
      const [person, event] = await Promise.all([
        getPersonTags(),
        getEventTags()
      ]);
      setPersonTags(person);
      setEventTags(event);
    } catch (err) {
      console.error('加载标签失败:', err);
    } finally {
      setLoadingTags(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tags') {
      loadTags();
    }
  }, [activeTab]);

  // 添加人物标签
  const handleAddPersonTag = async () => {
    if (!newPersonTag.trim()) return;

    try {
      const tag = await createPersonTag(newPersonTag.trim());
      setPersonTags([tag, ...personTags]);
      setNewPersonTag('');
      setShowAddPersonInput(false);
    } catch (err) {
      console.error('添加标签失败:', err);
      alert('添加失败，请重试');
    }
  };

  // 添加事件标签
  const handleAddEventTag = async () => {
    if (!newEventTag.trim()) return;

    try {
      const tag = await createEventTag(newEventTag.trim());
      setEventTags([tag, ...eventTags]);
      setNewEventTag('');
      setShowAddEventInput(false);
    } catch (err) {
      console.error('添加标签失败:', err);
      alert('添加失败，请重试');
    }
  };

  // 删除人物标签
  const handleDeletePersonTag = async (id) => {
    if (!window.confirm('确定要删除这个标签吗？')) return;

    try {
      await deletePersonTag(id);
      setPersonTags(personTags.filter(t => t.id !== id));
    } catch (err) {
      console.error('删除标签失败:', err);
      alert('删除失败，请重试');
    }
  };

  // 删除事件标签
  const handleDeleteEventTag = async (id) => {
    if (!window.confirm('确定要删除这个标签吗？')) return;

    try {
      await deleteEventTag(id);
      setEventTags(eventTags.filter(t => t.id !== id));
    } catch (err) {
      console.error('删除标签失败:', err);
      alert('删除失败，请重试');
    }
  };

  const handleExportData = async (format = 'json') => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      if (format === 'csv') {
        await exportRecordsToCsv();
        alert('CSV 导出成功！');
      } else {
        await exportDataToJson();
        alert('数据导出成功！');
      }
    } catch (err) {
      console.error('导出失败:', err);
      alert('导出失败，请检查网络连接或重试');
    } finally {
      setIsExporting(false);
    }
  };

  const showExportOptions = () => {
    const choice = window.confirm('点击确定导出全部数据（JSON）\n点击取消导出为 CSV 格式');
    if (choice) {
      handleExportData('json');
    } else {
      handleExportData('csv');
    }
  };

  const handleAIConfig = () => {
    alert('AI接口配置功能即将实现');
  };

  const handleSignOut = async () => {
    if (!window.confirm('确定要退出登录吗？')) return;

    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('登出失败:', err);
      alert('登出失败，请重试');
    } finally {
      setIsSigningOut(false);
    }
  };

  const renderSettings = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">数据管理</h3>
        <button
          onClick={showExportOptions}
          disabled={isExporting}
          className="w-full flex items-center justify-between p-4 bg-[#e7e3b3] rounded-lg hover:bg-[#fcd753] hover:text-white transition-colors disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-[#897dbf]" />
            <span>{isExporting ? '导出中...' : '一键导出数据'}</span>
          </div>
          <ChevronRight className="h-5 w-5 text-[#897dbf]" />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">AI设置</h3>
        <button
          onClick={handleAIConfig}
          className="w-full flex items-center justify-between p-4 bg-[#e7e3b3] rounded-lg hover:bg-[#fcd753] hover:text-white transition-colors"
        >
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-[#897dbf]" />
            <span>AI接口配置</span>
          </div>
          <ChevronRight className="h-5 w-5 text-[#897dbf]" />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">帮助与反馈</h3>
        <button className="w-full flex items-center justify-between p-4 bg-[#e7e3b3] rounded-lg hover:bg-[#fcd753] hover:text-white transition-colors">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-[#897dbf]" />
            <span>帮助中心</span>
          </div>
          <ChevronRight className="h-5 w-5 text-[#897dbf]" />
        </button>

        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full flex items-center justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors mt-4"
        >
          <div className="flex items-center gap-3">
            <LogOut className="h-5 w-5 text-red-500" />
            <span className="text-red-600">{isSigningOut ? '退出中...' : '退出登录'}</span>
          </div>
          <ChevronRight className="h-5 w-5 text-red-500" />
        </button>
      </div>
    </div>
  );

  const renderMonthlySummary = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#897dbf]" />
          本月统计
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#e7e3b3] rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-[#fcd753]">{monthlyStats.totalInteractions}</p>
            <p className="text-sm text-gray-600">总互动次数</p>
          </div>
          <div className="bg-[#e7e3b3] rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-[#fcd753]">{monthlyStats.topFriends.length}</p>
            <p className="text-sm text-gray-600">活跃好友</p>
          </div>
        </div>

        <h4 className="font-medium text-gray-700 mb-3">交流最多的小伙伴</h4>
        <div className="space-y-3">
          {monthlyStats.topFriends.map((friend, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-[#e7e3b3] rounded-lg">
              <div className="w-10 h-10 bg-[#fcd753] rounded-full flex items-center justify-center">
                <span className="text-white font-medium">{friend.name.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{friend.name}</p>
                <p className="text-sm text-gray-600">{friend.count} 次互动</p>
              </div>
              <span className="text-[#897dbf] font-medium">#{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTagManagement = () => (
    <div className="space-y-4">
      {/* 人物标签管理 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5 text-[#897dbf]" />
          人物标签管理
        </h3>

        {loadingTags ? (
          <div className="text-center py-4 text-gray-500">加载中...</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {personTags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-1 group">
                  <span className="px-3 py-1 bg-[#d6b7d6] text-[#897dbf] rounded-full text-sm">
                    {tag.name}
                  </span>
                  <button
                    onClick={() => handleDeletePersonTag(tag.id)}
                    className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {personTags.length === 0 && (
                <p className="text-gray-400 text-sm">暂无标签，点击下方添加</p>
              )}
            </div>

            {showAddPersonInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPersonTag}
                  onChange={(e) => setNewPersonTag(e.target.value)}
                  placeholder="输入标签名称"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#897dbf]"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPersonTag()}
                />
                <button
                  onClick={handleAddPersonTag}
                  className="px-4 py-2 bg-[#897dbf] text-white rounded-lg hover:bg-[#6b5aa3]"
                >
                  添加
                </button>
                <button
                  onClick={() => { setShowAddPersonInput(false); setNewPersonTag(''); }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddPersonInput(true)}
                className="text-[#fcd753] hover:text-[#e6c24a] transition-colors"
              >
                + 添加新标签
              </button>
            )}
          </>
        )}
      </div>

      {/* 事件标签管理 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5 text-[#897dbf]" />
          事件标签管理
        </h3>

        {loadingTags ? (
          <div className="text-center py-4 text-gray-500">加载中...</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {eventTags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-1 group">
                  <span className="px-3 py-1 bg-[#d6b7d6] text-[#897dbf] rounded-full text-sm">
                    {tag.name}
                  </span>
                  <button
                    onClick={() => handleDeleteEventTag(tag.id)}
                    className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {eventTags.length === 0 && (
                <p className="text-gray-400 text-sm">暂无标签，点击下方添加</p>
              )}
            </div>

            {showAddEventInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newEventTag}
                  onChange={(e) => setNewEventTag(e.target.value)}
                  placeholder="输入标签名称"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#897dbf]"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEventTag()}
                />
                <button
                  onClick={handleAddEventTag}
                  className="px-4 py-2 bg-[#897dbf] text-white rounded-lg hover:bg-[#6b5aa3]"
                >
                  添加
                </button>
                <button
                  onClick={() => { setShowAddEventInput(false); setNewEventTag(''); }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddEventInput(true)}
                className="text-[#fcd753] hover:text-[#e6c24a] transition-colors"
              >
                + 添加新标签
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background-custom p-4 pb-24">
      <div className="container mx-auto">
        {/* 用户信息卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-[#fcd753] rounded-full flex items-center justify-center shadow-md">
              <User className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">用户</h2>
              <p className="text-gray-500">记录你的社交生活</p>
            </div>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="flex bg-white rounded-lg p-1 shadow-md mb-6">
          {[
            { id: 'settings', label: '设置', icon: Settings },
            { id: 'summary', label: '月度总结', icon: BarChart3 },
            { id: 'tags', label: '标签管理', icon: Tag }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${activeTab === tab.id
                    ? 'bg-[#fcd753] text-white'
                    : 'text-gray-600 hover:bg-[#e7e3b3]'}
                `}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 标签页内容 */}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'summary' && renderMonthlySummary()}
        {activeTab === 'tags' && renderTagManagement()}
      </div>
    </div>
  );
};

export default Profile;
