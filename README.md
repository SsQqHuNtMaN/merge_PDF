# PDF Merge — 文档合并与排序

将 PDF、Word (DOCX)、JPG、PNG 合并为一份 PDF，支持拖拽调整页面顺序。

## 在线使用

访问 **[ssqqhuntman.github.io/merge_PDF](https://ssqqhuntman.github.io/merge_PDF/)**，拖入文件即可使用。

## 如何使用

1. 打开页面，将 PDF / DOCX / JPG / PNG 文件拖入窗口，或点击「导入文件」选择
2. 在缩略图网格中**拖拽**调整页面顺序
3. 底部**缩放滑条**可调整缩略图大小 (80%–250%)
4. 悬停缩略图点击 **×** 可删除不需要的页面
5. 点击「导出 PDF」合并下载

## 格式支持

| 格式 | 支持 | 备注 |
|------|------|------|
| PDF | ✅ | |
| DOCX | ✅ | Word 2007+ |
| JPG / JPEG | ✅ | |
| PNG | ✅ | |
| DOC | ❌ | 请转为 .docx 后导入 |

## 本地使用

```sh
git clone https://github.com/SsQqHuNtMaN/merge_PDF.git
cd merge_PDF
npx serve .          # 或 python -m http.server 8080
```
