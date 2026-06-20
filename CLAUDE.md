# PDF Merge — AI 协作规则

> 纯前端 PDF 合并工具，GitHub Pages 部署。
> 最后同步：2026-06-20

## 项目概述

将 PDF/DOCX/图片 合并为一份 PDF，支持缩略图拖拽排序页面。

## 边界规则

- **纯前端**：所有逻辑在浏览器运行，无后端。不要引入 Node.js 服务端依赖。
- **CDN 依赖**：pdf.js / pdf-lib / SortableJS / mammoth.js 通过 CDN 加载，不本地打包。
- **仅支持格式**：PDF、DOCX、JPG、JPEG、PNG。`.doc` (OLE2) 不支持。
- **DOCX 渲染**：使用 mammoth.js 转 HTML 后用 canvas 截图转为 PDF 页面——质量有限，仅适用于以文字为主的文档。
- **中英环境**：中文界面 + 系统字体栈，不使用 Web Font。
- **设计系统**：Frost (霜) 主题，所有颜色从 CSS 变量取值，不写硬编码颜色。

## 项目结构

```
├── index.html              # SPA 入口
├── css/style.css           # Frost 主题样式
├── js/
│   ├── app.js              # 主控制器
│   ├── ui.js               # Toast + DOM 工具
│   ├── file-handler.js     # 文件拖拽/选择/格式检测
│   ├── pdf-engine.js       # PDF 导入/合并/导出/缩略图
│   └── thumbnail-view.js   # 缩略图网格 + 拖拽排序
├── docs/ARCHITECTURE.md    # 架构说明
├── README.md
└── .github/workflows/deploy.yml
```

## 深入文档

| 文档 | 内容 |
|------|------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 完整架构、数据流、模块依赖 |

## 命令速查

```sh
# 本地预览
npx serve .              # 或 python -m http.server 8080

# 部署到 GitHub Pages (main 分支)
git push origin main
```

## 环境变量

无。纯静态文件。
