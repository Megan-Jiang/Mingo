/**
 * AI 服务层 - 使用 Supabase Edge Functions 代理 StepFun API
 *
 * 核心功能：
 * - 语音转写（使用 StepFun step-asr）
 * - 文本分析（使用 StepFun step-1-8k）
 *
 * 注意：API Key 已迁移到 Supabase Secrets，前端不再直接访问
 */

/**
 * 调用后端代理（Edge Function）
 * @param {string} functionName - Edge Function 名称
 * @param {Object} body - 请求体
 * @returns {Promise<any>} API 响应
 */
async function callAIFunction(functionName, body) {
  const response = await fetch(
    `https://igvwczzfigslojxatpeb.supabase.co/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Edge Function ${functionName} 错误:`, errorText);
    throw new Error(`AI 服务返回错误 ${response.status}: ${errorText}`);
  }

  return response.json();
}

/**
 * 调用 StepFun Chat API（通过 Edge Function）
 */
async function callStepFunChat(messages, temperature = 0.3) {
  const result = await callAIFunction('ai-chat', { messages, temperature });
  return result.choices?.[0]?.message?.content || '';
}

/**
 * 语音转写 - 使用 StepFun step-asr（通过 Edge Function）
 * @param {Blob} audioBlob - 音频文件
 * @returns {Promise<string>} 转写的文字
 */
