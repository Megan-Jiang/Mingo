import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, HelpCircle, Download, ChevronRight, Tag, BarChart3, LogOut } from 'lucide-react';
import { exportDataToJson, exportRecordsToCsv } from '../services/export';
import { signOut } from '../services/auth';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const [isExporting, setIsExporting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigate = useNavigate();

  // 模拟数据
  const monthlyStats = {
    totalInteractions: 42,
    topFriends: [
      { name: '小明', count: 12, avatar: 'https://nocode.meituan.com/photo/search?keyword=person&width=40&height=40' },
      { name: '妈妈', count: 8, avatar: 'https://nocode.meituan.com/photo/search?keyword=person&width=40&height=40' },
      { name: '小红', count: 6, avatar: 'https://nocode.meituan.com/photo/search?keyword=person&width=40&height=40' }
    ]
  };

  const personTags = ['工作', '研究生', '本科生', '朋友', '家人', '同事'];
  const eventTags = ['重要', '思考型', '陪伴型', '娱乐', '学习'];

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
    // 弹出选择导出格式
    const choice = window.confirm('点击确定导出全部数据（JSON）\n点击取消导出为 CSV 格式');
    if (choice) {
      handleExportData('json');
    } else {
      handleExportData('csv');
    }
  };

  const handleAIConfig = () => {
    // AI接口配置逻辑
    alert('AI接口配置功能即将实现');
  };

  const handleSignOut = async () => {
    // 确认登出
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
              <div className="relative">
                <img 
                  src={friend.avatar} 
                  alt={friend.name}
                  className="w-10 h-10 rounded-full mx-auto object-cover"
                />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#fcd753] text-white text-xs rounded-full flex items-center justify-center">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{friend.name}</p>
                <p className="text-sm text-gray-600">{friend.count} 次互动</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTagManagement = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5 text-[#897dbf]" />
          人物标签管理
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {personTags.map((tag, index) => (
            <span 
              key={index}
              className="px-3 py-1 bg-[#d6b7d6] text-[#897dbf] rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
        <button className="text-[#fcd753] hover:text-[#e6c24a] transition-colors">
          + 添加新标签
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5 text-[#897dbf]" />
          事件标签管理
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {eventTags.map((tag, index) => (
            <span 
              key={index}
              className="px-3 py-1 bg-[#d6b7d6] text-[#897dbf] rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
        <button className="text-[#fcd753] hover:text-[#e6c24a] transition-colors">
          + 添加新标签
        </button>
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
