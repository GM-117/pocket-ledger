# iOS 真机部署方案（无 Xcode / 无开发者账号情境）

> 更新时间：2026-09-12
> 背景：项目为纯前端 PWA（React + Vite + Zustand），已具备 PWA 基础能力（manifest / 图标 / Service Worker / iOS meta 标签），目标是在不购买 Apple 开发者账号（99 美元/年）且未安装 Xcode 的前提下，让项目跑在 iOS 手机上，并交付给另一个用户使用，同时保留浏览器访问能力。

## 一、先说结论

**当前约束下唯一可行且零成本的路径：把 PWA 部署到免费 HTTPS 托管平台，对方用 Safari「添加到主屏幕」安装。**

原因：Capacitor 打包原生 App 有两个硬性前置条件，当前都不满足——

| 条件 | 现状 | 说明 |
|---|---|---|
| Xcode | 未安装 | 编译 iOS 壳工程生成 .ipa 必须有 Xcode（仅 macOS 提供且体积约 10+ GB） |
| Apple 开发者账号 | 无（连免费的也没注册过） | 任何 App 装上真机都必须签名；免费个人签名也需要 Xcode 配合 Apple ID 完成 |

云端打包服务（GitHub Actions / Codemagic 等）只解决"没有 Mac"的问题，解决不了"没有签名证书"的问题，所以绕不过去。

而 PWA 路线对方安装时**不需要任何 Apple ID、不需要信任企业证书、不需要电脑**，一条链接即装，且项目代码已 100% 复用，浏览器访问能力天然保留（部署的网站本身就是浏览器可访问的）。

## 二、三条路线对比

| 路线 | 成本 | 对方安装体验 | 主要限制 | 结论 |
|---|---|---|---|---|
| **PWA + HTTPS 托管** | 0 元 | Safari 开链接 → 添加到主屏幕，全屏运行有图标 | 数据存浏览器存储；无 App Store 身份 | ✅ 当前采用 |
| 免费 Apple ID 自签 | 0 元，但需装 Xcode | 可真机跑原生壳 | 签名 7 天过期需电脑重签，且一次最多 3 个 App，无法交给别人长期用 | ❌ 只适合自己短期验证 |
| 付费开发者账号 + Capacitor | 99 美元/年 + 装 Xcode | TestFlight 分发（对方装 TestFlight App 后一键安装）或上架 App Store | 需要 Mac 和账号 | 📌 未来升级路线 |

顺带一提：AltStore / Sideloadly 等侧载工具可以用免费 Apple ID 签名且不依赖 Xcode，但同样有 7 天过期问题，让另一个用户配合重签不现实，不建议。

## 三、阶段 1：HTTPS 部署（核心任务，约 30 分钟）

### 平台选型（2026-09 调研结论）

选型的决定性因素是**国内可直连**（你和对方用户都在国内，默认域名被墙的平台等于白部署）：

| 平台 | 免费额度 | 国内直连 | 结论 |
|---|---|---|---|
| **腾讯 EdgeOne Pages** | 免费版够个人使用 | ✅ 默认域名 `*.edgeone.app` 国内节点直连 | ✅ **首选** |
| Cloudflare Pages | 免费 | ❌ `*.pages.dev` 被 DNS 污染，需另买域名绑定 | 备选（有自定义域名时） |
| Vercel / Netlify | 免费 | ❌ 默认域名同样被污染 | 不选 |
| GitHub Pages | 免费 | ⚠️ `github.io` 时通时断 | 不选 |

EdgeOne Pages 附带优势：腾讯云账号（微信扫码）即可登录，对国内用户注册成本最低；全球 3200+ 边缘节点；支持连接 GitHub 仓库实现 push 自动部署。

### 执行步骤

**方式 A：Git 连接自动部署（推荐，一次配置长期自动更新）**

