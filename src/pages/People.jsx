import React, { useState } from 'react';
import { Users, Plus, Search } from 'lucide-react';
import PersonCard from '../components/PersonCard';
import PersonDetail from '../components/PersonDetail';

const People = () => {
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 模拟朋友数据
  const people = [
    {
      id: 1,
      name: '小明',
      alias: '工作伙伴',
      tags: ['工作', '朋友', '同事'],
      lastInteraction: '2024-01-15',
      festivals: [
        { name: '生日', date: '1990-05-20' },
        { name: '结婚纪念日', date: '2020-08-15' }
      ],
      notes: '最近工作压力比较大，需要多关心'
    },
    {
      id: 2,
      name: '妈妈',
      alias: '母亲',
      tags: ['家庭', '亲人'],
      lastInteraction: '2024-01-14',
      festivals: [
        { name: '生日', date: '1965-03-12' }
      ],
      notes: '身体很好，不用担心'
    },
    {
      id: 3,
      name: '小红',
      alias: '闺蜜',
      tags: ['朋友', '闺蜜', '同学'],
      lastInteraction: '2024-01-10',
      festivals: [
        { name: '生日', date: '1992-11-08' }
      ],
      notes: '最近准备换工作，心情不错'
    },
    {
      id: 4,
      name: '老王',
      alias: '邻居',
      tags: ['邻居', '朋友'],
      lastInteraction: '2024-01-08',
      festivals: [],
      notes: '经常一起下棋'
    }
  ];

  const filteredPeople = people.filter(person => 
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.alias?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (selectedPerson) {
    return <PersonDetail person={selectedPerson} onBack={() => setSelectedPerson(null)} />;
  }

  return (
    <div className="min-h-screen bg-background-custom p-4 pb-24">
      <div className="container mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="h-6 w-6 text-[#897dbf]" />
            朋友
          </h1>
          <button className="bg-[#fcd753] text-white p-2 rounded-full hover:bg-[#e6c24a] transition-colors shadow-md">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* 搜索框 */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索朋友..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl shadow-md border border-[#e7e3b3] focus:outline-none focus:ring-2 focus:ring-[#fcd753] focus:border-transparent"
          />
        </div>

        {/* 朋友列表 */}
        <div className="space-y-4">
          {filteredPeople.map((person) => (
            <PersonCard 
              key={person.id} 
              person={person} 
              onClick={setSelectedPerson}
            />
          ))}
        </div>

        {/* 空状态 */}
        {filteredPeople.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchTerm ? '没有找到匹配的朋友' : '还没有添加朋友'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {searchTerm ? '试试其他关键词' : '开始记录社交互动来添加朋友吧'}
            </p>
          </div>
        )}

        {/* 统计信息 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          共 {people.length} 位朋友
        </div>
      </div>
    </div>
  );
};

export default People;
