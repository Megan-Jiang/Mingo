import { createClient } from '@supabase/supabase-js';

/**
 * Supabase 客户端初始化
 *
 * 核心逻辑：
 * 1. 从环境变量读取 URL 和 Anon Key
 * 2. 创建全局唯一的 Supabase 客户端实例
 * 3. 供整个应用使用
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 环境变量未配置，请检查 .env 文件');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