1. 构建：本地 `npm run build` 确认通过（已验证）
2. 登录 [EdgeOne Pages 控制台](https://pages.edgeone.ai/zh)（微信扫码）
3. 创建项目 → 连接 GitHub → 授权并选择 `GM-117/pocket-ledger` 仓库
4. 构建配置：构建命令 `npm run build`，输出目录 `dist`
5. 部署完成后获得 `https://<项目名>.edgeone.app` 域名
6. 之后每次 `git push` 到 main 自动重新部署，手机刷新即得新版

**方式 B：Pages Drop 拖拽部署（5 分钟先拿到链接验证）**

把 `dist/` 目录直接拖进控制台即得线上地址。缺点是每次更新需手动重新拖，适合先快速验证真机体验，确认后再切方式 A。

### 部署后验证清单

- [ ] HTTPS 域名手机蜂窝网络（关 Wi-Fi）可打开 —— 验证国内直连
- [ ] Service Worker 注册成功，主屏幕 App 断网可打开
- [ ] iPhone Safari「添加到主屏幕」→ 图标、全屏、启动画面正常（真机验收）
- [ ] 桌面浏览器访问同一域名正常 —— 验证浏览器版保留
- [ ] 记一笔账 → 刷新页面数据还在（验证 HTTPS 环境下 localStorage 正常）

**给对方用户的交付说明**（可直接转发）：

> 用 iPhone 自带的 Safari 打开网址 → 点底部中间「分享」按钮 → 选「添加到主屏幕」→ 确认。桌面出现「口袋记账」图标，从图标打开即为全屏 App。数据保存在你自己手机里，App 内「资产 → 数据管理」可导出 JSON 备份。

## 四、阶段 2：数据安全增强（建议随后做，工作量 0.5~1 天）

原生 App 的数据不受浏览器清理影响，PWA 会。为对方用户补两道保险：

1. **低优先，纯提示**：检测到账目较多且从未导出时，弹一次性提醒引导去「数据管理」导出备份
2. **推荐，按 Roadmap 第四批提前实现**：**WebDAV 云同步**（坚果云国内可用、免费额度足够），记账数据自动上云，浏览器缓存被清也能一键恢复。这是 PWA 路线数据安全性的最终解
3. **可选**：首次打开时展示「安装引导页」（识别 iOS Safari 时提示添加到主屏幕），降低对方的上手成本

## 五、阶段 3：未来升级原生 App 的路线（条件具备时）

触发条件：愿意装 Xcode 且注册付费开发者账号（或先注册免费 Apple ID 自用验证）。

届时接入 Capacitor 的大致步骤（预估 1~2 天，其中存储适配是唯一改代码的点）：

1. `npm i @capacitor/core @capacitor/ios` + `npx cap init`
2. **存储适配**：把 `src/store.ts` 中 zustand persist 的 storage 从 localStorage 换成 Capacitor Preferences 适配器（建议届时先把 storage 访问抽象成单例，Web 端继续用 localStorage，iOS 端走原生存储，一份代码两端跑）
3. `npx cap add ios` → 准备图标启动屏（现有 PWA 图标可复用，需补 1024 尺寸）→ Xcode 真机运行
4. 分发：TestFlight（对方装 TestFlight 后一键安装，无需 MAC）或上架 App Store
5. 数据迁移：App 内先从 PWA 版导出 JSON 再导入（导出/导入功能已具备）

现有 PWA 资产（manifest、图标、meta 标签）在 Capacitor 中全部可复用，此前的投入不会浪费。

## 六、决策清单

- [x] 阶段 0：PWA 基础能力（已完成，见 README「真机预览」章节）
- [ ] 阶段 1：Cloudflare Pages 部署，拿到 HTTPS 域名交付对方
- [ ] 阶段 2：WebDAV 同步 / 导出提醒 / 安装引导（可选按需）
- [ ] 阶段 3：Xcode + 付费账号就绪后接 Capacitor（远期）
