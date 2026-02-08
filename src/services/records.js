import { supabase } from '../lib/supabase';
import { getCurrentUser } from './auth';

/**
 * 记录数据服务
 *
 * 核心逻辑：
 * - 增删改查社交记录
 * - 自动关联当前用户的 user_id
 * - 支持录音文件、文本、摘要、人物标签等
 * - 支持按时间、人物筛选
 */

/**
 * 获取当前用户的 ID
 * @returns {Promise<string|null>} 用户 ID
 */
async function getUserId() {
  const user = await getCurrentUser();
  return user?.id || null;
}

/**
 * 获取当前用户的所有记录
 * @param {Object} options - 筛选选项
 * @returns {Promise<Array>} 记录列表
 */
export async function getRecords(options = {}) {
  let query = supabase
    .from('records')
    .select('*')
    .order('created_at', { ascending: false });

  // 可选筛选条件
  if (options.friendId) {
    query = query.eq('friend_id', options.friendId);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('获取记录列表失败:', error);
    throw error;
  }

  return data || [];
}

/**
 * 获取单个记录详情
 * @param {string} id - 记录ID
 * @returns {Promise<Object>} 记录详情
 */
export async function getRecordById(id) {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('获取记录详情失败:', error);
    throw error;
  }

  return data;
}

/**
 * 创建新记录
 * @param {Object} record - 记录信息（不含 user_id，会自动添加）
 * @returns {Promise<Object>} 创建的记录
 */
export async function createRecord(record) {
  const userId = await getUserId();

  if (!userId) {
    throw new Error('用户未登录');
  }

  const { data, error } = await supabase
    .from('records')
    .insert([{ ...record, user_id: userId }])
    .select()
    .single();

  if (error) {
    console.error('创建记录失败:', error);
    throw error;
  }

  return data;
}

/**
 * 更新记录信息
 * @param {string} id - 记录ID
 * @param {Object} updates - 更新的字段
 * @returns {Promise<Object>} 更新后的记录
 */
export async function updateRecord(id, updates) {
  const { data, error } = await supabase
    .from('records')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('更新记录失败:', error);
    throw error;
  }

  return data;
}

/**
 * 删除记录
 * @param {string} id - 记录ID
 */
export async function deleteRecord(id) {
  const { error } = await supabase
    .from('records')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('删除记录失败:', error);
    throw error;
  }
}

/**
 * 上传录音文件（可选，如果需要保留录音回听）
 * @param {Blob} audioBlob - 录音文件 Blob
 * @param {string} recordId - 关联的记录ID
 * @returns {Promise<string>} 文件URL
 *
 * 注意：默认不保存录音以节省存储空间
 * 如需启用，在 Supabase 后台创建 'recordings' 存储桶并设为公开
 */
export async function uploadRecording(audioBlob, recordId) {
  const fileName = `${recordId}_${Date.now()}.webm`;

  const { data, error } = await supabase.storage
    .from('recordings')
    .upload(fileName, audioBlob);

  if (error) {
    console.error('上传录音失败:', error);
    throw error;
  }

  // 获取公开URL
  const { data: { publicUrl } } = supabase.storage
    .from('recordings')
    .getPublicUrl(data.path);

  return publicUrl;
}

/**
 * 获取指定时间范围内的记录
 * @param {Date} startDate - 开始日期
 * @param {Date} endDate - 结束日期
 * @returns {Promise<Array>} 记录列表
 */
export async function getRecordsByDateRange(startDate, endDate) {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取日期范围记录失败:', error);
    throw error;
  }

  return data || [];
}

/**
 * 更新记录的未归档人物
 * @param {string} id - 记录ID
 * @param {string[]} unarchivedPeople - 剩余未归档人物列表
 */
export async function updateUnarchivedPeople(id, unarchivedPeople) {
  const { data, error } = await supabase
    .from('records')
    .update({ unarchived_people: unarchivedPeople })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('更新未归档人物失败:', error);
    throw error;
  }

  return data;
}

/**
 * 更新记录的 friend_id，同时清除未归档人物列表
 * @param {string} id - 记录ID
 * @param {string} friendId - 朋友ID
 */
export async function updateRecordFriendId(id, friendId) {
  const { data, error } = await supabase
    .from('records')
    .update({ friend_id: friendId, unarchived_people: [] })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('更新记录朋友ID失败:', error);
    throw error;
  }

  return data;
}

/**
 * 获取涉及指定人物的所有记录
 * @param {string} personName - 人物名称
 * @returns {Promise<Array>} 记录列表
 */
export async function getRecordsByPerson(personName) {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .contains('people', [personName])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取人物相关记录失败:', error);
    throw error;
  }

  return data || [];
}
