/**
 * file-handler.js — 文件导入处理模块
 * 依赖：PDFEngine, UI
 *
 * 职责：
 *   - 拖拽事件 + 点击上传事件绑定
 *   - 文件 MIME/扩展名双重检测
 *   - 调用 PDFEngine.importFile() 逐个处理
 *   - 触发 UI 状态更新 + 缩略图刷新
 */
const FileHandler = (() => {

  const els = UI.els;
  const ACCEPTED_EXT = ['pdf', 'docx', 'jpg', 'jpeg', 'png'];
  let fileList = []; // { name, type, pageCount }

  // ── Init: bind all file input events ──
  function init() {
    const dz = els.dropzone;

    // Click to select
    dz.addEventListener('click', () => els.fileInput.click());
    els.dropzone.querySelector('.dropzone__content')
      ?.addEventListener('click', (e) => {
        e.stopPropagation();
        els.fileInput.click();
      });

    // File input change
    els.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFiles(e.target.files);
        els.fileInput.value = '';
      }
    });

    // Import button
    els.btnImport.addEventListener('click', () => els.fileInput.click());

    // Drag events
    dz.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      UI.setDragOver(true);
    });

    dz.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      UI.setDragOver(false);
    });

    dz.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      UI.setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    });

    // Global drop on body (for files dropped outside the dropzone)
    document.body.addEventListener('dragover', (e) => { e.preventDefault(); });
    document.body.addEventListener('drop', (e) => {
      e.preventDefault();
      // Only handle if not already handled by dropzone
      if (e.dataTransfer.files.length > 0 && PDFEngine.getPageCount() === 0) {
        handleFiles(e.dataTransfer.files);
      }
    });
  }

  // ── Handle file list ──
  async function handleFiles(files) {
    const entries = Array.from(files);
    let imported = 0;
    let errors = [];

    for (const file of entries) {
      const ext = file.name.split('.').pop().toLowerCase();

      // Check .doc early
      if (ext === 'doc' && file.type === 'application/msword') {
        UI.toast(
          '暂不支持 .doc 格式，请用 Word 或 WPS 转换为 .docx 后导入',
          'error'
        );
        errors.push(file.name);
        continue;
      }

      if (!ACCEPTED_EXT.includes(ext)) {
        UI.toast(`不支持的文件格式: .${ext}`, 'error');
        errors.push(file.name);
        continue;
      }

      try {
        const result = await PDFEngine.importFile(file);
        PDFEngine.addPages(result.pages);
        fileList.push(result.fileInfo);
        imported += result.fileInfo.pageCount;

        UI.toast(`已导入: ${file.name} (${result.fileInfo.pageCount} 页)`, 'success', 2000);
      } catch (err) {
        if (err.message === 'DOC_NOT_SUPPORTED') {
          UI.toast(
            '暂不支持 .doc 格式，请用 Word 或 WPS 转换为 .docx 后导入',
            'error'
          );
        } else if (err.message === 'UNSUPPORTED_FORMAT') {
          UI.toast(`不支持的文件格式: ${file.name}`, 'error');
        } else if (err.message === 'EMPTY_DOCX') {
          UI.toast(`文档内容为空: ${file.name}`, 'error');
        } else {
          console.error('Import error:', err);
          UI.toast(`导入失败: ${file.name}`, 'error');
        }
        errors.push(file.name);
      }
    }

    // Update UI
    if (PDFEngine.getPageCount() > 0) {
      UI.showMainUI();
      UI.updateStats(PDFEngine.getPageCount(), PDFEngine.getFileCount());
      // Trigger thumbnail refresh via custom event
      window.dispatchEvent(new CustomEvent('files-changed'));
    }
  }

  return { init, handleFiles };
})();
