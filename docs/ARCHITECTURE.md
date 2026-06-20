# ARCHITECTURE — PDF Merge

## 数据流

```
User drags files
       │
       ▼
  FileHandler.handleFiles()
       │
       ├─ .pdf  → PDFEngine.importFile() → pdf-lib parse → pages[]
       ├─ .docx → PDFEngine.importFile() → mammoth → HTML → Canvas → pages[]
       └─ .jpg  → PDFEngine.importFile() → Canvas → pages[]
       │
       ▼
  App.onFilesChanged()
       │
       ▼
  ThumbnailView.refresh()
       │  ┌─ pdf.js 渲染每个 page 为 canvas 缩略图
       │  ├─ 插入 DOM 网格
       │  └─ SortableJS 绑定拖拽
       │
  [User drags to reorder]
       │
       ▼
  Sortable.onEnd → PDFEngine.reorderPages(idOrder)
       │
  [User clicks 导出 PDF]
       │
       ▼
  PDFEngine.exportPDF()
       │  ┌─ 创建新 PDFDoc
       │  ├─ 按 pages[] 顺序 copyPages
       │  └─ 下载 Blob
```

## 模块依赖

```
app.js
  ├── ui.js            (Toast, DOM refs, 状态切换)
  ├── file-handler.js  (文件事件, 格式检测)
  │     └── pdf-engine.js
  ├── thumbnail-view.js (缩略图网格, SortableJS)
  │     └── pdf-engine.js
  └── pdf-engine.js    (PDF 核心)
        ├── pdf-lib (CDN)
        ├── pdf.js  (CDN)
        └── mammoth  (CDN)
```

## 核心数据结构

```js
// 全局页面列表 (pdf-engine.js 内部)
pages = [
  {
    id: Number,          // 唯一 ID
    sourceType: 'pdf' | 'image' | 'docx',
    sourceFileId: String, // 原始文件名
    sourceFile: File,    // 浏览器 File 对象
    pageIndex: Number,   // 在源文件中的页码
    srcDoc: PDFDocument, // pdf-lib PDFDocument ref
    pdfPage: PDFPage,    // pdf-lib PDFPage ref
    width: Number,       // pt
    height: Number,      // pt
    pdfJsDoc: PDFDocumentProxy, // pdf.js doc ref (仅 PDF)
    imgData: { src, w, h },     // (仅 image)
  }
]
```

## 样式系统

Frost (霜) 主题 — 见 `css/style.css` 顶部 token 定义。

- 通过 CSS 变量控制全部配色
- 间距代替可见分割线
- 纸张缩略图是唯一视觉焦点

## 部署

GitHub Pages，静态文件直接从根目录托管。

`.github/workflows/deploy.yml`:
- 触发：push 到 main
- 动作：deploy 到 GitHub Pages
- 注意：需在 repo Settings → Pages 启用，source 设为 GitHub Actions
