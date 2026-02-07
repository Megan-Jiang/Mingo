/**
 * AI 服务层 - 使用 StepFun API
 *
 * 核心功能：
 * - 语音转写（使用 StepFun step-asr）
 * - 文本分析（使用 StepFun step-1-8k）
 */

// 从环境变量获取配置
const whisperApiKey = import.meta.env.VITE_WHISPER_API_KEY;
const whisperBaseUrl = import.meta.env.VITE_WHISPER_BASE_URL || 'https://api.stepfun.com/v1';
const aiApiKey = import.meta.env.VITE_AI_API_KEY;
const aiBaseUrl = import.meta.env.VITE_AI_BASE_URL || 'https://api.stepfun.com/v1';
const aiModel = import.meta.env.VITE_AI_MODEL || 'step-1-8k';
const whisperModel = import.meta.env.VITE_WHISPER_MODEL || 'step-asr';

/**
 * 检查 AI 服务是否已配置
 * @returns {Object} 配置状态
 */
export function getAIStatus() {
  return {
    whisperConfigured: !!whisperApiKey,
    stepFunConfigured: !!aiApiKey,
    configured: !!(whisperApiKey && aiApiKey)
  };
}

/**
 * 抛出配置错误
 */
function throwNotConfigured(service) {
  throw new Error(`${service} 未配置，请先在 .env 文件中设置 VITE_${service}_API_KEY`);
}

/**
 * 调用 StepFun Chat API
 */
async function callStepFunChat(messages, temperature = 0.3) {
  if (!aiApiKey) {
    throwNotConfigured('AI');
  }

  const response = await fetch(`${aiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aiApiKey}`
    },
    body: JSON.stringify({
      model: aiModel,
      messages: messages,
      temperature: temperature
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('StepFun API 错误:', errorText);
    throw new Error(`API 返回错误 ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  return result.choices[0]?.message?.content || '';
}

/**
 * 语音转写 - 使用 StepFun step-asr
 * @param {Blob} audioBlob - 音频文件
 * @returns {Promise<string>} 转写的文字
 */
export async function transcribeAudio(audioBlob) {
  if (!whisperApiKey) {
    throwNotConfigured('WHISPER');
  }

  try {
    const file = new File([audioBlob], 'recording.webm', { type: audioBlob.type || 'audio/webm' });

    // 构建 FormData
    const formData = new FormData();
    formData.append('model', whisperModel);
    formData.append('response_format', 'json');
    formData.append('file', file);

    console.log('发起语音转写请求...', {
      url: `${whisperBaseUrl}/audio/transcriptions`,
      model: whisperModel,
      fileSize: file.size
    });

    const response = await fetch(`${whisperBaseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whisperApiKey}`
      },
      body: formData
    });

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
1. 只返回人物姓名，用中文逗号分隔
2. 不要返回称谓（如"朋友"、"同事"）
3. 不要提取"我"，这是记录者本人
4. 如果没有明确人物，返回空字符串
5. 只返回纯文本，不要JSON格式`
    },
    {
      role: 'user',
      content: text
    }
  ], 0.3);

  return result.split(/[,，]/).map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * 生成事件标签
 * @param {string} text - 转写文本
 * @returns {Promise<string[]>} 生成的标签列表
 */
export async function generateTags(text) {
  if (!text || text.trim().length === 0) {
    return ['未分类'];
  }

  const result = await callStepFunChat([
    {
      role: 'system',
      content: `你是一个社交记录助手，负责为社交互动生成标签。
请为以下转写内容生成3-5个简洁的标签。
规则：
1. 标签要简洁（1-3个字）
2. 分类包括但不限于：咖啡、饭局、运动、学习、工作、家庭、聚会、旅行、节日等
3. 只返回标签，用中文逗号分隔
4. 不要返回纯数字或无意义的词
5. 只返回纯文本，不要JSON格式`
    },
    {
      role: 'user',
      content: text
    }
  ], 0.5);

  const tags = result.split(/[,，]/).map(s => s.trim()).filter(s => s.length > 0);
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

    return results;
  } catch (error) {
    console.error('AI 处理失败:', error);
    throw error;
  }
}
