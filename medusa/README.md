# 美杜莎·数字人

网站展示全屋智能家居桌面助理美杜莎 V3 的真实三维角色、七段完整的实模动作录屏，以及两套 Codex 技能。

## 预览与更新

从站点根目录运行 `python3 -m http.server 8080` 后打开本机预览。GitHub Pages 从 `main` 根目录发布，同一提交包含首页、样式、播放脚本、媒体和安装包。

`assets/medusa/` 内含舞台角色 GLB、七段动作 MP4 和对应的 WebP 封面。录屏取自本站浏览器舞台，保留动作前后的待机画面，逐条核验触发、完整播放和返回待机。

首页首屏下方使用独立 3D 舞台，顶部聚光照亮角色与三维莲花座，接近视口后加载 `assets/medusa/stage.glb`。模型与全屋智能家居 0.11.28（构建 248）的美杜莎桌宠同源。舞台支持拖动和方向键旋转，滚轮、双指和按钮缩放。可点播喜怒哀乐、沉思、打招呼、打瞌睡，播完回到待机。运行 `npm ci` 和 `npm run build:hero` 可重建查看器。Three.js 采用 [MIT 许可](assets/THREE-LICENSE.txt)。

## 技能安装

- 数字人建模在 `install-modeling/`，安装后调用 `$ai-digital-human-modeling`。
- 数字人情绪动作在 `install/`，内含总技能与四个情绪子技能，安装后调用 `$digital-human-emotion-motion`。

在 macOS 解压需要的 ZIP 后，打开其中的 `install.command`。修改技能源码时同步重建相应 ZIP，并校验解压安装与网页下载内容。

## 版权与来源

美杜莎（彩鳞）为《斗破苍穹》角色，角色及模型权利归各自权利人。原模型由「曾经的曾经」上传至 [知末，模型编号 1178568587](https://3d.znzmo.com/3dmoxing/1178568587.html)。网站使用的美杜莎 3D 模型、图像和录屏仅供非商用展示。Three.js 许可适用于查看器代码。技能安装包包含通用方法与安装脚本。

`Feifei Serif` 由 Adobe Source Han Serif CN Bold 字形制作网页子集，已重新命名，遵循 [SIL Open Font License 1.1](assets/OFL-Source-Han-Serif.txt)。
