# LensView 👓

基于 MediaPipe FaceMesh 和 Three.js 的实时虚拟眼镜试戴应用。通过摄像头实时捕捉人脸特征点，在面部精准叠加 3D 眼镜模型，实现沉浸式的在线试戴体验。

## ✨ 功能特性

- 🎥 **实时人脸追踪** — 基于 MediaPipe FaceMesh 的实时面部特征点检测
- 🕶️ **3D 眼镜渲染** — 使用 Three.js 在面部精准叠加 GLTF 格式的 3D 眼镜模型
- 📷 **摄像头 / 视频切换** — 支持实时摄像头和本地视频两种输入源
- 🎨 **多款式切换** — 内置 3 款预设眼镜样式，一键切换
- 📤 **自定义模型** — 支持上传自定义 GLTF/GLB 眼镜模型
- 🔧 **位置微调** — 提供上下左右方向调节和一键重置功能
- 📸 **截屏对比** — 截取试戴效果并加入对比栏，方便多款式横向比较
- 📱 **响应式设计** — 适配桌面端和移动端，Duolingo 风格 UI

## 🛠️ 技术栈

| 技术 | 版本 | 说明 |
|:---:|:---:|:---:|
| React | 18.x | UI 框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 6.x | 构建工具与开发服务器 |
| Three.js | 0.174 | 3D 渲染引擎 |
| MediaPipe FaceMesh | 0.4 | 面部特征点检测 |
| Lucide React | 0.344 | 图标库 |

## 📁 项目结构

```
LensView/
├── public/
│   ├── asserts/
│   │   ├── fonts/          # Nunito 字体文件
│   │   └── glasses/        # 眼镜 3D 模型 (g1, g2, g3)
│   ├── mediapipe/          # MediaPipe WASM 资源
│   └── video/              # 示例视频文件
├── src/
│   ├── components/         # React 组件
│   │   ├── Header.tsx          # 顶部导航栏
│   │   ├── VideoSection.tsx    # 视频/摄像头画面区域
│   │   ├── ModelSelector.tsx   # 眼镜款式选择器
│   │   ├── ComparisonSection.tsx # 截屏对比区域
│   │   ├── ComparisonModal.tsx # 对比放大弹窗
│   │   ├── LoadingOverlay.tsx  # 加载遮罩
│   │   └── Toast.tsx           # 消息提示
│   ├── core/               # 核心模块
│   │   ├── facemesh/           # FaceMesh 封装
│   │   ├── frame-provider/     # 视频帧提供者(摄像头/视频)
│   │   └── scene/              # Three.js 场景管理
│   │       ├── SceneManager.ts     # 场景管理器
│   │       ├── Glasses.ts          # 眼镜模型控制
│   │       ├── VideoBackground.ts  # 视频背景渲染
│   │       └── Environment.ts      # 场景环境光照
│   ├── hooks/              # React Hooks
│   │   ├── useSceneManager.ts  # 场景管理 Hook
│   │   ├── useVideoSource.ts   # 视频源管理 Hook
│   │   ├── useModels.ts        # 模型管理 Hook
│   │   ├── useComparison.ts    # 截屏对比 Hook
│   │   └── useToast.ts         # 消息提示 Hook
│   ├── styles/
│   │   └── index.css           # 全局样式 (Duolingo 风格)
│   ├── App.tsx             # 应用根组件
│   └── main.tsx            # 入口文件
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- npm 或 yarn

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/your-username/LensView.git
cd LensView

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:5173` 打开应用。首次打开时，浏览器会请求摄像头权限。

### 构建生产版本

```bash
npm run build
npm run preview
```

## 🕶️ 自定义眼镜模型

支持导入 GLTF / GLB 格式的 3D 眼镜模型。确保模型的朝向正确：

- **俯视图 (Top View)** — 镜腿朝向 Y 轴负方向
- **正视图 (Front View)** — 镜片面朝 Z 轴正方向

可以使用 [Three.js Editor](https://threejs.org/editor/) 或 [glTF Viewer](https://gltf-viewer.donmccurdy.com/) 检查和调整模型朝向。

要添加预设模型，在 `public/asserts/glasses/` 目录下创建新文件夹，放入 `scene.gltf` 文件，然后在 `src/hooks/useModels.ts` 中注册。

## ⚠️ 已知限制

- MediaPipe FaceMesh 的 JavaScript 版本不支持 Face Transform Module，无法提供精确的深度 (Z 轴) 坐标，因此使用透视相机时 3D 效果可能不够理想。默认使用正交相机以获得最佳视觉效果。

## 📜 许可证

MIT License
