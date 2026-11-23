import type {
  ChatSession,
  DsBotAgent,
  GraphEdge,
  GraphNode,
  IndustryHotspot,
  KnowledgeBase,
  KnowledgeCluster,
  KnowledgeDoc,
  OntologyConcept,
  OntologyRelation,
  OrgDepartment,
  OrgMember,
  ProjectLibrary,
  TokenModelUsage,
  WikiPage,
  WorkspaceNote,
  WorkspaceTodo,
} from '../types/knowhub';

export const USER_PROFILE = {
  name: '演示管理员',
  account: 'admin',
  role: '管理员 · 演示投研团队',
  timezone: 'Asia/Shanghai',
  avatarUrl: '/src/assets/images/avatar_admin_user_1795349944757.jpg',
};

export const KNOWLEDGE_BASES: KnowledgeBase[] = [
  {
    id: 'all',
    name: '全部可访问文件 · 11 个知识库',
    shortName: '全部知识库',
    scope: 'company',
    description: '统一检索企业制度、物语人力薪酬、采购对账、行业情报与个人 Obsidian 验收库。',
    docCount: 11,
    updatedAt: '2026-11-22 19:22',
    accentColor: 'blue',
  },
  {
    id: 'kb-wuyu-hr',
    name: '公司库 · 物语人力薪酬',
    shortName: '物语人力薪酬',
    scope: 'company',
    description: '物语餐饮集团（Monogatari HK，肉肉大米香港门店）薪酬与人力数据，2026年工资待遇分析与报告。',
    docCount: 4,
    updatedAt: '2026-11-22 16:57',
    accentColor: 'violet',
  },
  {
    id: 'kb-finance-recon',
    name: '公司库 · 物语采购对账',
    shortName: '物语采购对账',
    scope: 'company',
    description: '物语餐饮集团旗下品牌（天天·天妇罗专门店、肉肉大米、冈田屋）采购对账差异数据，含每日明细与异常差异。',
    docCount: 2,
    updatedAt: '2026-11-22 10:56',
    accentColor: 'emerald',
  },
  {
    id: 'kb-xinghe-ops',
    name: '公司库 · 星河门店运营',
    shortName: '星河门店运营',
    scope: 'company',
    description: '星河门店周报提交规范、巡检清单、排班标准与 A 级门店分红考核。',
    docCount: 3,
    updatedAt: '2026-11-22 19:22',
    accentColor: 'cyan',
  },
  {
    id: 'kb-ontology',
    name: '公司库 · 本体论知识',
    shortName: '本体论知识',
    scope: 'company',
    description: '知识表示、语义建模、FIBO 金融基础本体（Ontology）相关知识点与参考资料。',
    docCount: 2,
    updatedAt: '2026-11-21 15:10',
    accentColor: 'amber',
  },
  {
    id: 'kb-ai-hotspot',
    name: '公司库 · 行业情报-AI',
    shortName: '行业情报-AI',
    scope: 'company',
    description: 'AIHOT 通用行业热点同步库，汇聚大模型、连锁零售与财税合规洞察。',
    docCount: 3,
    updatedAt: '2026-11-22 12:20',
    accentColor: 'amber',
  },
  {
    id: 'kb-personal-qa',
    name: '个人库 · 本地功能验收-笔记待办与DSBot',
    shortName: '本地功能验收',
    scope: 'personal',
    description: '个人空间测试笔记、Obsidian 双链与 DS Bot 产物保存验收库。',
    docCount: 2,
    updatedAt: '2026-11-22 18:40',
    accentColor: 'blue',
  },
  {
    id: 'kb-personal-notes',
    name: '个人库 · 我的研究手记·演示',
    shortName: '我的研究手记',
    scope: 'personal',
    description: '演示账号的个人观察、阅读笔记和待验证问题（模拟演示设定）。',
    docCount: 3,
    updatedAt: '2026-11-20 14:30',
    accentColor: 'violet',
  },
];

export const PROJECT_LIBRARIES: ProjectLibrary[] = [
  {
    id: 'proj-all',
    name: '全部负责项目',
    shortName: '全部项目',
    description: '汇总展示名下负责的所有项目库笔记与按时间排期的待办事项。',
    owner: '演示管理员',
    accentColor: 'blue',
  },
  {
    id: 'proj-xinghe',
    name: '星河门店运营项目',
    shortName: '星河门店运营',
    description: '负责华东星河门店周报督导、闭店巡检与 A 级门店合伙人分红落地。',
    owner: '运营督导部',
    accentColor: 'emerald',
  },
  {
    id: 'proj-recon',
    name: '采购对账自动化项目',
    shortName: '采购对账项目',
    description: '负责天天·天妇罗与肉肉大米每日采购明细与 ERP 入库单差异稽核。',
    owner: '财务核算中心',
    accentColor: 'amber',
  },
  {
    id: 'proj-wuyu-hr',
    name: '物语薪酬核算项目',
    shortName: '物语薪酬项目',
    description: '负责 P/M 职级带宽、Monogatari HK 净薪额口径核验与政策宣导。',
    owner: '人力资源部',
    accentColor: 'violet',
  },
  {
    id: 'proj-qa',
    name: 'Knowhub 功能验收项目',
    shortName: '功能验收项目',
    description: '负责 Obsidian 双链笔记、时间待办协同与 DS Bot 商业交付件联调验收。',
    owner: '演示管理员',
    accentColor: 'cyan',
  },
];

