# Castor

跨平台 AI Agent，通过飞书机器人交互的智能助理。可以帮你读写文件、执行命令、搜索网络、分析资料，遇到现有工具无法解决的问题时会自行编写脚本完成任务。

## 能做什么

- **日常问答** — 直接对话获取信息、翻译、写作、代码帮助
- **文件操作** — 读写文件、搜索目录、管理文档
- **命令执行** — 在服务器上运行 shell 命令
- **网络搜索** — 查询最新信息（需配置搜索 API）
- **私人知识库** — 将资料放入 `workspace/knowledge/` 目录，Agent 会自动查阅并结合资料回答问题
- **自动编程** — 当现有工具不足时，Agent 会编写临时脚本（Python/Node/Bash/PowerShell）解决问题

## 快速部署

### 1. 环境要求

- Node.js >= 18
- npm

### 2. 安装

```bash
git clone <repo-url> Castor
cd Castor
npm install
```

### 3. 配置

```bash
cp .env.example .env
```

编辑 `.env`，填入必要配置：

```env
# LLM（必填）— 支持任何 OpenAI/Anthropic 兼容 API
CASTOR_LLM_API_KEY=sk-xxx
CASTOR_LLM_BASEURL=https://api.example.com
CASTOR_LLM_MODEL_NAME=gpt-4o

# 飞书（bot 模式必填）
CASTOR_FEISHU_APP_ID=cli_xxx
CASTOR_FEISHU_APP_SECRET=xxx
```

> 所有变量以 `CASTOR_` 为前缀，避免与同机器其他项目冲突。

#### LLM 协议自动检测

无需手动指定协议。系统根据模型名自动判断：
- 模型名含 `claude` → 使用 Anthropic 协议（`{baseUrl}/anthropic/v1/messages`）
- 其他 → 使用 OpenAI 协议（`{baseUrl}/v1/chat/completions`）

`CASTOR_LLM_BASEURL` 填根地址即可（如 `https://api.example.com`），无需带 `/v1` 后缀。

#### 完整配置说明

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `CASTOR_LLM_API_KEY` | 是 | - | LLM API 密钥 |
| `CASTOR_LLM_BASEURL` | 是 | - | API 根地址 |
| `CASTOR_LLM_MODEL_NAME` | 是 | - | 模型名称 |
| `CASTOR_LLM_PROTOCOL` | 否 | 自动检测 | `openai` 或 `anthropic`，一般无需设置 |
| `CASTOR_LLM_MAX_TOKENS` | 否 | 不限 | 最大输出 token 数 |
| `CASTOR_FEISHU_APP_ID` | bot 模式 | - | 飞书应用 App ID |
| `CASTOR_FEISHU_APP_SECRET` | bot 模式 | - | 飞书应用 App Secret |
| `CASTOR_WEB_SEARCH_PROVIDER` | 否 | - | 搜索引擎（目前支持 `tavily`） |
| `CASTOR_WEB_SEARCH_API_KEY` | 否 | - | 搜索 API 密钥 |
| `CASTOR_DATA_DIR` | 否 | `./data` | 数据存储目录 |
| `CASTOR_WORKSPACE_DIR` | 否 | - | 工作目录，设置后文件操作受限于此目录 |
| `CASTOR_SCRIPT_TIMEOUT` | 否 | 30000 | 脚本执行超时（毫秒） |
| `CASTOR_MAX_CONVERSATION_MESSAGES` | 否 | 不限 | 单会话最大保留消息数 |

### 4. 飞书应用配置

