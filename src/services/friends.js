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
  const { data, error } = await supabase
    .from('friends')
    .insert([friend])
    .select()
    .single();

  if (error) {
    console.error('创建朋友失败:', error);
    throw error;
  }

  return data;
}

/**
 * 更新朋友信息
 * @param {string} id - 朋友ID
 * @param {Object} updates - 更新的字段
 * @returns {Promise<Object>} 更新后的朋友
 */
export async function updateFriend(id, updates) {
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

  return data;
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