export const INITIAL_DOCS: KnowledgeDoc[] = [
  {
    id: 'doc-1',
    libraryId: 'kb-wuyu-hr',
    libraryName: '公司库 · 物语人力薪酬',
    title: '物语集团薪酬与绩效核算办法.md',
    fileType: 'md',
    sizeLabel: '42 KB',
    wordCount: 3840,
    updatedAt: '2026-11-20',
    author: '人力资源部',
    excerpt:
      '一、薪资等级体系：物语人力职级分为 P1-P8 专业序列与 M1-M5 管理序列，各等级对应固定基础薪资带宽（Band A/B/C）。\n二、物语薪资计算公式：\n应发工资 = 基本工资 + 岗位津贴 + 绩效工资 × 绩效系数（S=1.3, A=1.15, B=1.0, C=0.8） + 全勤奖（300元） + 加班费。\n净薪额（实发工资） = 应发工资 - 个人社保公积金代扣 - 专项附加扣除后个人所得税 - 考勤扣款。\n三、发放节点：每月 10 日为上月薪酬发放日。',
  },
  {
    id: 'doc-2',
    libraryId: 'kb-wuyu-hr',
    libraryName: '公司库 · 物语人力薪酬',
    title: '物语工资待遇报告.docx',
    fileType: 'docx',
    sizeLabel: '1.8 MB',
    wordCount: 6420,
    updatedAt: '2026-11-18',
    author: '薪酬分析组',
    excerpt:
      '报告摘要：物语香港（Monogatari HK）及内地门店 9 月工资待遇报告显示，净薪额由总收入减去总扣除额得出。一线服务员与厨师包含勤工津贴、加班津贴、住房津贴及新人表现奖；兼职（PT/L）按兼职时薪与工时合计结算。P4 级技术骨干平均月度净薪额为 16,420 元，门店店长（M2）含超额分红后净薪额中位数为 14,850 元。',
  },
  {
    id: 'doc-3',
    libraryId: 'kb-xinghe-ops',
    libraryName: '公司库 · 星河门店运营',
    title: '星河门店周报提交规范与考核要求.md',
    fileType: 'md',
    sizeLabel: '28 KB',
    wordCount: 2150,
    updatedAt: '2026-11-22',
    author: '运营督导部',
    excerpt:
      '星河门店周报提交周期：每周五 18:00 前须由各门店店长在 Knowhub 工作台完成当周运营周报提交，区域督导于每周六 12:00 前完成审阅与批注。\n周报核心必填项包括：1. 本周营业额与客单价环比；2. 核心损耗率与库存预警；3. 人员排班出勤与异常事件；4. 下周重点营销及陈列动作。未按时提交将影响当月门店运营评分（扣 2 分/次）。',
  },
  {
    id: 'doc-4',
    libraryId: 'kb-finance-recon',
    libraryName: '公司库 · 物语采购对账',
    title: '采购对账汇总.xlsx',
    fileType: 'xlsx',
    sizeLabel: '864 KB',
    wordCount: 12400,
    updatedAt: '2026-11-21',
    author: '财务核算中心',
    excerpt:
      '《采购对账汇总.xlsx》包含汇总总表、天天·天妇罗专门店每日明细、肉肉大米每日明细。\n“每日明细”标准字段：对账日期、供应商名称、采购单号、物料编码、品名规格、入库数量、含税单价、税率（6%/9%/13%）、含税金额、退货冲减额、验收人及异常备注。天天·天妇罗专门店（七宝领展广场店）2026-10-01 入库金额 18,460.50 元；每日 22:00 与 ERP 核对，差异超过 ±50 元触发复核。',
  },
  {
    id: 'doc-5',
    libraryId: 'kb-wuyu-hr',
    libraryName: '公司库 · 物语人力薪酬',
    title: '门店合伙人与激励分红补充条款.docx',
    fileType: 'docx',
    sizeLabel: '156 KB',
    wordCount: 1980,
    updatedAt: '2026-11-15',
    author: '法务与人力联合发布',
    excerpt:
      '自 2026 年 10 月起，连续 3 个月达成星河门店 A 级运营标准的店长及核心骨干，可申请加入超额利润分红池。分红核算于每季度次月 15 日与当月薪资合并发放。',
  },
  {
    id: 'doc-6',
    libraryId: 'kb-personal-qa',
    libraryName: '个人库 · 本地功能验收-笔记待办与DSBot',
    title: '笔记待办与 DSBot 联合验收清单.md',
    fileType: 'md',
    sizeLabel: '18 KB',
    wordCount: 1320,
    updatedAt: '2026-11-22',
    author: '演示管理员',
    excerpt:
      '验收目标：验证 Obsidian 双链笔记、待办看板联动、以及 DS Bot 商业方案 AI 产物保存能力。产物经用户确认保存至知识库或笔记，原文件保持版本管理不覆写。',
  },
];

