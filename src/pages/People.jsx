import { useState, useEffect } from "react";
import { Search, MessageCircle, Clock, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { StarDeco, HeartDeco } from "../components/DecoElements";
import { EmptyState } from "../components/EmptyState";
import PersonCard from "../components/PersonCard";
import PersonDetail from "../components/PersonDetail";
import { getFriends } from "../services/friends";

const People = () => {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // 从 Supabase 加载朋友数据
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);
        const data = await getFriends();
        // 字段映射：remark → alias, important_days → festivals
        const mappedData = data.map((friend) => ({
          ...friend,
          alias: friend.remark,
          festivals: friend.important_days || [],
          lastInteraction:
            friend.created_at?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
        }));
        setPeople(mappedData);
        setError(null);
      } catch (err) {
        console.error("加载朋友列表失败:", err);
        setError("加载失败，请检查网络连接");
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [refreshKey]);

  // 过滤搜索结果
  const filteredPeople = people.filter(
    (person) =>
      person.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.alias
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (person.tags || []).some((tag) =>
        tag?.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  if (selectedPerson) {
    return (
      <PersonDetail
        person={selectedPerson}
        onBack={() => {
          setSelectedPerson(null);
          setRefreshKey(prev => prev + 1);
        }}
        onUpdate={() => {
          setRefreshKey(prev => prev + 1);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-warm-cream px-5 pt-8 pb-24 relative overflow-hidden">
      {/* 装饰元素 */}
      <StarDeco className="absolute top-20 right-8 opacity-60" />
      <HeartDeco className="absolute bottom-32 left-6 opacity-60" />

      {/* 顶部标题 */}
      <div className="text-center mb-6">
        <h1 className="text-2xl text-warm-purple mb-2 tracking-wide">
          朋友
        </h1>
        <p className="text-sm text-gray-500 tracking-wide">
          {people.length} 位朋友
        </p>
      </div>

      {/* 搜索框 */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="搜索朋友…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white rounded-[20px] pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-warm-purple/30 transition-all shadow-md shadow-warm-purple/8 tracking-wide"
        />
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-warm-purple border-t-transparent rounded-full mx-auto mb-4"></div>
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
              <motion.div
                key={person.id}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedPerson(person)}
              >
                <div className="bg-white rounded-3xl p-5 shadow-md shadow-warm-purple/8 hover:shadow-lg hover:shadow-warm-purple/15 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    {/* 头像 */}
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-3 border-warm-yellow bg-warm-cream flex items-center justify-center overflow-hidden">
                        {person.avatar_url ? (
                          <img
                            src={person.avatar_url}
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl text-warm-purple font-medium">
                            {person.name?.charAt(0) || "?"}
                          </span>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-warm-purple rounded-full flex items-center justify-center border-2 border-white">
                        <MessageCircle className="w-3 h-3 text-white" />
                      </div>
                    </div>

                    {/* 信息 */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg text-warm-purple font-medium tracking-wide">
                          {person.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{person.lastInteraction}</span>
                        </div>
                      </div>

                      {person.alias && (
                        <p className="text-sm text-gray-500 mb-2 tracking-wide">
                          {person.alias}
                        </p>
                      )}

                      {/* 标签 */}
                      {(person.tags || []).length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {(person.tags || [])
                            .slice(0, 3)
                            .map((tag, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-gradient-to-r from-warm-pink/30 to-warm-yellow/30 text-warm-purple rounded-full text-xs tracking-wide"
                              >
                                {tag}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 空状态 */}
          {filteredPeople.length === 0 && (
            <EmptyState
              emoji="👥"
              message={
                searchTerm ? "没有找到相关朋友～" : "还没有添加朋友呢～"
              }
              submessage={
                searchTerm ? "试试其他关键词" : "开始添加你的第一位朋友吧"
              }
            />
          )}
        </>
      )}

      {/* 添加朋友按钮 */}
      {!loading && !error && (
        <motion.button
          className="fixed bottom-24 right-5 w-14 h-14 bg-warm-purple rounded-full shadow-lg shadow-warm-purple/30 flex items-center justify-center"
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
        >
          <UserPlus className="w-6 h-6 text-white" />
        </motion.button>
      )}
    </div>
  );
};

export default People;
