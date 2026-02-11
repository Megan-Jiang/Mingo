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
 * 同时更新 friend_id 关联的记录和 people 字段包含该名字的记录
 */
async function syncFriendNameInRecords(friendId, oldName, newName) {
  // 1. 更新 friend_id 关联的记录
  const { data: friendRecords, error: fetchError1 } = await supabase
    .from('records')
    .select('*')
    .eq('friend_id', friendId);

  if (fetchError1) {
    console.error('获取朋友关联记录失败:', fetchError1);
  } else {
    for (const record of friendRecords) {
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

  // 2. 更新 people 字段中包含旧名字的所有记录（即使 friend_id 不同）
  const { data: allRecords, error: fetchError2 } = await supabase
    .from('records')
    .select('*')
    .contains('people', [oldName]);

  if (fetchError2) {
    console.error('获取包含该名字的记录失败:', fetchError2);
    return;
  }

  for (const record of allRecords) {
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
  const { error } = await supabase
    .from('friends')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', friendId);

  if (error) {
    console.error('更新朋友最后互动时间失败:', error);
  }
}

/**
 * 删除朋友
 * @param {string} id - 朋友ID
 * @param {string} name - 朋友姓名（用于更新记录）
 */
export async function deleteFriend(id, name) {
  try {
    // 先将相关记录的 friend_id 设为 null，变成未归档
    const { data: records, error: fetchError } = await supabase
      .from('records')
      .select('id, people')
      .eq('friend_id', id);

    if (fetchError) {
      console.error('获取相关记录失败:', fetchError);
    } else {
      for (const record of records || []) {
        const people = record.people || [];
        // 如果 people 中包含该朋友名字，保留（变成未归档状态）
        // 如果没有，则添加进去以便后续识别
        const updatedPeople = people.includes(name)
          ? people
          : [...people, name];

        await supabase
          .from('records')
          .update({ friend_id: null, unarchived_people: updatedPeople })
          .eq('id', record.id);
      }
    }
  } catch (err) {
    console.error('更新记录失败:', err);
  }

  // 删除朋友
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

/**
 * 获取所有朋友的祝福列表（重要节日）
 * @returns {Promise<Array>} 按从近到远排序的祝福列表
 */
export async function getBlessings() {
  const { data, error } = await supabase
    .from('friends')
    .select('id, name, remark, important_dates, blessings_completed')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取祝福列表失败:', error);
    throw error;
  }

  const currentMonth = new Date().getMonth() + 1;
  const currentDay = new Date().getDate();

  const blessings = [];

  for (const friend of data || []) {
    const dates = friend.important_dates || [];
    const completedStatus = friend.blessings_completed || {};

    for (const item of dates) {
      // 获取节日日期
      let month, day;

      // 优先使用 monthDay 字段（标准格式 MM-DD）
      if (item.monthDay) {
        const parts = item.monthDay.split('-').map(Number);
        month = parts[0];
        day = parts[1];
      } else if (item.date) {
        // date 字段可能是 MM-DD 或 YYYY-MM-DD
        const parts = item.date.split('-').map(Number);
        if (parts.length === 3) {
          // YYYY-MM-DD 格式，取后两位
          month = parts[1];
          day = parts[2];
        } else {
          month = parts[0];
          day = parts[1];
        }
      } else {
        continue;
      }

      if (!month || !day) continue;

      // 判断是否已过
      let isPast = false;
      if (item.type === 'lunar') {
        isPast = true; // 农历节日暂不处理排序，排在最后
      } else {
        if (month < currentMonth || (month === currentMonth && day < currentDay)) {
          isPast = true;
        }
      }

      // 祝福完成状态的 key
      const blessingKey = `${friend.id}-${item.name}`;

      blessings.push({
        id: `${friend.id}-${item.name}`,
        friend_id: friend.id,
        name: friend.remark || friend.name,
        holiday: item.name,
        date: `${month}月${day}日`,
        month,
        day,
        type: item.type,
        isPast,
        completed: completedStatus[blessingKey] || false
      });
    }
  }

  // 先按是否已过排序（未过的在前），再按月日排序
  blessings.sort((a, b) => {
    if (a.isPast !== b.isPast) {
      return a.isPast ? 1 : -1;
    }
    if (a.month !== b.month) return a.month - b.month;
    return a.day - b.day;
  });

  return blessings;
}

/**
 * 切换祝福完成状态
 * @param {string} friendId - 朋友ID
 * @param {string} holidayName - 节日名称
 * @param {boolean} completed - 完成状态
 */
export async function toggleBlessingCompleted(friendId, holidayName, completed) {
  // 先获取当前状态
  const { data: friend, error: fetchError } = await supabase
    .from('friends')
    .select('blessings_completed')
    .eq('id', friendId)
    .single();

  if (fetchError) {
    console.error('获取朋友祝福状态失败:', fetchError);
    throw fetchError;
  }

  const completedStatus = friend.blessings_completed || {};
  const blessingKey = `${friendId}-${holidayName}`;

  // 更新状态
  completedStatus[blessingKey] = completed;

  const { error } = await supabase
    .from('friends')
    .update({ blessings_completed: completedStatus })
    .eq('id', friendId);

  if (error) {
    console.error('更新祝福状态失败:', error);
    throw error;
  }
}

/**
 * 获取朋友的详细信息（包含标签和最近互动记录）
 * @param {string} friendId - 朋友ID
 * @returns {Promise<Object>} 朋友详细信息
 */
export async function getFriendWithDetails(friendId) {
  // 获取朋友基本信息
  const { data: friend, error } = await supabase
    .from('friends')
    .select('*')
    .eq('id', friendId)
    .single();

  if (error) {
    console.error('获取朋友详情失败:', error);
    throw error;
  }

  // 获取最近的互动记录（最近3条）
  const { data: records, error: recordsError } = await supabase
    .from('records')
    .select('transcript, summary, tags, created_at')
    .eq('friend_id', friendId)
    .order('created_at', { ascending: false })
    .limit(3);

  if (recordsError) {
    console.error('获取互动记录失败:', recordsError);
  }

  return {
    ...friend,
    recentRecords: records || []
  };
}