export const INITIAL_CHAT_SESSIONS: ChatSession[] = [
  {
    id: 'chat-1',
    title: '星河门店周报每周什么时候提交？',
    group: '今天',
    timeLabel: '19:22',
    libraryId: 'kb-xinghe-ops',
    messages: [
      {
        id: 'm-1',
        role: 'user',
        content: '星河门店周报每周什么时候提交？逾期有什么影响？',
        timestamp: '19:22',
      },
      {
        id: 'm-2',
        role: 'assistant',
        content:
          '根据《星河门店周报提交规范与考核要求.md》，星河门店周报的提交与审阅节点如下：\n\n### 1. 提交与审阅时间\n- **门店提交截止**：**每周五 18:00 前**，需由各门店店长在 Knowhub 工作台完成提交。\n- **区域督导审阅**：**每周六 12:00 前**完成审阅与批注 [《星河门店周报提交规范与考核要求.md》]。\n\n### 2. 必填内容结构\n1. 本周营业额与客单价环比\n2. 核心损耗率与库存预警\n3. 人员排班出勤与异常事件\n4. 下周重点营销及陈列动作\n\n### 3. 逾期影响\n未按时提交将影响当月门店运营考核评分，按 **扣 2 分/次** 处理 [《星河门店周报提交规范与考核要求.md》]。',
        timestamp: '19:22',
        citations: ['星河门店周报提交规范与考核要求.md'],
        followUps: [
          '帮我生成一份星河门店周五周报模板',
          '连续达成 A 级门店有哪些分红激励？',
          '物语的薪资等级是如何划分的？',
        ],
      },
    ],
  },
  {
    id: 'chat-2',
    title: '物语的人力有哪些资源 薪资等级如何划分',
    group: '更早',
    timeLabel: '16:57',
    libraryId: 'kb-wuyu-hr',
    messages: [
      {
        id: 'm-3',
        role: 'user',
        content: '物语的人力有哪些资源？薪资等级如何划分？',
        timestamp: '16:57',
      },
      {
        id: 'm-4',
        role: 'assistant',
        content:
          '物语人力体系分为两大职级序列与对应的薪酬带宽：\n\n- **专业序列（P1–P8）**：覆盖技术骨干、运营专员与职能支持，P4 级技术骨干月度净薪额均值约 **16,420 元** [《物语工资待遇报告.docx》]。\n- **管理序列（M1–M5）**：覆盖门店店长及区域管理，M2 店长含超额分红后净薪额中位数为 **14,850 元** [《物语工资待遇报告.docx》]。\n- **全职与兼职体系**：一线门店同时配置全职月薪人员（含基本工资、勤工津贴、加班津贴、住房津贴及新人表现奖）与兼职（PT/L）时薪人员 [《物语工资待遇报告.docx》]。',
        timestamp: '16:57',
        citations: ['物语集团薪酬与绩效核算办法.md', '物语工资待遇报告.docx'],
        followUps: [
          '物语薪资的具体计算公式是什么？',
          '净薪额是如何从总收入和总扣除额算出的？',
        ],
      },
    ],
  },
  {
    id: 'chat-3',
    title: '新对话 · 知识库检索与推理',
    group: '今天',
    timeLabel: '20:40',
    libraryId: 'all',
    messages: [],
  },
];

export const INITIAL_DS_BOTS: DsBotAgent[] = [
  {
    id: 'bot-solution',
    name: '商业方案 AI',
    roleTitle: '方案撰写与多格式产物交付',
    color: 'cyan',
    starred: true,
    targetLibraryId: 'kb-xinghe-ops',
    description: '基于内部制度与业务口径起草可执行商业方案，自动生成 HTML / PDF / Markdown 交付件并支持一键保存。',
    quickPrompts: [
      '把「界面操作能力说明」抽成一页 A4 交付件，对比用友/致远 ERP 免接口接入价值',
      '起草一份《星河门店 Q4 数字化督导与周报提效方案》并附 HTML/PDF 产物',
      '整理《物语薪酬透明化员工沟通方案》并校对计算口径',
    ],
    messages: [
      {
        id: 'bm-1',
        role: 'user',
        content: '请帮我核对数字员工平台财务采购解决方案的补充修改项，并输出章节校验与确认建议。',
        timestamp: '11月20日 周五 17:52',
      },
      {
        id: 'bm-2',
        role: 'bot',
        content:
          '已完成补充修订与全篇编号校验，核心修改摘要如下：\n\n### 二、另外补充处的修改\n- 在**第 1 章**末尾补了一段：除了业务层的卡点，系统层还有一道“接口”门槛，具体放在第 6 章。\n- 在**产品能力**表里加了一行“系统操作”：在浏览器里操作现有系统，用友、致远等 ERP 无需接口即可接入；对应的价值是“老系统也能接进来，不必等厂商排期”。\n- 产品能力从“六件事”改为“七件事”。\n\n### 三、编号与校验\n| 项 | 结果 |\n|---|---|\n| 章节 | 01–12 连续，目录 13 条（含附录），锚点全部可达 |\n| 表 | 18 张，按出现顺序重排，无重号 |\n| 字数 | 7,778 字 |\n| 响应式 | 320 / 375 / 414 / 768 / 1280 无横向溢出 |\n| 打印 | A4 16 页，表头跨页重复、行不拆 |\n\n### 四、两个建议你确认的地方\n1. **具体版本要不要写**：现在写的是“用友、致远这类 ERP”。如果确认能覆盖 U8、U9、NC、A8 这几代，可在旁边小字标注，客户代入感更强。\n2. **验证码与人脸那段**：目前写的是“需人配合一次”，未承诺绕过；如已有对应的接管方案可补充。\n\n要不要我把这一章单独抽出来，做成一页 A4 的“界面操作能力说明”？发给 IT 部门时，这一页比整本方案更合适。',
        timestamp: '11月20日 周五 17:52',
        deliverables: [
          {
            id: 'deliv-html',
            fileName: '数字员工平台_财务采购解决方案.html',
            subtitle: '财务与采购版方案 HTML',
            format: 'html',
            content: '<h1>数字员工平台 · 财务采购解决方案</h1><p>覆盖用友/致远 ERP 免接口浏览器操作与每日采购对账闭环。</p>',
          },
          {
            id: 'deliv-pdf',
            fileName: '数字员工平台_财务采购解决方案.pdf',
            subtitle: '同版 PDF（A4 16 页排版）',
            format: 'pdf',
            content: '数字员工平台_财务采购解决方案（A4 16 页打印版，含 18 张校验表格与 12 章完整目录）',
          },
        ],
      },
    ],
  },
  {
    id: 'bot-hr',
    name: '薪酬核算 Bot',
    roleTitle: '物语人力薪酬 · 口径验算',
    color: 'blue',
    starred: true,
    targetLibraryId: 'kb-wuyu-hr',
    description: '读取《物语集团薪酬与绩效核算办法》与待遇报告，自动验算 P/M 职级应发与净薪额。',
    quickPrompts: [
      '按制度验算 P4 职级（基本 12000 + 津贴 2000 + 绩效 4000 × A 级）的应发与净薪口径',
      '对比全职月薪与兼职（PT/L）时薪在待遇报告中的津贴构成差异',
    ],
    messages: [],
  },
  {
    id: 'bot-recon',
    name: '采购稽核 Bot',
    roleTitle: '财务对账 · 异常差异排查',
    color: 'amber',
    starred: false,
    targetLibraryId: 'kb-finance-recon',
    description: '专精《采购对账汇总.xlsx》每日明细核对，快速排查天天·天妇罗门店超 ±50 元差异单据。',
    quickPrompts: [
      '梳理天天·天妇罗专门店“每日明细”12 个标准字段与异常复核流程',
      '生成 22:00 门店日结与 ERP 入库单对账自检表',
    ],
    messages: [],
  },
  {
    id: 'bot-ops',
    name: '门店督导 Bot',
    roleTitle: '星河运营 · 周报与巡检',
    color: 'slate',
    starred: false,
    targetLibraryId: 'kb-xinghe-ops',
    description: '面向星河门店店长与区域督导，跟踪周五 18:00 周报提报与 A 级门店合伙人晋级指标。',
    quickPrompts: [
      '生成本周五 18:00 前星河门店周报提交自查清单',
      '核查连续 3 个月 A 级门店分红资格评估维度',
    ],
    messages: [],
  },
];

