import React, { useState, useEffect } from 'react';
import { Users, Plus, Search } from 'lucide-react';
import PersonCard from '../components/PersonCard';
import PersonDetail from '../components/PersonDetail';
import { getFriends } from '../services/friends';

const People = () => {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [error, setError] = useState(null);

  // 从 Supabase 加载朋友数据
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);
        const data = await getFriends();
        // 字段映射：remark → alias, important_days → festivals
        const mappedData = data.map(friend => ({
          ...friend,
          alias: friend.remark,
          festivals: friend.important_days || [],
          lastInteraction: friend.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
        }));
        setPeople(mappedData);
        setError(null);
      } catch (err) {
        console.error('加载朋友列表失败:', err);
        setError('加载失败，请检查网络连接');
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  // 过滤搜索结果
  const filteredPeople = people.filter(person =>
    person.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.alias?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (person.tags || []).some(tag => tag?.toLowerCase().includes(searchTerm.toLowerCase()))
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

        {/* 加载状态 */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-[#897dbf] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">加载中...</p>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* 朋友列表 */}
        {!loading && !error && (
          <>
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
            {people.length > 0 && (
              <div className="mt-8 text-center text-sm text-gray-500">
                共 {people.length} 位朋友
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default People;
