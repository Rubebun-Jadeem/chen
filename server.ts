import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '4mb' }));

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatApiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('GEMINI_API_KEY is not configured')) {
    return {
      status: 500,
      message: '未检测到 GEMINI_API_KEY，请在 Settings > Secrets 面板配置您的 API Key。',
    };
  }
  if (raw.includes('403') || raw.includes('PERMISSION_DENIED')) {
    return {
      status: 403,
      message: 'Gemini API 权限被拒绝，请检查 Settings > Secrets 中的 API Key 是否有效。',
    };
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: '当前请求配额已达上限，请稍后再试或检查 API Key 配额。',
    };
  }
  return {
    status: 500,
    message: raw || 'AI 服务暂时不可用，请稍后重试。',
  };
}

interface ChatMessageInput {
  role: 'user' | 'assistant';
  content: string;
}

interface DocContextInput {
  id: string;
  title: string;
  libraryName: string;
  excerpt: string;
}

app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const {
      messages = [],
      scopeLabel = '全部可访问文件 · 11 个知识库',
      documents = [],
      webSearch = false,
      mode = 'general',
      attachedFiles = [],
    } = req.body as {
      messages: ChatMessageInput[];
      scopeLabel?: string;
      documents?: DocContextInput[];
      webSearch?: boolean;
      mode?: string;
      attachedFiles?: { name: string; content: string }[];
    };

    const ai = getAiClient();

    const docsBlock = documents
      .map(
        (d, idx) =>
          `[文档 ${idx + 1}] 标题: 《${d.title}》 | 所属知识库: ${d.libraryName}\n正文摘要:\n${d.excerpt}`
      )
      .join('\n\n---\n\n');

    const attachedBlock =
      attachedFiles.length > 0
        ? '\n\n用户本次临时上传的附件内容：\n' +
          attachedFiles
            .map((f) => `【附件: ${f.name}】\n${f.content.slice(0, 6000)}`)
            .join('\n\n')
        : '';

    const modeHint: Record<string, string> = {
      analyze: '请以深度分析专家视角，拆解核心逻辑、规则边界并精确标注原文依据。',
      draft: '请以专业内容主笔视角，输出结构清晰、可直接使用的公文/汇报/规范草稿。',
      data: '请以财务与数据分析师视角，重点核对数据口径、计算公式、明细字段与潜在异常。',
      brainstorm: '请以战略顾问视角，提出多维度的关联路径、执行建议与潜在风险预案。',
      general: '请以精准、克制、条理清晰的风格回答问题。',
    };

    const systemInstruction = `你是 Knowhub Enterprise Intelligence（企业级 AI 知识库工作台助手）。
当前检索范围：${scopeLabel}
模式指引：${modeHint[mode] || modeHint.general}

核心规则：
1. 优先依据下方提供的内部知识库原文作答；引用具体事实、规则或公式时，请在句末使用方括号标注来源文档标题，例如 [《物语集团薪酬与绩效核算办法》]。
2. 如果问题超出内部知识库覆盖范围且开启了联网搜索，可结合搜索结果补充；如果未开启联网搜索且库内无相关记录，请明确告知“当前知识库范围暂未收录该细则”，并给出可行的补充建议，绝不编造内部数据。
3. 使用优雅的中文 Markdown 排版：合理使用二级/三级小标题、要点列表、加粗关键结论、公式代码块或对照表格，保持简洁高级的阅读节奏。
4. 在回答末尾，空一行后用 \`---FOLLOWUPS---\` 分隔线附上 3 个高度相关的追问建议，每行一个，不带序号。

内部知识库检索上下文：
${docsBlock || '（当前范围暂无匹配文档）'}${attachedBlock}`;

    const historyText = messages
      .slice(-8)
      .map((m) => `${m.role === 'user' ? '用户' : 'Knowhub AI'}: ${m.content}`)
      .join('\n\n');

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await ai.models.generateContentStream({
      model: 'gemini-4-hydrogen',
      contents: historyText,
      config: {
        systemInstruction,
        ...(webSearch ? { tools: [{ googleSearch: {} }] } : {}),
      },
    });

    const groundingUrls: { title: string; uri: string }[] = [];

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ type: 'delta', text })}\n\n`);
      }
      const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (Array.isArray(chunks)) {
        for (const c of chunks) {
          if (c.web?.uri && !groundingUrls.some((g) => g.uri === c.web?.uri)) {
            groundingUrls.push({
              title: c.web.title || c.web.uri,
              uri: c.web.uri,
            });
          }
        }
      }
    }

    if (groundingUrls.length > 0) {
      res.write(`data: ${JSON.stringify({ type: 'grounding', urls: groundingUrls })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err) {
    const formatted = formatApiError(err);
    if (!res.headersSent) {
      res.status(formatted.status).json({ error: formatted.message });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: formatted.message })}\n\n`);
      res.end();
    }
  }
});

app.post('/api/ai/note', async (req: Request, res: Response) => {
  try {
    const { action, title, content, knowledgeContext = '' } = req.body as {
      action: 'summarize' | 'polish' | 'extract_todos' | 'expand';
      title: string;
      content: string;
      knowledgeContext?: string;
    };

    const ai = getAiClient();

    if (action === 'extract_todos') {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `笔记标题：${title}\n笔记内容：\n${content}\n\n参考上下文：\n${knowledgeContext}`,
        config: {
          systemInstruction:
            '从笔记中提取清晰、可执行的工作待办事项。每条待办需包含具体动作、责任对象或时间节点（如有）。',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: '一句话总结该笔记的核心执行目标。',
              },
              todos: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    priority: { type: Type.STRING, description: 'high | medium | low' },
                    dueLabel: { type: Type.STRING, description: '如 今天 18:00、本周五、下周一' },
                  },
                },
              },
            },
          },
        },
      });
      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json(parsed);
    }

    const actionPrompts: Record<string, string> = {
      summarize: '请为这篇笔记提炼一份结构化的「核心摘要」，包含 1 句结论与 3-4 条关键要点，控制在 180 字以内，使用中文 Markdown。',
      polish: '请在不改变原意与关键数据的前提下，将这篇笔记润色为苹果备忘录/企业规范风格的精炼专业文案，排版清晰，直接返回润色后的正文。',
      expand: '请结合知识库上下文，为这篇笔记补充可执行细节、风险检查项或制度对照说明，直接返回扩展后的完整正文。',
    };

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `笔记标题：${title}\n\n当前正文：\n${content}\n\n知识库参考：\n${knowledgeContext}`,
      config: {
        systemInstruction: actionPrompts[action] || actionPrompts.polish,
      },
    });

    return res.json({ result: response.text ?? '' });
  } catch (err) {
    const formatted = formatApiError(err);
    return res.status(formatted.status).json({ error: formatted.message });
  }
});

app.post('/api/ai/analyze', async (req: Request, res: Response) => {
  try {
    const { kind, scopeName, promptInput, documents = [] } = req.body as {
      kind: 'doc_insight' | 'knowledge_digest' | 'skill_run' | 'ontology_extract' | 'hotspot_brief';
      scopeName?: string;
      promptInput?: string;
      documents?: DocContextInput[];
    };

    const ai = getAiClient();
    const contextText = documents
      .map((d) => `【${d.title}】(${d.libraryName})\n${d.excerpt}`)
      .join('\n\n');

    if (kind === 'ontology_extract') {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `知识库范围：${scopeName || '全库'}\n资料：\n${contextText}`,
        config: {
          systemInstruction:
            '从企业知识库资料中抽取出核心「本体实体」与「关系三元组」，用于知识图谱建模。返回 4-6 条高价值实体关系。',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              insight: { type: Type.STRING, description: '本体结构总结一句话' },
              relations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    source: { type: Type.STRING },
                    relation: { type: Type.STRING },
                    target: { type: Type.STRING },
                    evidence: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });
      return res.json(JSON.parse((response.text ?? '{}').trim()));
    }

    const systemMap: Record<string, string> = {
      doc_insight:
        '你是资深企业知识架构师。请对提供的单篇文档进行智能洞察，输出：1）一句话核心主旨；2）3个关键规则/数据指标；3）潜在关联建议。保持精炼、克制、专业中文排版。',
      knowledge_digest:
        '你是企业首席知识官。请基于当前知识库的所有资料，生成一份高层级《知识库全景综述》，包括核心体系概览、高频业务口径、及当前资料缺口建议。',
      skill_run:
        '你是 Knowhub 智能技能执行引擎 (DS Bot)。请严格根据用户触发的技能指令与知识库原文，输出结构化核查结果、异常提示或可执行产出物。',
      hotspot_brief:
        '你是行业情报分析师。结合提供的行业热点主题与企业内部知识库现状，生成一份简洁的《对本企业影响与应对建议》简报。',
    };

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `${promptInput ? `任务指令：${promptInput}\n\n` : ''}知识范围：${scopeName || '企业知识库'}\n\n参考资料：\n${contextText}`,
      config: {
        systemInstruction: systemMap[kind] || systemMap.doc_insight,
      },
    });

    return res.json({ result: response.text ?? '' });
  } catch (err) {
    const formatted = formatApiError(err);
    return res.status(formatted.status).json({ error: formatted.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Knowhub Intelligence server running at http://localhost:${PORT}`);
  });
}

startServer();