export const INITIAL_NOTES: WorkspaceNote[] = [
  {
    id: 'note-1',
    title: '助手整理：整理周报提交要求',
    folder: '门店运营',
    tags: ['#星河门店', '#周报规范', '#待办联动'],
    projectId: 'proj-xinghe',
    projectName: '星河门店运营项目',
    libraryName: '星河门店运营项目',
    updatedAt: '今天 19:15',
    content: `# 星河门店周报执行口径

> [!info] 核心截点
> 各门店店长须于 **每周五 18:00 前** 提交周报，区域督导于 **每周六 12:00 前** 完成批注。

## 1. 关联制度与笔记
- 制度依据：[[物语集团薪酬与绩效核算办法]]
- 协同跟进：[[模拟验收：门店工作安排]]
- 财务核对：[[采购对账异常排查备忘]]

## 2. 必填四项指标
1. 本周营业额与客单价环比变化
2. 核心损耗率与生鲜库存预警
3. 人员排班出勤与异常事件记录
4. 下周重点营销及陈列动作

## 3. 关联待办事项
- [ ] 周五 17:30 提醒华东区各店长核对周报数据
- [ ] 核对天天与天妇罗门店每日采购对账差异（超 ±50 元复核）`,
  },
  {
    id: 'note-2',
    title: '模拟验收：跟进笔记',
    folder: '功能验收',
    tags: ['#DSBot', '#Obsidian验收', '#薪酬口径'],
    projectId: 'proj-qa',
    projectName: 'Knowhub 功能验收项目',
    libraryName: 'Knowhub 功能验收项目',
    updatedAt: '今天 16:40',
    content: `# 本地功能验收跟进记录

本轮重点验证 Obsidian 风格双链笔记与 [[商业方案 AI]] 的产物沉淀链路：

- 核查 [[物语工资待遇报告口径拆解]] 中 P1-P8 与 M1-M5 的知识引用准确性。
- 确认 **DS Bot** 生成的 HTML / PDF 交付物保存至知识库后，原文件保持版本管理不覆盖。
- [ ] 下周一 10:00 与财务组核对《采购对账汇总.xlsx》最新税率字段（6%/9%/13%）。
- [x] 完成 P4 技术骨干月度净薪额均值（16,420 元）口径校验。`,
  },
  {
    id: 'note-3',
    title: '模拟验收：门店工作安排',
    folder: '门店运营',
    tags: ['#星河门店', '#合伙人分红'],
    projectId: 'proj-xinghe',
    projectName: '星河门店运营项目',
    libraryName: '星河门店运营项目',
    updatedAt: '昨天 18:05',
    content: `# 星河华东一店下周工作安排

配合 [[助手整理：整理周报提交要求]] 中的考核标准推进落地：

- **周二**：完成冷链采购单据与 ERP 入库单对齐，参考 [[采购对账异常排查备忘]]。
- **周四**：开展门店合伙人分红规则宣导，确保核心骨干清楚连续 3 个月 A 级门店的激励条件。
- **周五 17:00**：预留 1 小时汇总本周营业数据与损耗清单。

- [ ] 宣导连续 3 个月 A 级门店超额利润分红条款`,
  },
  {
    id: 'note-4',
    title: '采购对账异常排查备忘',
    folder: '财务核算',
    tags: ['#采购对账', '#天天门店', '#天妇罗'],
    projectId: 'proj-recon',
    projectName: '采购对账自动化项目',
    libraryName: '采购对账自动化项目',
    updatedAt: '11-20 14:20',
    content: `# 采购对账每日明细与差异阈值

针对《采购对账汇总.xlsx》中 **天天·天妇罗专门店** 与 **肉肉大米** 的日结核对：

- **标准 12 字段**：对账日期、供应商名称、采购单号、物料编码、品名规格、入库数量、含税单价、税率、含税金额、退货冲减额、验收人、异常备注。
- **复核触发线**：每日 22:00 自动汇总并与 ERP 入库单比对，差异超过 **±50 元** 必须标红进入复核。`,
  },
  {
    id: 'note-5',
    title: '物语工资待遇报告口径拆解',
    folder: '人力薪酬',
    tags: ['#薪酬口径', '#MonogatariHK'],
    projectId: 'proj-wuyu-hr',
    projectName: '物语薪酬核算项目',
    libraryName: '物语薪酬核算项目',
    updatedAt: '11-18 11:05',
    content: `# 物语工资待遇报告（Monogatari HK）核心口径

- **净薪额定义**：总收入减去总扣除额（含个人社保公积金及个税），不含企业统筹部分。
- **全职组成**：基本工资 + 勤工津贴 + 加班津贴 + 住房津贴 + 新人表现奖。
- **兼职（PT/L）**：按兼职时薪与出勤工时单独核算汇总。`,
  },
];

