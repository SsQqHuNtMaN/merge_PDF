/**
 * ui.js — UI 辅助模块
 * Toast 通知、工具栏状态、DOM 工具
 */
const UI = (() => {

  // ── Toast ──
  const container = document.getElementById('toast-container');
  let toastTimer = null;

  function toast(message, type = 'info', duration = 3000) {
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.textContent = message;
    container.appendChild(el);

    // Auto-remove after animation (3s total)
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, duration);
  }

  // ── Element refs ──
  const els = {
    dropzone:    document.getElementById('dropzone'),
    fileInput:   document.getElementById('file-input'),
    mainContent: document.getElementById('main-content'),
    thumbnailGrid: document.getElementById('thumbnail-grid'),
    footerBar:   document.getElementById('footer-bar'),
    btnImport:   document.getElementById('btn-import'),
    btnExport:   document.getElementById('btn-export'),
    statPages:   document.getElementById('stat-pages'),
    statFiles:   document.getElementById('stat-files'),
    zoomSlider:  document.getElementById('zoom-slider'),
    zoomLabel:   document.getElementById('zoom-label'),
  };

  // ── DOM helpers ──
  function showMainUI() {
    els.dropzone.classList.remove('dropzone--empty');
    els.dropzone.classList.add('dropzone--has-files');
    els.mainContent.classList.remove('hidden');
    els.footerBar.classList.remove('hidden');
    els.btnExport.disabled = false;
  }

  function hideMainUI() {
    els.dropzone.classList.add('dropzone--empty');
    els.dropzone.classList.remove('dropzone--has-files');
    els.mainContent.classList.add('hidden');
    els.footerBar.classList.add('hidden');
    els.btnExport.disabled = true;
  }

  function setDragOver(active) {
    if (active) {
      els.dropzone.classList.add('dropzone--drag-over');
    } else {
      els.dropzone.classList.remove('dropzone--drag-over');
    }
  }

  function updateStats(pageCount, fileCount) {
    els.statPages.textContent = `${pageCount} 页`;
    els.statFiles.textContent = `${fileCount} 个文件`;
  }

  return { toast, els, showMainUI, hideMainUI, setDragOver, updateStats };
})();