export async function transcribeAudio(audioBlob) {
  try {
    const file = new File([audioBlob], 'recording.webm', { type: audioBlob.type || 'audio/webm' });

    console.log('发起语音转写请求...', {
      model: 'step-asr',
      fileSize: file.size
    });

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      'https://igvwczzfigslojxatpeb.supabase.co/functions/v1/ai-transcribe',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: formData
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 错误响应:', errorText);
      throw new Error(`API 返回错误 ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('转写结果:', result);

    return result.text;
  } catch (error) {
    console.error('语音转写失败:', error);
    throw new Error(`语音转写失败: ${error.message}`);
  }
}

/**
 * 从转写文本中提取人物
 * @param {string} text - 转写文本
 * @returns {Promise<string[]>} 提取的人物列表
 */
export async function extractPeople(text) {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const result = await callStepFunChat([
    {
      role: 'system',
      content: `你是一个社交记录助手，负责从文本中提取涉及的人物姓名。
请从以下转写内容中提取所有提及的人物姓名。
规则：
1. 只返回人物姓名，用逗号分隔
2. 不要返回称谓（如"朋友"、"同事"）
3. 不要提取"我"，这是记录者本人
4. 如果没有明确人物，返回空字符串
5. 只返回纯文本，如：张三,李四`
    },
    {
      role: 'user',
      content: text
    }
  ], 0.3);

  console.log('extractPeople AI 返回:', result);

  return result.split(/[,，]/).map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * 生成事件标签
 * @param {string} text - 转写文本
 * @param {string[]} allowedTags - 允许的标签列表（可选）
 * @returns {Promise<string[]>} 生成的标签列表
 */
export async function generateTags(text, allowedTags = []) {
  if (!text || text.trim().length === 0) {
    return ['未分类'];
  }

  let systemPrompt = `你是一个社交记录助手，负责为社交互动生成标签。
请为以下转写内容生成3-5个简洁的标签。
规则：
1. 标签要简洁（1-3个字）
2. 只返回标签，用中文逗号分隔
3. 不要返回纯数字或无意义的词
4. 只返回纯文本，不要JSON格式`;

  // 如果有预设标签，限制在范围内选择
  if (allowedTags.length > 0) {
    systemPrompt += `
5. **必须从以下预设标签中选择**：${allowedTags.join('、')}
6. 如果内容确实不匹配任何预设标签，只能返回"未分类"`;
  } else {
    systemPrompt += `
5. 分类包括但不限于：咖啡、饭局、运动、学习、工作、家庭、聚会、旅行、节日等`;
  }

  const result = await callStepFunChat([
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: text
    }
  ], 0.5);

  const tags = result.split(/[,，]/).map(s => s.trim()).filter(s => s.length > 0);

  // 过滤并返回匹配的标签
  if (allowedTags.length > 0) {
    const matchedTags = tags.filter(tag => allowedTags.includes(tag));
    return matchedTags.length > 0 ? matchedTags : ['未分类'];
  }

  return tags.length > 0 ? tags : ['未分类'];
}

/**
 * 生成事件摘要
 * @param {string} text - 转写文本
 * @returns {Promise<string>} 事件摘要
 */
export async function generateSummary(text) {
  if (!text || text.trim().length === 0) {
    return '';
  }

  return await callStepFunChat([
    {
      role: 'system',
      content: `你是一个社交记录助手，负责为社交互动生成简短摘要。
请用一句话概括以下转写内容（不超过50字）。
只返回摘要文本，不要其他内容。`
    },
    {
      role: 'user',
      content: text
    }
  ], 0.5);
}

/**
 * 整理转写内容 - 去除语气词、整理逻辑、提取人物和标签
 * @param {string} text - 原始转写文本
 * @param {string[]} existingPeople - 已识别的人物列表（可选）
 * @returns {Promise<Object>} 整理结果 { organizedText, people, tags }
 */
export async function organizeTranscript(text, existingPeople = []) {
  if (!text || text.trim().length === 0) {
    return { organizedText: '', people: [], tags: [] };
  }

  const content = await callStepFunChat([
    {
      role: 'system',
      content: `你是一个社交记录助手，负责整理社交互动的转写内容。

请对提供的转写内容进行整理：

1. **去除语气词**：移除嗯、啊、哦、这个、那个、就是、说吧、你说呢等口语词
2. **整理逻辑**：使内容连贯清晰，去除重复表达
3. **标注说话人**：如果能明确判断谁在说话，用"(姓名)："标注说话人
4. **提取人物**：从内容中提取所有涉及的人物（不要提取"我"，这是记录者本人）
5. **生成标签**：生成3-5个简洁的事件标签

请直接返回JSON格式结果：
{
  "organizedText": "整理后的描述（段落清晰，去除语气词）",
  "people": ["人物1", "人物2"],
  "tags": ["标签1", "标签2"]
}

只返回JSON，不要其他内容。`
    },
    {
      role: 'user',
      content: `原始转写：${text}`
    }
  ], 0.3);

  console.log('整理响应:', content);

  // 解析 JSON
  let result;
  try {
    result = JSON.parse(content);
    console.log('organizeTranscript JSON 解析成功:', result);
  } catch (parseError) {
    console.error('JSON解析失败，返回原文:', parseError);
    return { organizedText: text, people: existingPeople, tags: [] };
  }

  return {
    organizedText: result.organizedText || text,
    people: result.people || existingPeople,
    tags: result.tags || []
  };
}

/**
 * 完整的 AI 处理流程
 * @param {Blob} audioBlob - 音频文件
 * @returns {Promise<Object>} 处理结果 { transcript, organizedText, people, tags, summary }
 */
export async function processAudio(audioBlob) {
  const results = {
    transcript: '',
    organizedText: '',
    people: [],
    tags: ['未分类'],
    summary: ''
  };

  try {
    // 1. 语音转写
    console.log('开始语音转写...');
    results.transcript = await transcribeAudio(audioBlob);
    console.log('转写完成，字符数:', results.transcript.length);

    // 2. AI 整理转写内容
    console.log('开始整理转写内容...');
    const organized = await organizeTranscript(results.transcript);
    results.organizedText = organized.organizedText;
    console.log('整理完成，字符数:', results.organizedText.length);

    // 3. 基于整理后的文本提取人物和标签
    const textToAnalyze = results.organizedText || results.transcript;
    const [people, tags, summary] = await Promise.all([
      extractPeople(textToAnalyze),
      generateTags(textToAnalyze),
      generateSummary(textToAnalyze)
    ]);

    // 合并人物列表（去重）
    results.people = [...new Set([...organized.people, ...people])];
    // 使用整理后生成的标签，如果为空则用提取的
    results.tags = organized.tags.length > 0 ? organized.tags : tags;
    results.summary = summary;

    console.log('AI 处理完成:', {
      transcriptLength: results.transcript.length,
      organizedLength: results.organizedText.length,
      people: results.people,
      tags: results.tags
    });

    console.log('people 类型:', typeof results.people, Array.isArray(results.people));

    return results;
  } catch (error) {
    console.error('AI 处理失败:', error);
    throw error;
  }
}

/**
 * 生成祝福语
 * @param {string} friendName - 朋友姓名/备注
 * @param {string} holiday - 节日名称
 * @param {string} type - 节日类型（solar/lunar）
 * @param {string[]} tags - 朋友标签列表（可选）
 * @param {Array} recentRecords - 最近互动记录（可选）
 * @returns {Promise<string>} 生成的祝福语
 */
export async function generateBlessing(friendName, holiday, type = 'solar', tags = [], recentRecords = [], remark = '', identity = '') {
  const typeText = type === 'lunar' ? '农历' : '';

  // 计算称呼：优先使用备注，没有则用名字后两个字
  const displayName = remark || (friendName.length > 2 ? friendName.slice(-2) : friendName);

  // 构建上下文信息
  let contextInfo = '';
  if (remark) {
    contextInfo += `\n- 备注称呼：${remark}`;
  }
  if (identity) {
    contextInfo += `\n- 身份：${identity}`;
  }
  if (tags && tags.length > 0) {
    contextInfo += `\n- 标签：${tags.join('、')}`;
  }
  if (recentRecords && recentRecords.length > 0) {
    const recordsSummary = recentRecords.map(r => {
      const summary = r.summary || r.transcript || '';
      return `- ${summary.slice(0, 80)}${summary.length > 80 ? '...' : ''}`;
    }).join('\n');
    contextInfo += `\n- 互动记录：\n${recordsSummary}`;
  }

  return await callStepFunChat([
    {
      role: 'system',
      content: `你是一个温暖、细腻、有分寸感的祝福语生成助手，说话像真正关心对方的朋友。

请根据朋友的【备注称呼】、【身份】、【标签】和【互动经历】，生成一段贴合身份特点的节日祝福语。

核心要求：
1. 必须结合对方"身份"来写，祝福内容要与其日常职责或阶段相关
2. 必须融入至少一个具体互动细节或共同经历，让祝福有记忆点
3. 语气自然真诚，不浮夸、不模板化
4. 结合节日氛围，但避免堆砌传统套话
5. 可适度表达感谢、支持或共同成长
6. 控制在30-60字以内
7. 只输出祝福语正文，不要添加解释或前缀
8. 克制使用比喻等
9. 适合通过微信或短信发送
10. 优先使用备注称呼
11.避免使用"还记得"进行回忆，直接描述当时观察到某个细节的感受或者心情即可。

写作优先级：
身份匹配度 > 互动细节 > 情绪温度 > 节日氛围`
    },
    {
      role: 'user',
      content: `节日：${typeText}${holiday}

朋友信息（请结合以下信息生成祝福）：
${contextInfo}

请为 ${friendName} 生成一段贴合身份、融入互动细节的${typeText}${holiday}祝福语。`
    }
  ], 0.7);
}