export const INITIAL_TODOS: WorkspaceTodo[] = [
  {
    id: 'todo-2',
    title: '复核天天/天妇罗门店采购对账差异超 ±50 元单据',
    completed: false,
    status: 'in_progress',
    priority: 'high',
    dueDate: '2026-11-22',
    dueTime: '22:00',
    dueLabel: '今天 22:00',
    projectId: 'proj-recon',
    projectName: '采购对账自动化项目',
    sourceNote: '采购对账异常排查备忘',
    tag: '#采购对账',
  },
  {
    id: 'todo-3',
    title: '下周一 10:00 与财务组确认税率字段（6%/9%/13%）',
    completed: false,
    status: 'in_progress',
    priority: 'medium',
    dueDate: '2026-11-23',
    dueTime: '10:00',
    dueLabel: '2026-11-23 10:00',
    projectId: 'proj-qa',
    projectName: 'Knowhub 功能验收项目',
    sourceNote: '模拟验收：跟进笔记',
    tag: '#Obsidian验收',
  },
  {
    id: 'todo-5',
    title: '宣导连续 3 个月 A 级门店超额利润分红条款',
    completed: false,
    status: 'waiting',
    priority: 'low',
    dueDate: '2026-11-26',
    dueTime: '14:00',
    dueLabel: '2026-11-26 14:00',
    projectId: 'proj-xinghe',
    projectName: '星河门店运营项目',
    sourceNote: '模拟验收：门店工作安排',
    tag: '#合伙人分红',
  },
  {
    id: 'todo-1',
    title: '周五 17:30 提醒各星河门店店长按时提交运营周报',
    completed: false,
    status: 'waiting',
    priority: 'high',
    dueDate: '2026-11-27',
    dueTime: '17:30',
    dueLabel: '2026-11-27 17:30',
    projectId: 'proj-xinghe',
    projectName: '星河门店运营项目',
    sourceNote: '助手整理：整理周报提交要求',
    tag: '#星河门店',
  },
  {
    id: 'todo-4',
    title: '完成 P4 级骨干月度净薪额均值（16,420 元）口径校验',
    completed: true,
    status: 'completed',
    priority: 'medium',
    dueDate: '2026-11-21',
    dueTime: '16:00',
    dueLabel: '2026-11-21 16:00',
    projectId: 'proj-wuyu-hr',
    projectName: '物语薪酬核算项目',
    sourceNote: '模拟验收：跟进笔记',
    tag: '#薪酬口径',
  },
];

