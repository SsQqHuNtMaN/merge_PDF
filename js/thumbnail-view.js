/**
 * thumbnail-view.js — 缩略图网格视图
 * 依赖：PDFEngine, UI, SortableJS (Sortable global)
 *
 * 职责：
 *   - 根据当前页面列表渲染缩略图网格
 *   - 缩放控制
 *   - SortableJS 拖拽排序
 *   - 页面删除
 *   - 选中状态
 */
const ThumbnailView = (() => {

  const grid = UI.els.thumbnailGrid;
  const zoomSlider = UI.els.zoomSlider;
  const zoomLabel = UI.els.zoomLabel;
  let currentZoom = 150; // percentage
  let sortableInstance = null;
  let selectedPageId = null;

  // ── Init zoom controls ──
  function init() {
    zoomSlider.addEventListener('input', () => {
      currentZoom = parseInt(zoomSlider.value);
      zoomLabel.textContent = `${currentZoom}%`;
      refresh();
    });

    document.getElementById('btn-zoom-out').addEventListener('click', () => {
      currentZoom = Math.max(80, currentZoom - 10);
      zoomSlider.value = currentZoom;
      zoomLabel.textContent = `${currentZoom}%`;
      refresh();
    });

    document.getElementById('btn-zoom-in').addEventListener('click', () => {
      currentZoom = Math.min(250, currentZoom + 10);
      zoomSlider.value = currentZoom;
      zoomLabel.textContent = `${currentZoom}%`;
      refresh();
    });
  }

  // ── Refresh: re-render all thumbnails ──
  async function refresh() {
    const pages = PDFEngine.getAllPages();
    const targetWidth = Math.round(currentZoom * 1.33);

    // Update stats
    UI.updateStats(PDFEngine.getPageCount(), PDFEngine.getFileCount());

    // Clear grid
    grid.innerHTML = '';
    grid.classList.remove('thumbnail-grid--empty');

    if (pages.length === 0) {
      grid.classList.add('thumbnail-grid--empty');
      grid.textContent = '';
      _destroySortable();
      return;
    }

    // Render thumbnails
    for (const page of pages) {
      const card = await _createThumbCard(page, targetWidth);
      grid.appendChild(card);
    }

    // Re-init sortable
    _initSortable();
  }

  async function _createThumbCard(page, targetWidth) {
    const card = document.createElement('div');
    card.className = 'thumb-card';
    card.dataset.pageId = page.id;
    if (page.id === selectedPageId) {
      card.classList.add('thumb-card--selected');
    }

    // Canvas wrap
    const wrap = document.createElement('div');
    wrap.className = 'thumb-card__canvas-wrap';

    try {
      const canvas = await PDFEngine.renderThumbnail(page, targetWidth);
      wrap.appendChild(canvas);
    } catch (err) {
      console.error('Thumbnail render error:', err);
      wrap.innerHTML = `<div style="width:${targetWidth}px;height:${Math.round(targetWidth*1.414)}px;display:flex;align-items:center;justify-content:center;color:var(--text-hint);font-size:12px;">渲染失败</div>`;
    }

    // Footer with page number
    const footer = document.createElement('div');
    footer.className = 'thumb-card__footer';
    const num = document.createElement('span');
    num.className = 'thumb-card__page-num';
    num.textContent = _getPageDisplayIndex(page.id) + 1;
    footer.appendChild(num);

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className = 'thumb-card__delete';
    delBtn.innerHTML = '&times;';
    delBtn.title = '删除此页';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      _deletePage(page.id);
    });

    // Click to select
    card.addEventListener('click', (e) => {
      // Don't select when clicking delete button
      if (e.target === delBtn) return;
      _selectPage(page.id);
    });

    card.appendChild(wrap);
    card.appendChild(footer);
    card.appendChild(delBtn);

    return card;
  }

  function _getPageDisplayIndex(pageId) {
    return PDFEngine.getAllPages().findIndex(p => p.id === pageId);
  }

  // ── Sortable ──
  function _initSortable() {
    _destroySortable();

    sortableInstance = new Sortable(grid, {
      animation: 180,
      easing: 'cubic-bezier(0.2, 0, 0.2, 1)',
      ghostClass: 'sortable-ghost',
      dragClass: 'thumb-card--dragging',
      handle: '.thumb-card__canvas-wrap',
      delay: 80,           // small delay to distinguish drag from click
      delayOnTouchOnly: true,
      touchStartThreshold: 3,
      onEnd(evt) {
        _onReorder(evt);
      },
    });
  }

  function _destroySortable() {
    if (sortableInstance) {
      sortableInstance.destroy();
      sortableInstance = null;
    }
  }

  function _onReorder(evt) {
    // Read the new order from DOM
    const cards = grid.querySelectorAll('.thumb-card');
    const newOrder = Array.from(cards).map(c => parseInt(c.dataset.pageId));
    PDFEngine.reorderPages(newOrder);

    // Re-render page numbers
    const nums = grid.querySelectorAll('.thumb-card__page-num');
    nums.forEach((el, i) => {
      el.textContent = i + 1;
    });

    UI.toast('页面顺序已更新', 'info', 1500);
  }

  // ── Selection ──
  function _selectPage(pageId) {
    // Deselect previous
    if (selectedPageId !== null) {
      const prev = grid.querySelector(`[data-page-id="${selectedPageId}"]`);
      if (prev) prev.classList.remove('thumb-card--selected');
    }
    selectedPageId = pageId;
    const card = grid.querySelector(`[data-page-id="${pageId}"]`);
    if (card) card.classList.add('thumb-card--selected');
  }

  // ── Delete ──
  function _deletePage(pageId) {
    PDFEngine.removePage(pageId);
    if (selectedPageId === pageId) selectedPageId = null;

    const pageCount = PDFEngine.getPageCount();
    if (pageCount === 0) {
      UI.hideMainUI();
      selectedPageId = null;
      _destroySortable();
    } else {
      refresh();
      UI.toast('页面已删除', 'info', 1500);
    }
  }

  return { init, refresh };
})();
