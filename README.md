# Castor

跨平台 AI Agent，通过飞书机器人交互的通用助理。具备文件操作、脚本执行、网络搜索能力，遇到现有工具无法解决的问题时会自行编写临时脚本完成任务。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入必要配置：

```env
# LLM（必填）
LLM_API_KEY=sk-xxx
LLM_BASEURL=https://api.openai.com/v1
LLM_MODEL_NAME=gpt-4o

# 飞书（bot 模式必填）
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=xxx
```

#### 完整配置说明

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `LLM_API_KEY` | 是 | - | LLM API 密钥 |
| `LLM_BASEURL` | 是 | - | API 地址（兼容 OpenAI 协议的任意服务） |
| `LLM_MODEL_NAME` | 是 | - | 模型名称 |
| `LLM_PROTOCOL` | 否 | 自动检测 | `openai` 或 `anthropic`，不填则根据 URL/模型名自动判断 |
| `LLM_MAX_TOKENS` | 否 | 不限 | 最大输出 token 数，不设则由模型上下文窗口决定 |
| `FEISHU_APP_ID` | bot 模式 | - | 飞书应用 App ID |
| `FEISHU_APP_SECRET` | bot 模式 | - | 飞书应用 App Secret |
| `WEB_SEARCH_PROVIDER` | 否 | - | 搜索引擎提供商（目前支持 `tavily`） |
| `WEB_SEARCH_API_KEY` | 否 | - | 搜索 API 密钥 |
| `DATA_DIR` | 否 | `./data` | 数据存储目录 |
| `WORKSPACE_DIR` | 否 | - | 工作目录，设置后文件操作受限于此目录 |
| `SCRIPT_TIMEOUT` | 否 | 30000 | 脚本执行超时（毫秒） |
| `MAX_CONVERSATION_MESSAGES` | 否 | 不限 | 单会话最大保留消息数，不设则保留全部历史 |

### 3. 启动

**本地 CLI 模式（开发调试）：**

```bash
npm run dev
```

启动后在终端直接输入消息与 Agent 对话。

**飞书 Bot 模式（生产）：**

```bash
npm run start
```

通过飞书给机器人发消息即可交互。

## 飞书应用配置

1. 前往 [飞书开放平台](https://open.feishu.cn/app) 创建应用
2. 开启 **机器人** 能力
3. 添加权限：
   - `im:message` — 接收和发送消息
   - `im:message.reaction:write` — 添加/删除表情回复
4. 在「事件订阅」中添加 `im.message.receive_v1` 事件
5. 选择 **WebSocket 长连接** 模式（无需公网 IP）
6. 发布应用版本并审批通过
7. 将 App ID 和 App Secret 填入 `.env`

## 功能

### 内置工具

| 工具 | 能力 |
|------|------|
| `file_ops` | 文件读写、目录列表、glob 搜索 |
| `script_exec` | 执行 shell 命令 |
| `web_search` | 网络搜索（需配置 Tavily API） |
| `dynamic_script` | 动态编写并执行 Python/Node/Bash/PowerShell 脚本 |

### 对话命令

| 命令 | 说明 |
|------|------|
| `/reset` | 清空当前会话历史 |

### 特性

- **自动协议检测** — 自动识别 OpenAI 和 Anthropic 协议
- **语境 Reaction** — 收到消息立即添加符合语境的 emoji 表情（搜索🔍、代码💻、写作✍️ 等），回复后移除
- **富文本回复** — 代码块、加粗、链接在飞书中正确渲染
- **长消息分割** — 超长回复自动拆分为多条消息
- **并发安全** — 同一会话的消息排队处理
- **自动重试** — LLM 调用失败自动重试 3 次（指数退避）
- **Workspace 访问控制** — 配置 `WORKSPACE_DIR` 后，访问外部文件需用户确认

## 项目结构

```
src/
├── index.ts              # 启动入口
├── config.ts             # 配置加载（zod 校验）
├── logger.ts             # 日志（pino）
├── llm/                  # LLM 抽象层
│   ├── types.ts          # 统一消息/工具类型
│   ├── client.ts         # 工厂函数
│   ├── openai-adapter.ts
│   └── anthropic-adapter.ts
├── agent/                # Agent 核心
│   ├── agent.ts          # 主循环（最多 10 轮工具调用）
│   └── prompt.ts         # 系统提示词
├── tools/                # 工具系统
│   ├── registry.ts       # 注册表 + 执行引擎
│   ├── file-ops.ts
│   ├── script-exec.ts
│   ├── web-search.ts
│   └── dynamic-script.ts
├── memory/               # 对话存储
│   └── json-store.ts     # JSON 文件持久化
├── transport/            # 通信层
│   ├── cli.ts            # CLI 交互
│   └── feishu-bot.ts     # 飞书 WebSocket
└── utils/
    ├── platform.ts       # 跨平台 shell 检测
    ├── retry.ts          # 重试逻辑
    ├── mutex.ts          # 并发锁
    ├── emoji-picker.ts   # 语境 emoji 选择
    ├── message-split.ts  # 消息分割
    ├── feishu-rich-text.ts # Markdown → 飞书富文本
    └── path-guard.ts     # 路径访问控制
```

## 开发

```bash
npm run dev          # CLI 模式 + 文件监听热重载
npm run test         # 运行测试
npx tsc --noEmit     # 类型检查
```

## License

MIT