export const INITIAL_WIKI_PAGES: WikiPage[] = [
  {
    id: 'wiki-1',
    title: '物语工资待遇报告 · 薪酬结构百科',
    category: '公司 / 物语人力薪酬',
    updatedAt: '2026-11-20',
    author: '人力资源部',
    readTime: '4 分钟阅读',
    content:
      '## 适用范围\n本词条依据《物语工资待遇报告.docx》与《物语集团薪酬与绩效核算办法.md》整理，涵盖物语香港（Monogatari HK）及内地门店。\n\n## 核心核算公式\n- **应发工资** = 基本工资 + 岗位津贴 + 绩效工资 × 绩效系数 + 全勤奖（300 元） + 加班费\n- **净薪额（实发）** = 总收入 - 总扣除额（个人社保公积金 + 个税 + 考勤扣款）\n\n## 绩效系数对照\n- **S 级（卓越）**：1.30\n- **A 级（优秀）**：1.15\n- **B 级（达标）**：1.00\n- **C 级（待改进）**：0.80',
  },
  {
    id: 'wiki-2',
    title: '星河门店标准化运营手册（SOP）',
    category: '公司 / 星河门店运营',
    updatedAt: '2026-11-22',
    author: '运营督导部',
    readTime: '6 分钟阅读',
    content:
      '## 日常闭店与对账\n每日 22:00 营业结束后，值班经理核对收银流水与冷链入库单，确保 ERP 与《采购对账汇总.xlsx》日结金额误差控制在 ±50 元以内。\n\n## 周报提交节律\n- **周五 18:00 前**：店长提交当周运营复盘周报。\n- **周六 12:00 前**：区域督导完成审核并下发整改建议。',
  },
  {
    id: 'wiki-3',
    title: '财务采购对账字段与税率口径',
    category: '公司 / 物语采购对账',
    updatedAt: '2026-11-19',
    author: '财务核算中心',
    readTime: '3 分钟阅读',
    content:
      '## 日明细 12 项标准字段\n包含对账日期、供应商名称、采购单号、物料编码、品名规格、入库数量、含税单价、税率（6%/9%/13%）、含税金额、退货冲减额、验收人及异常备注。',
  },
];

export const WIKI_GRAPH_NODES: GraphNode[] = [
  { id: 'wg-1', label: '物语工资待遇报告', group: 'source', x: 180, y: 210, evidenceCount: 18, summary: '核心数据源文档，覆盖香港及内地门店全职与兼职薪酬明细。' },
  { id: 'wg-2', label: '净薪额', group: 'core', x: 380, y: 120, evidenceCount: 14, summary: '实发净薪 = 总收入 - 总扣除额，不含企业统筹部分。' },
  { id: 'wg-3', label: '基本工资', group: 'metric', x: 520, y: 210, evidenceCount: 11, summary: '按 P1–P8 及 M1–M5 职级带宽确定的固定底薪。' },
  { id: 'wg-4', label: '加班津贴', group: 'metric', x: 260, y: 100, evidenceCount: 8, summary: '一线服务员与厨师法定工时外补贴项。' },
  { id: 'wg-5', label: '勤工津贴', group: 'metric', x: 350, y: 60, evidenceCount: 7, summary: '全勤出勤激励，标准额度 300 元/月。' },
  { id: 'wg-6', label: '总扣除额', group: 'core', x: 420, y: 290, evidenceCount: 9, summary: '含个人社保公积金代扣、个税及考勤扣款。' },
  { id: 'wg-7', label: '管理层 / 主管层', group: 'concept', x: 390, y: 200, evidenceCount: 12, summary: 'M1–M5 管理序列，M2 店长含分红净薪中位数 14,850 元。' },
  { id: 'wg-8', label: '兼职 (PT/L) 合计', group: 'metric', x: 530, y: 310, evidenceCount: 6, summary: '按兼职时薪 × 实际出勤工时统计结算。' },
  { id: 'wg-9', label: '新人表现奖', group: 'metric', x: 560, y: 110, evidenceCount: 5, summary: '入职首季达成考核指标的新员工专项奖励。' },
  { id: 'wg-10', label: '住房津贴', group: 'metric', x: 270, y: 310, evidenceCount: 6, summary: '面向跨区门店调派员工的住宿补贴项目。' },
  { id: 'wg-11', label: '一线服务员与厨师', group: 'concept', x: 210, y: 270, evidenceCount: 10, summary: '门店核心运营岗位群，适用排班考勤与全勤津贴。' },
  { id: 'wg-12', label: 'Monogatari HK', group: 'source', x: 460, y: 140, evidenceCount: 9, summary: '香港餐饮市场基准对比样本，统一折算币种口径。' },
];

export const WIKI_GRAPH_EDGES: GraphEdge[] = [
  { source: 'wg-1', target: 'wg-2' },
  { source: 'wg-1', target: 'wg-7' },
  { source: 'wg-1', target: 'wg-11' },
  { source: 'wg-2', target: 'wg-3' },
  { source: 'wg-2', target: 'wg-6' },
  { source: 'wg-2', target: 'wg-5' },
  { source: 'wg-2', target: 'wg-4' },
  { source: 'wg-7', target: 'wg-3' },
  { source: 'wg-7', target: 'wg-12' },
  { source: 'wg-7', target: 'wg-9' },
  { source: 'wg-11', target: 'wg-4' },
  { source: 'wg-11', target: 'wg-10' },
  { source: 'wg-6', target: 'wg-8' },
  { source: 'wg-3', target: 'wg-8' },
  { source: 'wg-12', target: 'wg-9' },
];

