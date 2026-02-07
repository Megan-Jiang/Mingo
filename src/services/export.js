import { supabase } from '../lib/supabase';

/**
 * 数据导出服务
 *
 * 核心逻辑：
 * - 从 Supabase 获取所有用户数据
 * - 导出为 JSON 格式
 * - 触发浏览器下载文件
 */

/**
 * 获取所有数据
 * @returns {Promise<Object>} 包含 friends, records, blessings 的对象
 */
export async function getAllData() {
  try {
    // 并行获取所有数据
    const [friends, records, blessings] = await Promise.all([
      supabase.from('friends').select('*'),
      supabase.from('records').select('*'),
      supabase.from('blessings').select('*')
    ]);

    return {
      friends: friends.data || [],
      records: records.data || [],
      blessings: blessings.data || []
    };
  } catch (err) {
    console.error('获取数据失败:', err);
    throw err;
  }
}

/**
 * 导出数据为 JSON 文件并下载
 * @param {Object} data - 要导出的数据（可选，默认获取所有数据）
 * @param {string} filename - 文件名（可选，默认带时间戳）
 */
export async function exportDataToJson(data = null, filename = null) {
  try {
    // 如果没有传入数据，则从接口获取
    const exportData = data || await getAllData();

    // 添加导出元信息
    const finalData = {
      exportTime: new Date().toISOString(),
      version: '1.0',
      ...exportData
    };

    // 转换为 JSON 字符串
    const jsonString = JSON.stringify(finalData, null, 2);

    // 生成文件名
    const fileName = filename || `mingo_export_${new Date().toISOString().split('T')[0]}.json`;

    // 创建 Blob 并下载
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // 创建下载链接
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    // 清理
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (err) {
    console.error('导出数据失败:', err);
    throw err;
  }
}

/**
 * 导出为 CSV 格式（仅记录）
 * @param {Array} records - 记录数组
 * @param {string} filename - 文件名
 */
export async function exportRecordsToCsv(records = null, filename = 'mingo_records.csv') {
  try {
    const data = records || (await supabase.from('records').select('*')).data || [];

    // CSV 表头
    const headers = ['日期', '摘要', '涉及人物', '标签', '转写内容'];

    // 构建 CSV 内容
    const csvRows = [headers.join(',')];

    for (const record of data) {
      const row = [
        record.created_at ? new Date(record.created_at).toLocaleDateString() : '',
        record.summary || '',
        (record.people || []).join('; '),
        (record.tags || []).join('; '),
        record.transcript || ''
      ];

      // 处理特殊字符（引号、逗号）
      const escapedRow = row.map(cell => {
        const escaped = String(cell).replace(/"/g, '""');
        return `"${escaped}"`;
      });

      csvRows.push(escapedRow.join(','));
    }

    const csvString = csvRows.join('\n');

    // 下载文件
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (err) {
    console.error('导出 CSV 失败:', err);
    throw err;
  }
}