1. 前往 [飞书开放平台](https://open.feishu.cn/app) 创建应用
2. 开启 **机器人** 能力
3. 添加权限：
   - `im:message` — 接收和发送消息
   - `im:message:receive_as_bot` — 以机器人身份接收单聊消息
   - `im:message.reaction:write` — 添加/删除表情回复
4. 在「事件订阅」中添加 `im.message.receive_v1` 事件
5. 选择 **WebSocket 长连接** 模式（无需公网 IP）
6. 发布应用版本并审批通过
7. 将 App ID 和 App Secret 填入 `.env`

### 5. 启动

**后台运行（推荐）：**

```bash
# Linux / macOS
./scripts/start.sh

# Windows
scripts\start.bat
```

**停止 / 重启：**

```bash
./scripts/stop.sh
./scripts/restart.sh
```

**前台运行（调试）：**

```bash
npm run start     # 飞书 bot 模式
npm run dev       # CLI 模式（终端交互 + 热重载）
```

## 使用方式

### 飞书交互

- **私聊** — 直接发消息给机器人，无需 @
- **群聊** — @机器人 + 消息内容

收到消息后机器人会显示「敲键盘」表情，回复后自动消失。回复会引用原消息。

### 对话命令

| 命令 | 说明 |
|------|------|
| `/reset` | 清空当前会话历史 |

### 知识库

将文件放入 `workspace/knowledge/` 目录即可：

```
workspace/knowledge/
├── 客户-张三.md
├── 项目-XX系统.md
└── 会议纪要-2024Q4.txt
```

之后在飞书中问"张三的联系方式"、"XX 系统的技术栈是什么"，Agent 会自动搜索并读取相关文件来回答。

支持格式：Markdown、TXT、JSON 等文本文件。

## 功能特性

| 特性 | 说明 |
|------|------|
| 双协议支持 | 自动适配 OpenAI 和 Anthropic API |
| 消息引用回复 | 回复关联到用户原始消息 |
| 富文本渲染 | 代码块、加粗、链接在飞书中正确显示 |
| 长消息分割 | 超长回复自动拆分为多条 |
| 并发安全 | 同一会话消息排队处理，不同会话互不阻塞 |
| 自动重试 | LLM 调用失败自动重试（指数退避） |
| 对话裁剪 | 配置上限后自动保留最近消息，避免超出 token 限制 |
| 文件访问控制 | 配置 workspace 后，访问外部文件需用户确认 |
| 持久化日志 | 日志写入文件，自动轮转（防止无限增长） |

### 内置工具

| 工具 | 能力 |
|------|------|
| `file_ops` | 文件读写、目录列表、glob 搜索 |
| `script_exec` | 执行 shell 命令 |
| `web_search` | 网络搜索（需配置 Tavily API） |
| `dynamic_script` | 动态编写并执行脚本 |

## 项目结构

```
Castor/
├── scripts/              # 启动/停止脚本
│   ├── start.sh / .bat
│   ├── stop.sh / .bat
│   └── restart.sh / .bat
├── workspace/
│   └── knowledge/        # 私人知识库（放入资料文件）
├── data/                 # 运行时数据（git-ignored）
│   ├── conversations/    # 对话历史
│   └── castor.log        # 日志文件
└── src/
    ├── index.ts          # 启动入口
    ├── config.ts         # 配置加载（zod 校验）
    ├── logger.ts         # 日志（pino + 文件轮转）
    ├── llm/              # LLM 抽象层
    │   ├── client.ts     # 工厂函数（自动选择适配器）
    │   ├── openai-adapter.ts
    │   └── anthropic-adapter.ts
    ├── agent/            # Agent 核心
    │   ├── agent.ts      # 主循环（最多 10 轮工具调用）
    │   └── prompt.ts     # 系统提示词
    ├── tools/            # 工具系统
    │   ├── registry.ts   # 注册表 + 执行引擎
    │   ├── file-ops.ts
    │   ├── script-exec.ts
    │   ├── web-search.ts
    │   └── dynamic-script.ts
    ├── memory/           # 对话存储
    │   └── json-store.ts
    ├── transport/        # 通信层
    │   ├── cli.ts        # CLI 交互
    │   └── feishu-bot.ts # 飞书 WebSocket
    └── utils/
        ├── platform.ts
        ├── retry.ts
        ├── mutex.ts
        ├── message-split.ts
        ├── feishu-rich-text.ts
        └── path-guard.ts
```

## 开发

```bash
npm run dev          # CLI 模式 + 热重载
npm run test         # 运行测试
npx tsc --noEmit     # 类型检查
```

## License

MIT
