# Tile Link Classic

一个以 Chrome 扩展形式运行的纯本地复古连连看游戏。

当前 MVP 包含经典两次转弯以内消除规则、计时、得分、连击、提示、重排、难度设置和本地最高分记录。

## 目录结构

```text
.
├── manifest.json
├── src
│   ├── background
│   │   └── service-worker.js
│   ├── content
│   │   └── content-script.js
│   ├── game
│   │   ├── game.js
│   │   └── game.css
│   ├── options
│   │   ├── options.html
│   │   ├── options.js
│   │   └── options.css
│   ├── popup
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   └── shared
│       ├── constants.js
│       └── storage.js
└── .gitignore
```

## 本地运行

### Chrome 扩展

1. 打开 `chrome://extensions/`。
2. 开启右上角“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择本项目根目录。
5. 点击浏览器工具栏中的扩展图标，在 Chrome popup 中开始游戏。

### 网页预览

线上预览：<https://tile-link-classic.vercel.app/>

```sh
python3 -m http.server 4180 --bind 127.0.0.1
```

然后打开 `http://127.0.0.1:4180/`。

## 开发说明

- 这是无构建工具版本，源码直接被 Chrome 加载。
- 根目录 `index.html` 是网页预览入口，可作为静态站点部署到 Vercel。
- 游戏主循环在 `src/game/game.js`。
- 游戏弹窗入口在 `src/popup/popup.html`，由 `manifest.json` 的 `action.default_popup` 直接打开。
- 配置页入口在 `src/options/options.html`。
- 持久化封装在 `src/shared/storage.js`：扩展环境使用 `chrome.storage.local`，网页环境自动回退到 `localStorage`。
- `src/content/content-script.js` 是预留的页面注入入口；默认未在 `manifest.json` 注册，避免扩展安装时申请不必要的站点权限。
- 游戏不请求网站访问权限，不发送网络请求，不收集或上传用户数据；隐私说明见 `PRIVACY.md`。

## 素材来源

- 默认牌面位于 `src/assets/tiles/generated-image2/`，由图像生成模型生成后切分为 20 个本地 PNG。
- 扩展图标位于 `src/assets/icons/`，由图像生成模型生成母版后切分为 `16/32/48/128` 图标和 Chrome Web Store 用 `store-icon-128.png`。
- 牌面 SVG 来自 [Google Noto Emoji](https://github.com/googlefonts/noto-emoji)，本地副本位于 `src/assets/tiles/noto-emoji/`。
- Noto Emoji 许可文件保留在 `src/assets/tiles/noto-emoji/LICENSE`。

后续如果需要 TypeScript、Vite、资源打包、像素字体或 spritesheet 管线，可以在这个结构上继续扩展。
