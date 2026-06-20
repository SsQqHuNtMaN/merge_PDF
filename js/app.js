/**
 * app.js — 主控制器
 * 依赖：UI, PDFEngine, FileHandler, ThumbnailView
 *
 * 职责：应用启动、模块初始化、事件协调
 */
const App = (() => {

  // ── Init ──
  async function init() {
    // Wait for CDN scripts to load
    await _waitForDependencies();

    // Init sub-modules
    FileHandler.init();
    ThumbnailView.init();

    // Bind export button
    UI.els.btnExport.addEventListener('click', () => _handleExport());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+O / Cmd+O: open file dialog
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        UI.els.fileInput.click();
      }
      // Ctrl+S / Cmd+S: export
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        _handleExport();
      }
      // Delete key: remove selected page
      if (e.key === 'Delete') {
        const selected = document.querySelector('.thumb-card--selected');
        if (selected) {
          const pageId = parseInt(selected.dataset.pageId);
          // Trigger delete via thumbnail-view's internal logic
          PDFEngine.removePage(pageId);
          ThumbnailView.refresh();
          UI.toast('页面已删除', 'info', 1500);
        }
      }
    });

    console.log('PDF Merge — Frost ready');
  }

  // ── Wait for CDN libraries ──
  function _waitForDependencies() {
    return new Promise((resolve) => {
      function check() {
        if (
          typeof pdfjsLib !== 'undefined' &&
          typeof PDFLib !== 'undefined' &&
          typeof Sortable !== 'undefined' &&
          typeof mammoth !== 'undefined' &&
          typeof html2canvas !== 'undefined'
        ) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      }
      check();
    });
  }

  // ── File change callback ──
  function onFilesChanged() {
    ThumbnailView.refresh();
  }

  // Listen for file import events
  window.addEventListener('files-changed', onFilesChanged);

  // ── Export ──
  async function _handleExport() {
    try {
      UI.toast('正在生成 PDF...', 'info', 2000);

      // Generate a filename based on first source file
      const pages = PDFEngine.getAllPages();
      let baseName = 'merged';
      if (pages.length > 0) {
        const firstName = pages[0].sourceFileId.replace(/\.[^.]+$/, '');
        baseName = firstName + '_合并';
      }

      await PDFEngine.exportPDF(baseName + '.pdf');
      UI.toast('PDF 已导出', 'success', 3000);
    } catch (err) {
      if (err.message === 'NO_PAGES') {
        UI.toast('没有可导出的页面，请先导入文件', 'error');
      } else {
        console.error('Export error:', err);
        UI.toast('导出失败，请重试', 'error');
      }
    }
  }

  return { init, onFilesChanged };
})();

// ── Boot ──
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
