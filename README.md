# Learn English

一个面向英语学习的 Web 项目，当前已完成「小学 · 学习模式」的首版功能，并支持本地运行与 GitHub Pages 部署。

在线体验：<https://xingzhuipingye.github.io/Learn-English/>

## 功能概览

- 学段菜单：小学、初中、高中、大学、托福、雅思（当前小学可用）
- 模式菜单：学习模式、听力模式（当前学习模式可用）
- 学习模式核心流程：
  - 短文按 `句子 -> 词组 -> 单词` 组织
  - 用户按键逐字输入当前单词
  - 输入实时判定：正确绿色、错误红色
  - 当前词组完成后触发庆祝特效（Congratulations）
  - 支持英文语音朗读（TTS）

## 输入与判定规则

- 忽略大小写：`A` 与 `a` 视为一致
- 忽略标点：如课文中的 `today.`，输入 `today` 也判定正确
- 展示保留用户真实按键大小写（不强制转大写/小写）

## 读音设置

学习页右上角支持：

- 间隔（0.8s / 1.0s / 1.2s / 1.5s / 2.0s）
- 读速（慢 / 中 / 快）

说明：

- 朗读次数当前固定为 3 次
- 点击「再听一遍」按当前间隔和读速生效

## 技术栈

- 前端：Vue 3 + TypeScript + Vite + Vue Router
- 数据：静态 JSON（`client/public/lessons`）
- 部署：GitHub Actions + GitHub Pages

## 项目结构

```text
learn-english/
├─ client/                      # 前端应用
│  ├─ public/
│  │  ├─ lessons/
│  │  │  ├─ index.json          # 课文目录
│  │  │  └─ primary-01.json     # 示例课文
│  └─ src/
│     ├─ views/
│     │  ├─ HomeView.vue
│     │  └─ PrimaryLearnView.vue
│     ├─ api/lessons.ts
│     └─ router/index.ts
├─ shared/types/lesson.ts       # 共用类型定义
└─ .github/workflows/
   └─ deploy-pages.yml          # 自动部署工作流
```

## 本地运行

```bash
cd client
npm install
npm run dev
```

默认地址：<http://localhost:5173>

## 课文数据格式

`client/public/lessons/primary-01.json` 示例：

```json
{
  "id": "primary-01",
  "module": "primary",
  "title": "A Sunny Day",
  "sentences": [
    {
      "id": "s1",
      "phrases": [
        {
          "id": "s1-p1",
          "text": "The sun is bright today.",
          "words": ["The", "sun", "is", "bright", "today."]
        }
      ]
    }
  ]
}
```

新增课文时：

1. 在 `client/public/lessons/` 新增 `xxx.json`
2. 在 `client/public/lessons/index.json` 中追加目录项

## GitHub Pages 部署

本项目已配置自动部署：

- 工作流：`.github/workflows/deploy-pages.yml`
- 触发条件：push 到 `main`
- 部署目标：GitHub Pages（Source: GitHub Actions）

## 当前进度与后续规划

已完成：

- 小学首页入口
- 小学学习模式（词组输入、判定、庆祝、TTS）
- 响应式布局（桌面/移动端）

规划中：

- 听力模式
- 初中/高中/大学/托福/雅思内容
- 更多课文与训练关卡
