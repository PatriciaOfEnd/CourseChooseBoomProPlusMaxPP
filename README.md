# 🔫 CourseChooseBoom

> 西电选课系统抢课脚本 — 打开页面即用，课程配置自动保存

[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![version](https://img.shields.io/badge/version-1.1-blue)](grab.user.js)
[![platform](https://img.shields.io/badge/platform-Tampermonkey-orange)](https://www.tampermonkey.net/)
[![target](https://img.shields.io/badge/target-xk.xidian.edu.cn-blue)](https://xk.xidian.edu.cn/)

---

## ✨ 特性

- **课程搜索** — 输入关键词搜课程，显示所有教学班（教师/时间/余量），点选加入
- **多教学班支持** — 同课程多时段自动识别，可选指定班或全试
- **多课程逐门抢** — 按优先级排队，一门成功后自动切下一门
- **真实验证** — 提交选课后查已选列表确认，不会被"已进入队列"骗
- **智能退避** — 服务器崩了自动减速，恢复正常自动加速
- **配置持久化** — 课程列表按学期（batchId）独立存储，换学期不混乱
- **拖拽排序** — 调优先级直接拖
- **提示音 + 页面弹窗** — 抢到了立马知道
- **零依赖** — 直接复用页面已有的登录态，不需要输密码

---

## 🚀 安装

### 1. 安装 Tampermonkey

[https://www.tampermonkey.net/](https://www.tampermonkey.net/) → 选你的浏览器版本安装

### 2. 导入脚本

1. 点浏览器右上角 Tampermonkey 图标 → **创建新脚本**
2. 全选删除，把 [`grab.user.js`](grab.user.js) 的内容粘贴进去
3. `Ctrl + S` 保存

### 3. 添加课程

打开选课页面，右下角会出现面板：

- 输入关键词 → 点 **🔍 搜索**，看到所有教学班
- 点 **+添加** 选具体班，或直接回车添加"任意班"
- 拖拽调整优先级
- 课程列表自动保存

### 4. 开始抢课

点 **▶ 开始抢课**，完事。

---

## 🔧 工作原理

选课系统的前端是 Vue + Element UI。脚本复用页面已有的 `axios` 实例（自带登录 Token），直接调用后端 API：

```javascript
// 搜索课程
POST /elective/clazz/list   → { KEY: "24TS2244", teachingClassType: "XGKC" }

// 提交选课
POST /elective/clazz/add    → { clazzType: "XGKC", clazzId, secretVal }

// 验证选课结果
POST /elective/clazz/list   → { teachingClassType: "YXKC" }
```

只在浏览器本地运行，不经过第三方服务器。

---

## 🛡️ 抢课流程

```text
搜索课程 → 找到 N 个教学班
              ↓
         按 JXBID 筛选（指定班）或全部遍历（任意班）
              ↓
         逐个提交选课 → 进入队列
              ↓ 等 1s
         查已选列表 ─ 有？→ ✅ 真正成功，切下一门
              ↓ 没有
         等 1s 重查（最多 4 次）
              ↓ 还是没有
         ❌ 试下一个班 / 全部失败后重试

连续失败 → 间隔自动翻倍 (用户配置间隔 × 2ⁿ，上限 5s)
任意成功 → 间隔重置
```

---

## 📁 项目结构

```text
CourseChooseBoom/
├── README.md
├── LICENSE
├── package.json              npm 元数据
├── eslint.config.js          ESLint 配置
├── .prettierrc               Prettier 配置
├── .editorconfig             编辑器配置
├── .gitignore
└── grab.user.js              ← 唯一脚本
```

---

## 🛠 开发

```bash
pnpm install             # 安装 ESLint + Prettier
pnpm lint                # 检查代码
pnpm format              # 自动格式化
pnpm check               # 格式 + 检查一起跑
```

---

## ❓ FAQ

**Q: 会不会被封号？**
A: 不会。所有请求和你手动操作完全一样，只是快了亿点。

**Q: 换学期了还能用吗？**
A: 能。脚本匹配 `xk.xidian.edu.cn/xsxk/elective/grablessons*`，batchId 自动适配。

**Q: 支持其他类型的课吗？**
A: 目前支持通识教育选修课（XGKC）。改 `teachingClassType` 参数可扩展。

**Q: 面板挡住了怎么办？**
A: 拖标题栏移动 / 点 `−` 最小化 / 点 `×` 关闭（关闭后右下角 🔫 按钮恢复）。

---

## ⚠️ 免责声明

本工具仅供学习交流。使用本工具产生的任何后果由使用者自行承担。

---

## 📄 License

[MIT](LICENSE)
