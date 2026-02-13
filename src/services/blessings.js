import { supabase } from '../lib/supabase';
import { getCurrentUser } from './auth';

/**
 * 祝福数据服务
 *
 * 核心逻辑：
 * - 管理节日祝福任务
 * - 跟踪祝福状态（待发送/已完成）
 * - 存储生成的祝福语
 * - 用户数据隔离
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
 * 获取当前用户的所有祝福任务
 * @param {Object} options - 筛选选项
 * @returns {Promise<Array>} 祝福任务列表
 */
export async function getBlessings(options = {}) {
  const userId = await getUserId();
  if (!userId) return [];

  let query = supabase
    .from('blessings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  // 筛选未完成的
  if (options.pendingOnly) {
    query = query.eq('status', 'pending');
  }

  // 筛选指定朋友
  if (options.friendId) {
    query = query.eq('friend_id', friendId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('获取祝福列表失败:', error);
    throw error;
  }

  return data || [];
}

/**
 * 创建新的祝福任务
 * @param {Object} blessing - 祝福信息
 * @returns {Promise<Object>} 创建的祝福任务
 */
export async function createBlessing(blessing) {
  const userId = await getUserId();
  if (!userId) throw new Error('用户未登录');

  const { data, error } = await supabase
    .from('blessings')
    .insert([{ ...blessing, user_id: userId }])
    .select()
    .single();

  if (error) {
    console.error('创建祝福任务失败:', error);
    throw error;
  }

  return data;
}

/**
 * 更新祝福任务
 * @param {string} id - 祝福任务ID
 * @param {Object} updates - 更新的字段
 * @returns {Promise<Object>} 更新后的祝福任务
 */
export async function updateBlessing(id, updates) {
  const userId = await getUserId();
  if (!userId) throw new Error('用户未登录');

  // 验证祝福任务属于当前用户
  const { data: existing, error: fetchError } = await supabase
    .from('blessings')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existing) {
    throw new Error('祝福任务不存在或无权限修改');
  }

  const { data, error } = await supabase
    .from('blessings')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('更新祝福任务失败:', error);
    throw error;
  }

  return data;
}

/**
 * 标记祝福任务为完成
 * @param {string} id - 祝福任务ID
 * @returns {Promise<Object>} 更新后的祝福任务
 */
export async function completeBlessing(id) {
  return updateBlessing(id, {
    status: 'completed',
    completed_at: new Date().toISOString()
  });
}

/**
 * 删除祝福任务
 * @param {string} id - 祝福任务ID
 */
export async function deleteBlessing(id) {
  const userId = await getUserId();
  if (!userId) throw new Error('用户未登录');

  const { error } = await supabase
    .from('blessings')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('删除祝福任务失败:', error);
    throw error;
  }
}

/**
 * 获取即将到来的节日祝福任务
 * @param {number} days - 未来天数
 * @returns {Promise<Array>} 祝福任务列表
 */
export async function getUpcomingBlessings(days = 30) {
  const userId = await getUserId();
  if (!userId) return [];

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const { data, error } = await supabase
    .from('blessings')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lte('holiday_date', futureDate.toISOString())
    .order('holiday_date', { ascending: true });

  if (error) {
    console.error('获取即将到来的祝福失败:', error);
    throw error;
  }

  return data || [];
}
