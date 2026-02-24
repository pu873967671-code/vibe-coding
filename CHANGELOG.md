# 更新日志

## 2026-02-24 - 头像分层动画 + 手机陀螺仪支持

### 🎨 主要功能
- **5层头像分离动画**
  - 背景层 (z-index: 1) - 蓝紫粉渐变，固定不动
  - 眼白层 (z-index: 2) - 跟随头移动
  - 眼珠层 (z-index: 3) - 小幅移动（1.2 / 0.8）
  - 头层 (z-index: 4) - 位移 + 3D旋转（1 / 0.6）
  - 手层 (z-index: 5) - 中等移动（1.8 / 1.2）

- **视觉效果**
  - 圆框裁剪 (border-radius: 50%)
  - 蓝紫色光晕呼吸效果
  - 打字机标题动画
  - 粒子背景系统
  - 卡片入场动画 + ripple 效果

- **交互功能**
  - 鼠标跟随效果（PC端）
  - 手机陀螺仪支持（移动端）
  - Ctrl+K 搜索快捷键

### 📱 技术实现
- 纯 CSS3 + JavaScript
- 5个独立PNG图层叠加
- requestAnimationFrame 流畅动画
- deviceorientation API 支持手机倾斜

### 🔗 预览地址
- GitHub Pages: https://pu873967671-code.github.io/vibe-coding/
- 仓库: https://github.com/pu873967671-code/vibe-coding

### 🎭 分工
- **肥婆**: 验证效果、提供建议
- **弟弟**: 实现代码、调整细节
- **Boss**: 提供需求、测试反馈
