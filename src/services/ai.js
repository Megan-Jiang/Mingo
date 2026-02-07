import OpenAI from 'openai';

/**
 * AI 服务层
 *
 * 核心功能：
 * - 语音转写（使用 Whisper）
 * - 人物提取（使用 StepFun）
 * - 标签生成（使用 StepFun）
 */

// 从环境变量获取配置
const whisperApiKey = import.meta.env.VITE_WHISPER_API_KEY;
const whisperBaseUrl = import.meta.env.VITE_WHISPER_BASE_URL;
const aiApiKey = import.meta.env.VITE_AI_API_KEY;
const aiBaseUrl = import.meta.env.VITE_AI_BASE_URL || 'https://api.stepfun.com/v1';
const aiModel = import.meta.env.VITE_AI_MODEL || 'step-1-8k';
const whisperModel = import.meta.env.VITE_WHISPER_MODEL || 'whisper-1';

// 初始化 OpenAI 客户端（用于 Whisper 语音转写）- 仅当有 API Key 时
const whisperClient = whisperApiKey ? new OpenAI({
  apiKey: whisperApiKey,
  baseUrl: whisperBaseUrl,
  dangerouslyAllowBrowser: true
}) : null;

// 初始化 StepFun 客户端（用于文本分析）- 仅当有 API Key 时
const aiClient = aiApiKey ? new OpenAI({
  apiKey: aiApiKey,
  baseUrl: aiBaseUrl,
  dangerouslyAllowBrowser: true
}) : null;

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
 * 语音转写 - 使用 Whisper 将音频转为文字
 * @param {Blob} audioBlob - 音频文件
 * @returns {Promise<string>} 转写的文字
 */
export async function transcribeAudio(audioBlob) {
  if (!whisperClient) {
    throwNotConfigured('WHISPER');
  }

  try {
    const file = new File([audioBlob], 'recording.webm', { type: audioBlob.type || 'audio/webm' });

    const response = await whisperClient.audio.transcriptions.create({
      model: whisperModel,
      file: file,
      language: 'zh'
    });

    return response.text;
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

  if (!aiClient) {
    throwNotConfigured('AI');
  }

  try {
    const completion = await aiClient.chat.completions.create({
      model: aiModel,
      messages: [
        {
          role: 'system',
          content: `你是一个社交记录助手，负责从文本中提取涉及的人物名称。
请从以下转写内容中提取所有提及的人物姓名。
规则：
1. 只返回人物姓名，用中文逗号分隔
2. 不要返回称谓（如"朋友"、"同事"）
3. 如果没有明确人物，返回空字符串
4. 只返回纯文本，不要JSON格式`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3
    });

    const result = completion.choices[0]?.message?.content || '';
    // 解析结果，过滤空字符串
    return result.split(/[,，]/).map(s => s.trim()).filter(s => s.length > 0);
  } catch (error) {
    console.error('人物提取失败:', error);
    return [];
  }
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

  if (!aiClient) {
    throwNotConfigured('AI');
  }

  try {
    const completion = await aiClient.chat.completions.create({
      model: aiModel,
      messages: [
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
      ],
      temperature: 0.5
    });

    const result = completion.choices[0]?.message?.content || '';
    // 解析结果
    const tags = result.split(/[,，]/).map(s => s.trim()).filter(s => s.length > 0);
    return tags.length > 0 ? tags : ['未分类'];
  } catch (error) {
    console.error('标签生成失败:', error);
    return ['未分类'];
  }
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

  if (!aiClient) {
    throwNotConfigured('AI');
  }

  try {
    const completion = await aiClient.chat.completions.create({
      model: aiModel,
      messages: [
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
      ],
      temperature: 0.5
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('摘要生成失败:', error);
    return '';
  }
}

/**
 * 完整的 AI 处理流程
 * @param {Blob} audioBlob - 音频文件
 * @returns {Promise<Object>} 处理结果 { transcript, people, tags, summary }
 */
export async function processAudio(audioBlob) {
  const results = {
    transcript: '',
    people: [],
    tags: ['未分类'],
    summary: ''
  };

  try {
    // 1. 语音转写
    results.transcript = await transcribeAudio(audioBlob);

    // 并行执行人物提取和标签生成
    const [people, tags, summary] = await Promise.all([
      extractPeople(results.transcript),
      generateTags(results.transcript),
      generateSummary(results.transcript)
    ]);

    results.people = people;
    results.tags = tags;
    results.summary = summary;

    return results;
  } catch (error) {
    console.error('AI 处理失败:', error);
    throw error;
  }
}
