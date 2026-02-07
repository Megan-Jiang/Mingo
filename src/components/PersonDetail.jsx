import React from 'react';
import { ArrowLeft, Calendar, Tag, Edit3, Gift } from 'lucide-react';

const PersonDetail = ({ person, onBack }) => {
  const events = [
    {
      id: 1,
      date: '2024-01-15',
      summary: '讨论了项目进展，他最近工作压力比较大',
      tags: ['工作', '压力']
    },
    {
      id: 2,
      date: '2024-01-10',
      summary: '一起吃饭，聊了最近的近况',
      tags: ['聚会', '日常']
    }
  ];

  return (
    <div className="min-h-screen bg-background-custom">
      <div className="container mx-auto px-4 py-6">
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
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 bg-[#fcd753] rounded-full flex items-center justify-center shadow-md">
              <img 
                src={`https://nocode.meituan.com/photo/search?keyword=person&width=80&height=80`}
                alt={person.name}
                className="w-18 h-18 rounded-full mx-auto object-cover"
              />
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">{person.name}</h2>
              {person.alias && (
                <p className="text-lg text-[#897dbf] mb-2">{person.alias}</p>
              )}
              
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Calendar className="h-4 w-4 text-[#897dbf]" />
                <span>最近互动: {person.lastInteraction}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-400" />
                <div className="flex gap-1">
                  {person.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-[#d6b7d6] text-[#897dbf] text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <button className="p-2 hover:bg-[#e7e3b3] rounded-full transition-colors">
              <Edit3 className="h-5 w-5 text-[#897dbf]" />
            </button>
          </div>
          
          {/* 重要节日 */}
          {person.festivals && person.festivals.length > 0 && (
            <div className="border-t border-[#e7e3b3] pt-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Gift className="h-5 w-5 text-[#897dbf]" />
                重要节日
              </h3>
              <div className="space-y-2">
                {person.festivals.map((festival, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-[#e7e3b3] rounded-lg">
                    <span className="text-gray-700">{festival.name}</span>
                    <span className="text-sm text-[#897dbf]">{festival.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 近况备注 */}
          {person.notes && (
            <div className="border-t border-[#e7e3b3] pt-4 mt-4">
              <h3 className="font-semibold text-gray-800 mb-2">近况备注</h3>
              <p className="text-gray-600">{person.notes}</p>
            </div>
          )}
        </div>

        {/* 时间轴事件列表 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#897dbf]" />
            互动记录
          </h3>
          
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border-l-4 border-[#fcd753] pl-4 py-3 hover:bg-[#e7e3b3] rounded-r-lg transition-colors">
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
                        className="px-2 py-1 bg-[#d6b7d6] text-[#897dbf] text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {events.length === 0 && (
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
