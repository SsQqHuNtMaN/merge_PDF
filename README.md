# PDF Merge — 文档合并与排序

将 PDF、Word (DOCX)、图片 (JPG/PNG) 合并为一份 PDF，并支持可视化拖拽调整页面顺序。

## 使用方式

### 在线使用
访问 **[GitHub Pages URL]**，直接拖入文件即可。

### 本地使用
```sh
git clone <repo>
cd Merge_PDF
npx serve .          # 或 python -m http.server 8080
# 浏览器打开 http://localhost:3000
```

## 功能

- **合并**：拖入多个 PDF / DOCX / 图片文件，自动提取所有页面
- **排序**：缩略图网格中鼠标拖拽即可调换页面顺序
- **缩放**：滑块调整缩略图大小 (80%–250%)
- **删除**：悬停缩略图，点击 × 删除不需要的页面
- **导出**：一键合并导出为 PDF

## 格式支持

| 格式 | 支持 | 备注 |
|------|------|------|
| PDF | ✅ | |
| DOCX | ✅ | Word 2007+ (不含 .doc) |
| JPG / JPEG | ✅ | |
| PNG | ✅ | |
| DOC | ❌ | 请用 Word/WPS 转为 .docx |

## 技术栈

纯前端，无后端，GitHub Pages 部署。

- [pdf.js](https://mozilla.github.io/pdf.js/) — PDF 渲染
- [pdf-lib](https://pdf-lib.js.org/) — PDF 创建与操作
- [SortableJS](https://sortablejs.github.io/Sortable/) — 拖拽排序
- [mammoth.js](https://github.com/mwilliamson/mammoth.js) — DOCX 解析

## 开发

```
.
├── index.html       # 入口
├── css/style.css    # Frost 主题
├── js/              # 模块 (app / ui / file-handler / pdf-engine / thumbnail-view)
└── docs/            # 架构文档
```
