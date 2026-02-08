import { supabase } from '../lib/supabase';

/**
 * 标签服务
 *
 * 核心逻辑：
 * - 人物标签和事件标签管理
 * - 按用户隔离数据
 */

/**
 * 获取当前用户 ID
 */
async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

/**
 * 获取人物标签列表
 * @returns {Promise<Array>} 标签列表
 */
export async function getPersonTags() {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('person_tags')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取人物标签失败:', error);
    return [];
  }

  return data || [];
}

/**
 * 获取事件标签列表
 * @returns {Promise<Array>} 标签列表
 */
export async function getEventTags() {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('event_tags')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取事件标签失败:', error);
    return [];
  }

  return data || [];
}

/**
 * 获取事件标签名称列表（用于 AI 标签匹配）
 * @returns {Promise<string[]>} 标签名称数组
 */
export async function getEventTagNames() {
  const tags = await getEventTags();
  return tags.map(t => t.name);
}

/**
 * 根据名称批量获取人物标签
 * @param {string[]} names - 人物名称列表
 * @returns {Promise<Object>} 名称到标签的映射
 */
export async function getPersonTagsByNames(names) {
  if (!names || names.length === 0) return {};

  const { data, error } = await supabase
    .from('person_tags')
    .select('*')
    .in('name', names);

  if (error) {
    console.error('批量获取人物标签失败:', error);
    return {};
  }

  const map = {};
  data?.forEach(item => {
    map[item.name] = item;
  });
  return map;
}

/**
 * 创建人物标签
 * @param {string} name - 标签名称
 * @returns {Promise<Object>} 创建的标签
 */
export async function createPersonTag(name) {
  const userId = await getUserId();
  if (!userId) throw new Error('用户未登录');

  const { data, error } = await supabase
    .from('person_tags')
    .insert([{ user_id: userId, name }])
    .select()
    .single();

  if (error) {
    console.error('创建人物标签失败:', error);
    throw error;
  }

  return data;
}

/**
 * 创建事件标签
 * @param {string} name - 标签名称
 * @returns {Promise<Object>} 创建的标签
 */
export async function createEventTag(name) {
  const userId = await getUserId();
  if (!userId) throw new Error('用户未登录');

  const { data, error } = await supabase
    .from('event_tags')
    .insert([{ user_id: userId, name }])
    .select()
    .single();

  if (error) {
    console.error('创建事件标签失败:', error);
    throw error;
  }

  return data;
}

/**
 * 删除人物标签
 * @param {string} id - 标签ID
 */
export async function deletePersonTag(id) {
  const { error } = await supabase
    .from('person_tags')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('删除人物标签失败:', error);
    throw error;
  }
}

/**
 * 删除事件标签
 * @param {string} id - 标签ID
 */
export async function deleteEventTag(id) {
  const { error } = await supabase
    .from('event_tags')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('删除事件标签失败:', error);
    throw error;
  }
}
