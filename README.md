# Learn English

面向英语学习的 Web 项目，支持本地运行与 GitHub Pages 部署。

在线体验：<https://xingzhuipingye.github.io/Learn-English/>

## 功能概览

- 学段：小学、初中、高中；每学段按**人教版常见分册与单元**编排**12 章**（学习 + 听力各 12 课，共 72 条目录；范文为原创示例，非教材原文）
- **学习模式**：短文按「句子 → 词组 → 单词」组织，逐字输入、实时判定、庆祝与 TTS
- **听力模式**：句子朗读、挖空、四选一，逐题推进
- **用户登录**：演示用本地账号（`localStorage`，密码经 SHA-256 哈希；非生产级安全）
- **学习进度**：与当前登录用户绑定，学习模式按已完成词组数、听力模式按已完成题数；首页显示进度条

## 读音设置（学习页）

右上角可设间隔与读速；朗读次数当前固定为 3 次；「再听一遍」按当前设置生效。

## 技术栈

- 前端：Vue 3 + TypeScript + Vite + Vue Router
- 数据：静态 JSON（`client/public/lessons/`）
- 部署：GitHub Actions + GitHub Pages

## 项目结构（课文与代码）

```text
learn-english/
├─ client/
│  ├─ public/lessons/
│  │  ├─ index.json              # 课文目录（含 kind: learn | listening）
│  │  ├─ learn/                  # 学习模式课文，如 primary-01.json
│  │  └─ listen/                 # 听力模式课文，如 primary-l01.json
│  └─ src/
│     ├─ views/ HomeView, PrimaryLearnView, ListeningView, LoginView
│     ├─ composables/ auth.ts, progress.ts
│     ├─ api/lessons.ts
│     └─ router/index.ts
├─ shared/types/lesson.ts
└─ .github/workflows/deploy-pages.yml
```

## 本地运行

```bash
cd client
npm install
npm run dev
```

默认地址：<http://localhost:5173>。进入学习与听力页面前需先登录（可注册新账号）。

## 课文与目录

1. 学习课文放在 `client/public/lessons/learn/<id>.json`，听力放在 `client/public/lessons/listen/<id>.json`。
2. `index.json` 中每条含 `chapter`（如「三上 Unit 1」）、`order`（章节顺序）、`kind`、`module`、`title` 等；听力需 `items` 与四选一结构，详见 `shared/types/lesson.ts`。
3. 课文可含 `textbook`、`chapter` 字段；首页与学习/听力页会展示章节与说明。
4. **批量生成**：在仓库根目录执行 `npm run generate-lessons`（或 `node scripts/generate-textbook-lessons.mjs`），会根据 `scripts/curriculum/*.mjs` 中的章节数据重写 `client/public/lessons/` 下全部课文与 `index.json`。修改范文时请改课程数据后重新运行该命令。

## GitHub Pages 部署

- 工作流：`.github/workflows/deploy-pages.yml`
- 触发：`push` 到 `main`
- 部署源：GitHub Actions
