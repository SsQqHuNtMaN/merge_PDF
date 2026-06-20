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
    btnClear:    document.getElementById('btn-clear'),
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
    els.btnClear.classList.remove('hidden');
    // Update dropzone text for has-files state
    els.dropzone.querySelector('.dropzone__label').textContent = '点击或拖拽添加更多文件';
    els.dropzone.querySelector('.dropzone__hint').textContent = 'PDF · DOCX · JPG · PNG';
  }

  function hideMainUI() {
    els.dropzone.classList.add('dropzone--empty');
    els.dropzone.classList.remove('dropzone--has-files');
    els.mainContent.classList.add('hidden');
    els.footerBar.classList.add('hidden');
    els.btnExport.disabled = true;
    els.btnClear.classList.add('hidden');
    // Restore original empty-state text
    els.dropzone.querySelector('.dropzone__label').textContent = '拖拽文件到此处';
    els.dropzone.querySelector('.dropzone__hint').textContent = 'PDF · DOCX · JPG · PNG';
  }

  function setDragOver(active) {
    const hasFiles = els.dropzone.classList.contains('dropzone--has-files');
    if (active) {
      els.dropzone.classList.add('dropzone--drag-over');
      if (hasFiles) {
        els.dropzone.querySelector('.dropzone__label').textContent = '释放以添加文件';
      }
    } else {
      els.dropzone.classList.remove('dropzone--drag-over');
      if (hasFiles) {
        els.dropzone.querySelector('.dropzone__label').textContent = '点击或拖拽添加更多文件';
      }
    }
  }

  function updateStats(pageCount, fileCount) {
    els.statPages.textContent = `${pageCount} 页`;
    els.statFiles.textContent = `${fileCount} 个文件`;
  }

  return { toast, els, showMainUI, hideMainUI, setDragOver, updateStats };
})();
