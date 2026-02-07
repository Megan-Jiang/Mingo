import React, { useState } from 'react';
import { Gift, Sparkles, RefreshCw, Check, Eye, EyeOff } from 'lucide-react';

const Blessing = () => {
  const [showCompleted, setShowCompleted] = useState(false);
  const [blessings, setBlessings] = useState([
    {
      id: 1,
      name: '小明',
      festival: '生日',
      date: '2024-02-10',
      completed: false
    },
    {
      id: 2,
      name: '妈妈',
      festival: '母亲节',
      date: '2024-05-12',
      completed: false
    },
    {
      id: 3,
      name: '小红',
      festival: '生日',
      date: '2024-03-15',
      completed: true
    },
    {
      id: 4,
      name: '老王',
      festival: '春节',
      date: '2024-02-10',
      completed: false
    }
  ]);

  const [selectedBlessing, setSelectedBlessing] = useState(null);
  const [blessingText, setBlessingText] = useState('');
  const [showBlessingModal, setShowBlessingModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);

  // 按日期排序，未完成的在前
  const sortedBlessings = [...blessings].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed - b.completed; // 未完成的排在前面
    }
    return new Date(a.date) - new Date(b.date); // 日期近的排在前面
  });

  // 过滤显示的数据
  const displayedBlessings = showCompleted 
    ? sortedBlessings 
    : sortedBlessings.filter(b => !b.completed);

  const handleComplete = (id) => {
    setBlessings(blessings.map(b => 
      b.id === id ? { ...b, completed: !b.completed } : b
    ));
  };

  const handleGenerateBlessing = (blessing) => {
    setSelectedBlessing(blessing);
    setBlessingText(`亲爱的${blessing.name}，祝您${blessing.festival}快乐！愿您在新的一年里身体健康，工作顺利，阖家幸福！`);
    setShowBlessingModal(true);
  };

  const handleGenerateCard = (blessing) => {
    setSelectedBlessing(blessing);
    setShowCardModal(true);
  };

  const refreshBlessing = () => {
    if (selectedBlessing) {
      setBlessingText(`亲爱的${selectedBlessing.name}，祝您${selectedBlessing.festival}快乐！愿您在新的一年里身体健康，工作顺利，阖家幸福！`);
    }
  };

  return (
    <div className="min-h-screen bg-background-custom p-4 pb-24">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Gift className="h-6 w-6 text-[#897dbf]" />
            祝福
          </h1>
          
          <button 
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#897dbf] transition-colors"
          >
            {showCompleted ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showCompleted ? '隐藏已完成' : '显示已完成'}
          </button>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#e7e3b3]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">节日名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedBlessings.map((blessing) => (
                  <tr 
                    key={blessing.id} 
                    className={blessing.completed ? 'bg-gray-100 text-gray-500' : 'hover:bg-[#e7e3b3]'}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {blessing.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {blessing.festival}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {blessing.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleGenerateBlessing(blessing)}
                          className="p-2 text-[#897dbf] hover:bg-[#e7e3b3] rounded-full transition-colors"
                          title="生成祝福"
                        >
                          <Sparkles className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleGenerateCard(blessing)}
                          className="p-2 text-[#897dbf] hover:bg-[#e7e3b3] rounded-full transition-colors"
                          title="生成贺卡"
                        >
                          <Gift className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleComplete(blessing.id)}
                          className={`p-2 rounded-full transition-colors ${
                            blessing.completed 
                              ? 'text-green-600 hover:bg-green-100' 
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={blessing.completed ? '标记未完成' : '标记完成'}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {displayedBlessings.length === 0 && (
            <div className="text-center py-12">
              <Gift className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {showCompleted ? '没有祝福记录' : '没有未完成的祝福'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 祝福文本生成弹窗 */}
      {showBlessingModal && selectedBlessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#897dbf]" />
                <span className="font-medium">AI祝福生成</span>
              </div>
              <button
                onClick={() => setShowBlessingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <div className="bg-[#e7e3b3] rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#897dbf] font-medium">GPT-3.5</span>
                  <button 
                    onClick={refreshBlessing}
                    className="text-[#897dbf] hover:text-[#fcd753] transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  value={blessingText}
                  onChange={(e) => setBlessingText(e.target.value)}
                  className="w-full h-32 p-2 border border-[#e7e3b3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fcd753] focus:border-transparent resize-none"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    // 处理确认逻辑
                    setShowBlessingModal(false);
                  }}
                  className="px-4 py-2 bg-[#fcd753] text-white rounded-lg hover:bg-[#e6c24a] transition-colors"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 贺卡生成弹窗 */}
      {showCardModal && selectedBlessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-[#897dbf]" />
                <span className="font-medium">贺卡生成</span>
              </div>
              <button
                onClick={() => setShowCardModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <div className="bg-[#e7e3b3] rounded-lg p-4 mb-4">
                <img 
                  src={`https://nocode.meituan.com/photo/search?keyword=greeting,card&width=300&height=200`}
                  alt="贺卡"
                  className="w-full h-48 mx-auto object-cover rounded-lg"
                />
                <p className="text-center text-sm text-gray-600 mt-2">
                  {selectedBlessing.name}的{selectedBlessing.festival}贺卡
                </p>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    // 处理确认逻辑
                    setShowCardModal(false);
                  }}
                  className="px-4 py-2 bg-[#fcd753] text-white rounded-lg hover:bg-[#e6c24a] transition-colors"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blessing;
