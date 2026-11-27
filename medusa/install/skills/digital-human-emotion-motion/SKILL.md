---
name: digital-human-emotion-motion
description: 制作、更新或验收 3D 数字人的喜怒哀乐、手势及表情动作。适用于 Blender 蒙皮角色、动漫桌宠、换手模后重做动作和 GLB 原生交付。
---

# 数字人情绪动作

先匹配角色最新版外形、手部母本、动作入口、目标观看尺寸、单次或循环模式。把网格、绑定、动作和正式状态分别取证。使用独立候选，并给每个动作留可单独转移的命名。

## 选用子技能

- 大幅舞蹈、庆祝和展开身体用 [$digital-human-emotion-joy](../digital-human-emotion-joy/SKILL.md)。
- 愠怒、威压和收拳用 [$digital-human-emotion-anger](../digital-human-emotion-anger/SKILL.md)。
- 垂眼、收肩和哀伤用 [$digital-human-emotion-sorrow](../digital-human-emotion-sorrow/SKILL.md)。
- 会心一笑、松弛与愉悦用 [$digital-human-emotion-delight](../digital-human-emotion-delight/SKILL.md)。

## 制作与验收

1. 手部需改型时，先给设计图中的两手掌背、掌侧和腕侧角度。确定掌长、MCP/PIP/DIP 段长比例、对掌、指腹厚度和甲缘。模型以角色正面及皮肤近景回验，记录画面左右对应的骨名。
2. 绑定完成后确认最终静止外形。任何只用于脸的形态键在手区的位移应为零。指甲沿皮肤弧面绘制或贴合，并随同一远指节权重运行。不要把静态屈指形变叠到实时逐关节屈指上。
3. 各动作维护共同待机起势和可调时间轴。先落主姿势，再做眼睑、眉、口角、手腕和各指关节，最后做头发、长袖、裙摆的迟滞与回弹。根据设计固定或记录根位移。重复播放和一次播放分别核对结束行为。
4. 文件交付至少含可编辑工程、命名动作 GLB、实际模型成片和校验。用真实引擎核对触发、峰值、结束、重播和由产品状态打断。区分原生候选、探针时间和正式安装。正式接入按项目发布负责人规定办理。

更换母本、处理 morph 所有权、检查穿插或复现已验证案例时，读 [绑定与桌宠交付](references/rig-and-runtime.md)。