export const INDUSTRY_HOTSPOTS: IndustryHotspot[] = [
  {
    id: 'hot-1',
    title: '2026 连锁零售智能化督导趋势：AI 自动核对门店周报与损耗异常',
    category: '行业',
    source: '零售科技观察',
    publishedAt: '2026-11-22 12:20',
    impactLevel: '高关注',
    summary: '头部连锁餐饮品牌通过多模态 AI 将门店周报整理耗时缩短 65%，并自动识别库存损耗与采购对账偏差。',
    relatedLibrary: '公司库 · 星河门店运营',
    unread: true,
    bookmarked: true,
  },
  {
    id: 'hot-2',
    title: '新个税专项附加扣除与餐饮零售企业弹性薪酬结构合规指引',
    category: '观点',
    source: '人社政策前沿',
    publishedAt: '2026-11-21 09:45',
    impactLevel: '政策解读',
    summary: '明确季度激励分红与月度基本薪酬的并表计税规范，建议在工资待遇报告中清晰区分应发与税后净薪口径。',
    relatedLibrary: '公司库 · 物语人力薪酬',
    unread: true,
  },
  {
    id: 'hot-3',
    title: 'Gemini 4 系列长上下文检索增强与企业多库零幻觉引用实践',
    category: '模型',
    source: 'AIHOT 日报',
    publishedAt: '2026-11-20 18:10',
    impactLevel: '行业动态',
    summary: '通过结构化知识簇与本体约束，使企业内部财税、人力规则问答准确率提升至行业领先水平。',
    relatedLibrary: '公司库 · 行业情报-AI',
    unread: false,
    bookmarked: true,
  },
  {
    id: 'hot-4',
    title: '业财一体化对账引擎：日结单自动匹配 ERP 入库明细实践',
    category: '产品',
    source: '企业数字化周刊',
    publishedAt: '2026-11-19 14:30',
    impactLevel: '行业动态',
    summary: '针对高频生鲜与餐饮供应链，将 ±50 元以内尾差自动归集，聚焦高额退货冲减异常审核。',
    relatedLibrary: '公司库 · 物语采购对账',
    unread: false,
  },
];

export const KNOWLEDGE_CLUSTERS: KnowledgeCluster[] = [
  {
    id: 'cluster-1',
    name: '星河门店周报每周什么时候提交？请引用原文。',
    lifecycle: '新形成',
    confidence: 0.91,
    docCount: 3,
    updatedAt: '2026/11/22 19:22:31',
    coreConcepts: ['周五 18:00 截点', '周六 12:00 审阅', '损耗率预警', '扣 2 分/次'],
    description: '围绕门店日常巡检、周报必填指标与绩效扣分规则构建标准化执行知识簇。',
  },
  {
    id: 'cluster-2',
    name: '物语的工资怎么计算',
    lifecycle: '稳定',
    confidence: 0.88,
    docCount: 4,
    updatedAt: '2026/11/22 16:58:41',
    coreConcepts: ['基本工资', '岗位津贴', '绩效系数 S/A/B/C', '全勤奖 300 元', '净薪额'],
    description: '聚合人力资源制度与月度薪酬计算公式，形成高精度薪酬核算语义簇。',
  },
  {
    id: 'cluster-3',
    name: '物语的人力有哪些资源 薪资等级是怎么样的？',
    lifecycle: '稳定',
    confidence: 0.86,
    docCount: 3,
    updatedAt: '2026/11/22 16:57:53',
    coreConcepts: ['P1-P8 专业序列', 'M1-M5 管理序列', 'Band A/B/C', '兼职 PT/L'],
    description: '梳理全职、兼职与管理梯队的职级带宽及激励分布。',
  },
  {
    id: 'cluster-4',
    name: '物语工资待遇报告中，净薪额是怎样从总收入和总扣除额算出的？',
    lifecycle: '演化中',
    confidence: 0.84,
    docCount: 2,
    updatedAt: '2026/11/20 13:35:53',
    coreConcepts: ['净薪额公式', '总扣除额', '社保公积金', '个人所得税'],
    description: '聚焦 Monogatari HK 与内地门店净薪口径对齐与税费扣减明细。',
  },
  {
    id: 'cluster-5',
    name: '采购对账汇总里的每日明细有哪些字段？',
    lifecycle: '稳定',
    confidence: 0.92,
    docCount: 2,
    updatedAt: '2026/11/19 10:56:09',
    coreConcepts: ['天天·天妇罗', '肉肉大米', '12 项标准字段', '±50 元阈值', '退货冲减额'],
    description: '连接供应链入库单、退货冲减与财务复核规则的业财核销知识簇。',
  },
  {
    id: 'cluster-6',
    name: '采购对账汇总.xlsx 中，天天·天妇罗专门店（七宝领展广场店）入库金额',
    lifecycle: '新形成',
    confidence: null,
    docCount: 1,
    updatedAt: '2026/11/18 10:54:09',
    coreConcepts: ['七宝领展广场店', '18,460.50 元', 'ERP 核对'],
    description: '特定门店单日入库数据追踪与差异核验节点。',
  },
];

export const ANALYTICS_TREND_POINTS = [
  { date: '10/24', total: 36 },
  { date: '10/28', total: 39 },
  { date: '10/31', total: 47 },
  { date: '11/05', total: 49 },
  { date: '11/10', total: 50 },
  { date: '11/14', total: 50 },
  { date: '11/18', total: 50 },
  { date: '11/22', total: 51 },
];

