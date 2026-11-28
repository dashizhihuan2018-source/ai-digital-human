数字人技能套装 · Codex 公开版 V1.0.0

在 macOS 解压整个 ZIP，双击 install.command。
也可在解压目录运行 bash install.command。
如果当前 Codex 对话未显示新增技能，请开一个新对话。

主技能
  $ai-digital-human-modeling

五个分技能
  $digital-human-appearance
  $digital-human-rigging
  $digital-human-emotion-motion
  $private-assistant-character
  $digital-human-delivery

默认安装到 ~/.codex/skills。设置 CODEX_HOME 时使用该目录。
安装器识别官网此前发布的三套 V1.0.0 技能，会先将其备份到技能目录旁。
自定义或其他同名版本将原样保留。可用 bash install.command --dest <独立目录> 安装到其他位置。
使用独立 Codex 环境时，可把 CODEX_HOME 指向该环境的根目录，再在该根目录的 skills 中安装。

这是可公开的工作流与案例。需要自备可用于相应用途的参考、声源、模型和目标宿主。
