import { supabase } from '../lib/supabase';

/**
 * 认证服务
 *
 * 核心逻辑：
 * - 用户注册/登录/登出
 * - 获取当前用户状态
 * - JWT Token 管理（由 Supabase 自动处理）
 */

/**
 * 获取当前用户会话
 * @returns {Promise<Object|null>} 用户信息或 null
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * 获取当前会话信息
 * @returns {Promise<Object|null>} 会话信息
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * 监听认证状态变化
 * @param {Function} callback - 回调函数 (event, session)
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * 邮箱注册
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @returns {Promise<Object>} 注册结果
 */
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    console.error('注册失败:', error);
    throw error;
  }

  return data;
}

/**
 * 邮箱登录
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @returns {Promise<Object>} 登录结果
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('登录失败:', error);
    throw error;
  }

  return data;
}

/**
 * 手机号登录（短信验证码）
 * @param {string} phone - 手机号（格式：+86138...）
 * @returns {Promise<Object>} 发送验证码结果
 */
export async function signInWithPhone(phone) {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone
  });

  if (error) {
    console.error('发送验证码失败:', error);
    throw error;
  }

  return data;
}

/**
 * 验证手机验证码
 * @param {string} phone - 手机号
 * @param {string} token - 验证码
 * @returns {Promise<Object>} 登录结果
 */
export async function verifyPhoneOtp(phone, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms'
  });

  if (error) {
    console.error('验证码验证失败:', error);
    throw error;
  }

  return data;
}

/**
 * 登出
 * @returns {Promise<void>}
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('登出失败:', error);
    throw error;
  }
}

/**
 * 重置密码（发送重置邮件）
 * @param {string} email - 邮箱
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    console.error('发送重置邮件失败:', error);
    throw error;
  }
}

/**
 * 更新密码（已登录状态下）
 * @param {string} newPassword - 新密码
 * @returns {Promise<void>}
 */
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    console.error('更新密码失败:', error);
    throw error;
  }
}