export const INITIAL_ONTOLOGY_CONCEPTS: OntologyConcept[] = [
  {
    id: 'oc-1',
    name: '存款账户',
    namespace: 'FIBO',
    description: '金融基础本体中的核心资金托管概念，定义账户持有人与开户日期等基础属性。',
    attributes: [
      { name: '开户日期', type: '日期' },
      { name: '账户状态', type: '枚举' },
    ],
    x: 190,
    y: 90,
  },
  {
    id: 'oc-2',
    name: '零售存款账户',
    namespace: '本地定义',
    parent: '存款账户',
    description: '演示子类：面向零售客户的存款账户，是存款账户的一种。本地仅声明这条继承关系，具体准入条件与约束后续按业务确认。',
    attributes: [
      { name: '开户日期', type: '日期', inheritedFrom: '存款账户' },
      { name: '单日交易限额', type: '金额' },
    ],
    x: 190,
    y: 250,
  },
  {
    id: 'oc-3',
    name: '法人实体',
    namespace: 'OMG Commons',
    description: '具备独立民事权利与义务的法律主体，可作为账户持有人或门店经营主体。',
    attributes: [
      { name: '统一社会信用代码', type: '文本' },
      { name: '注册地', type: '文本' },
    ],
    x: 470,
    y: 90,
  },
  {
    id: 'oc-4',
    name: '客户法人',
    namespace: '本地定义',
    parent: '法人实体',
    description: '与企业发生采购对账或薪酬托管关系的客户法人实体实例类别。',
    attributes: [
      { name: '统一社会信用代码', type: '文本', inheritedFrom: '法人实体' },
      { name: '授信等级', type: '枚举' },
    ],
    x: 470,
    y: 250,
  },
];

export const INITIAL_ONTOLOGY: OntologyRelation[] = [
  {
    id: 'ont-1',
    source: '存款账户',
    relation: '账户持有人',
    target: '法人实体',
    evidence: '金融基础本体 Mini · FIBO',
  },
  {
    id: 'ont-2',
    source: '零售存款账户',
    relation: '是一种',
    target: '存款账户',
    evidence: '本地扩展继承关系',
    isInheritance: true,
  },
  {
    id: 'ont-3',
    source: '客户法人',
    relation: '是一种',
    target: '法人实体',
    evidence: '本地扩展继承关系',
    isInheritance: true,
  },
  {
    id: 'ont-4',
    source: '物语员工（P/M序列）',
    relation: '适用核算',
    target: '绩效系数（S/A/B/C）',
    evidence: '物语集团薪酬与绩效核算办法.md',
  },
  {
    id: 'ont-5',
    source: '星河门店店长',
    relation: '每周五 18:00 提交',
    target: '门店运营周报',
    evidence: '星河门店周报提交规范与考核要求.md',
  },
];

export const TOKEN_USAGE_DATA: TokenModelUsage[] = [
  {
    model: 'gemini-4-hydrogen',
    provider: 'Google Gemini',
    inputTokens: 4642088,
    outputTokens: 6629059,
    calls: 1124,
  },
  {
    model: 'deepseek-v4.1-flash',
    provider: 'DeepSeek',
    inputTokens: 1394289,
    outputTokens: 392527,
    calls: 486,
  },
  {
    model: 'MiniMax-M3.1-Flash-Preview',
    provider: 'MiniMax',
    inputTokens: 74907,
    outputTokens: 55260,
    calls: 112,
  },
  {
    model: 'PaddleOCR-VL-1.5',
    provider: 'PaddleOCR',
    inputTokens: 1335,
    outputTokens: 134,
    calls: 34,
  },
];

export const ORG_DEPARTMENTS: OrgDepartment[] = [
  { id: 'all', name: '全公司成员', memberCount: 9 },
  { id: 'dept-research', name: '行业研究组', memberCount: 2 },
  { id: 'dept-robotics', name: '低空与机器人研究', memberCount: 2 },
  { id: 'dept-energy', name: '新能源研究', memberCount: 2 },
  { id: 'dept-dd', name: '项目尽调组', memberCount: 2 },
  { id: 'dept-ic', name: '投委会支持组', memberCount: 1 },
];

export const INITIAL_ORG_MEMBERS: OrgMember[] = [
  { id: 'u-1', name: '演示管理员', account: 'admin', departmentId: 'dept-research', departmentName: '演示投研团队', role: '管理员', status: '有效', color: 'blue' },
  { id: 'u-2', name: '林知远（演示）', account: 'demo.lin', departmentId: 'dept-research', departmentName: '行业研究组', role: '普通成员', status: '有效', color: 'cyan' },
  { id: 'u-3', name: '陈雨桐（演示）', account: 'demo.chen', departmentId: 'dept-robotics', departmentName: '低空与机器人研究', role: '普通成员', status: '有效', color: 'violet' },
  { id: 'u-4', name: '周予安（演示）', account: 'demo.zhou', departmentId: 'dept-energy', departmentName: '新能源研究', role: '普通成员', status: '有效', color: 'emerald' },
  { id: 'u-5', name: '许清禾（演示）', account: 'demo.xu', departmentId: 'dept-dd', departmentName: '项目尽调组', role: '普通成员', status: '有效', color: 'amber' },
  { id: 'u-6', name: '陆景行（演示）', account: 'demo.lu', departmentId: 'dept-dd', departmentName: '项目尽调组', role: '普通成员', status: '有效', color: 'blue' },
  { id: 'u-7', name: '苏沐言（演示）', account: 'demo.su', departmentId: 'dept-ic', departmentName: '投委会支持组', role: '普通成员', status: '有效', color: 'violet' },
  { id: 'u-8', name: '唐亦宁（演示）', account: 'demo.tang', departmentId: 'dept-energy', departmentName: '新能源研究', role: '普通成员', status: '有效', color: 'cyan' },
  { id: 'u-9', name: '顾明川（演示）', account: 'demo.gu', departmentId: 'dept-robotics', departmentName: '低空与机器人研究', role: '普通成员', status: '已停用', color: 'amber' },
];
