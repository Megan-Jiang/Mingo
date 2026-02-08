import { supabase } from '../lib/supabase';

/**
 * 朋友数据服务
 *
 * 核心逻辑：
 * - 增删改查朋友信息
 * - 支持标签、生日、重要节日等字段
 */

/**
 * 获取当前用户的所有朋友
 * @returns {Promise<Array>} 朋友列表
 */
export async function getFriends() {
  const { data, error } = await supabase
    .from('friends')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取朋友列表失败:', error);
    throw error;
  }

  return data || [];
}

/**
 * 获取单个朋友详情
 * @param {string} id - 朋友ID
 * @returns {Promise<Object>} 朋友详情
 */
export async function getFriendById(id) {
  const { data, error } = await supabase
    .from('friends')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('获取朋友详情失败:', error);
    throw error;
  }

  return data;
}

/**
 * 创建新朋友
 * @param {Object} friend - 朋友信息
 * @returns {Promise<Object>} 创建的朋友
 */
export async function createFriend(friend) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('用户未登录');

  const { data, error } = await supabase
    .from('friends')
    .insert([{ ...friend, user_id: user.id }])
    .select()
    .single();

  if (error) {
    console.error('创建朋友失败:', error);
    throw error;
  }

  return data;
}

/**
 * 更新朋友信息，同时同步更新相关记录的 people 字段
 * @param {string} id - 朋友ID
 * @param {Object} updates - 更新的字段
 * @returns {Promise<Object>} 更新后的朋友
 */
export async function updateFriend(id, updates) {
  // 先获取原信息
  const { data: oldFriend, error: fetchError } = await supabase
    .from('friends')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('获取朋友原信息失败:', fetchError);
    throw fetchError;
  }

  // 更新朋友信息
  const { data, error } = await supabase
    .from('friends')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('更新朋友失败:', error);
    throw error;
  }

  // 如果姓名发生变化，同步更新 records 表中的 people 字段
  if (updates.name && updates.name !== oldFriend.name) {
    await syncFriendNameInRecords(id, oldFriend.name, updates.name);
  }

  return data;
}

/**
 * 同步更新 records 表中该朋友的姓名
 */
async function syncFriendNameInRecords(friendId, oldName, newName) {
  // 获取所有相关记录
  const { data: records, error: fetchError } = await supabase
    .from('records')
    .select('*')
    .eq('friend_id', friendId);

  if (fetchError) {
    console.error('获取相关记录失败:', fetchError);
    return;
  }

  // 更新每条记录中的 people 数组
  for (const record of records) {
    const people = record.people || [];
    const updatedPeople = people.map(p => p === oldName ? newName : p);

    if (JSON.stringify(people) !== JSON.stringify(updatedPeople)) {
      await supabase
        .from('records')
        .update({ people: updatedPeople })
        .eq('id', record.id);
    }
  }
}

/**
 * 更新朋友的最后互动时间
 * @param {string} friendId - 朋友ID
 * @param {string} recordId - 记录ID
 */
export async function updateFriendLastInteraction(friendId, recordId) {
  const { data: record, error: recordError } = await supabase
    .from('records')
    .select('created_at')
    .eq('id', recordId)
    .single();

  if (recordError || !record) {
    console.error('获取记录失败:', recordError);
    return;
  }

  const { error } = await supabase
    .from('friends')
    .update({ updated_at: record.created_at })
    .eq('id', friendId);

  if (error) {
    console.error('更新朋友最后互动时间失败:', error);
    throw error;
  }
}

/**
 * 删除朋友
 * @param {string} id - 朋友ID
 */
export async function deleteFriend(id) {
  const { error } = await supabase
    .from('friends')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('删除朋友失败:', error);
    throw error;
  }
}

/**
 * 搜索朋友（按姓名或备注）
 * @param {string} keyword - 搜索关键词
 * @returns {Promise<Array>} 匹配的朋友列表
 */
export async function searchFriends(keyword) {
  const { data, error } = await supabase
    .from('friends')
    .select('*')
    .or(`name.ilike.%${keyword}%,remark.ilike.%${keyword}%`);

  if (error) {
    console.error('搜索朋友失败:', error);
    throw error;
  }

  return data || [];
}

/**
 * 批量获取朋友（根据名称列表）
 * @param {string[]} names - 朋友名称列表
 * @returns {Promise<Object>} 名称到朋友记录的映射
 */
export async function getFriendsByNames(names) {
  if (!names || names.length === 0) return {};

  const { data, error } = await supabase
    .from('friends')
    .select('*')
    .in('name', names);

  if (error) {
    console.error('批量获取朋友失败:', error);
    return {};
  }

  // 构建名称到记录的映射
  const map = {};
  data?.forEach(friend => {
    map[friend.name] = friend;
  });
  return map;
}
