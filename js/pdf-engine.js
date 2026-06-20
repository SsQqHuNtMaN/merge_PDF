/**
 * pdf-engine.js — PDF 核心引擎
 * 依赖：pdf-lib (PDFLib global), pdf.js (pdfjsLib global)
 *
 * 核心职责：
 *   - 将不同源文件转换为 pdf-lib 页面
 *   - 合并所有页面为单个 PDF
 *   - 导出下载
 *   - 用 pdf.js 渲染缩略图
 */

// 配置 pdf.js worker
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const PDFEngine = (() => {

  // ── 内部状态：所有页面的统一表示 ──
  // page = { id, sourceType:'pdf'|'image'|'docx', pdfPage (pdf-lib ref), width, height, sourceFileId, pageIndex }
  let pages = [];
  let idCounter = 0;

  function nextId() { return ++idCounter; }

  // ═══════════════════════════════════════════
  //  导入
  // ═══════════════════════════════════════════

  /**
   * 从 File 对象提取所有页面
   * 返回 { pages: [...], fileInfo: { name, type, pageCount } }
   */
  async function importFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const mime = file.type;

    // PDF
    if (ext === 'pdf' || mime === 'application/pdf') {
      return await _importPDF(file);
    }

    // Images
    if (['jpg','jpeg','png'].includes(ext) || mime.startsWith('image/')) {
      return await _importImage(file);
    }

    // DOCX
    if (ext === 'docx' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return await _importDOCX(file);
    }

    // OLD .doc — not supported
    if (ext === 'doc' || mime === 'application/msword') {
      throw new Error('DOC_NOT_SUPPORTED');
    }

    throw new Error('UNSUPPORTED_FORMAT');
  }

  async function _importPDF(file) {
    const buffer = await file.arrayBuffer();
    const srcDoc = await PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
    const pageCount = srcDoc.getPageCount();
    const newPages = [];

    // Also load with pdf.js for rendering later
    const pdfJsDoc = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;

    for (let i = 0; i < pageCount; i++) {
      const srcPage = srcDoc.getPage(i);
      const { width, height } = srcPage.getSize();
      newPages.push({
        id: nextId(),
        sourceType: 'pdf',
        sourceFileId: file.name,
        sourceFile: file,
        pageIndex: i,
        pdfPage: srcPage,   // reference into srcDoc — will be copied on export
        srcDoc: srcDoc,
        pdfJsDoc: pdfJsDoc,
        width,
        height,
      });
    }

    return {
      pages: newPages,
      fileInfo: { name: file.name, type: 'pdf', pageCount },
    };
  }

  async function _importImage(file) {
    const buffer = await file.arrayBuffer();
    const img = await _loadImageFromBuffer(buffer, file.type);

    // Create a single-page PDFDoc for this image
    const imgDoc = await PDFLib.PDFDocument.create();
    let image;
    if (file.type === 'image/png') {
      image = await imgDoc.embedPng(buffer);
    } else {
      image = await imgDoc.embedJpg(buffer);
    }

    // Use image natural dimensions, scaled to fit A4-ish
    const MAX_DIM = 595; // A4 width in pdf points
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w > MAX_DIM) {
      h = h * (MAX_DIM / w);
      w = MAX_DIM;
    }

    const page = imgDoc.addPage([w, h]);
    page.drawImage(image, { x: 0, y: 0, width: w, height: h });

    const newPage = {
      id: nextId(),
      sourceType: 'image',
      sourceFileId: file.name,
      sourceFile: file,
      pageIndex: 0,
      srcDoc: imgDoc,
      pdfPage: imgDoc.getPage(0),
      imgData: { src: img.src, w, h },
      width: w,
      height: h,
    };

    return {
      pages: [newPage],
      fileInfo: { name: file.name, type: 'image', pageCount: 1 },
    };
  }

  async function _importDOCX(file) {
    const buffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    const html = result.value;

    if (!html || html.trim().length === 0) {
      throw new Error('EMPTY_DOCX');
    }

    // Render HTML to canvas → image → PDF page
    const pages = await _renderHTMLToPDFPages(html, file.name);
    return {
      pages,
      fileInfo: { name: file.name, type: 'docx', pageCount: pages.length },
    };
  }

  /**
   * 将 HTML 字符串渲染为 PDF 页面（分页）
   * 策略：html2canvas 一次渲染全部 → canvas 切片分页
   */
  async function _renderHTMLToPDFPages(html, sourceName) {
    const container = document.createElement('div');
    container.style.cssText = `
      position:fixed;left:-9999px;top:0;
      width:595px;padding:40px;
      background:#fff;color:#000;
      font-family:"PingFang SC","Microsoft YaHei",sans-serif;
      font-size:14px;line-height:1.8;
      z-index:-1;
    `;
    container.innerHTML = html;
    document.body.appendChild(container);

    // Wait for layout
    await new Promise(r => setTimeout(r, 100));

    // Capture full HTML as a single tall canvas (scale=2 for quality)
    const fullCanvas = await html2canvas(container, {
      width: 595,
      windowWidth: 595,
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    document.body.removeChild(container);

    const SCALE = 2;
    const pageHeightPx = Math.round(842 * SCALE); // A4 @ scale 2
    const pageWidthPx = Math.round(595 * SCALE);
    const totalPx = fullCanvas.height;
    const pageCount = Math.max(1, Math.ceil(totalPx / pageHeightPx));
    const newPages = [];

    const doc = await PDFLib.PDFDocument.create();

    for (let i = 0; i < pageCount; i++) {
      const sliceHeight = Math.min(pageHeightPx, totalPx - i * pageHeightPx);

      // Slice from full canvas
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = pageWidthPx;
      sliceCanvas.height = sliceHeight;
      const ctx = sliceCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageWidthPx, sliceHeight);
      ctx.drawImage(
        fullCanvas,
        0, i * pageHeightPx, pageWidthPx, sliceHeight,  // source rect
        0, 0, pageWidthPx, sliceHeight                   // dest rect
      );

      const dataUrl = sliceCanvas.toDataURL('image/png');
      const imgBytes = await (await fetch(dataUrl)).arrayBuffer();
      const pngImage = await doc.embedPng(imgBytes);

      const ptWidth = 595;
      const ptHeight = Math.round(sliceHeight / SCALE);
      const page = doc.addPage([ptWidth, ptHeight]);
      page.drawImage(pngImage, { x: 0, y: 0, width: ptWidth, height: ptHeight });

      newPages.push({
        id: nextId(),
        sourceType: 'docx',
        sourceFileId: sourceName,
        pageIndex: i,
        srcDoc: doc,
        pdfPage: page,
        width: ptWidth,
        height: ptHeight,
      });
    }

    return newPages;
  }

  // ── Image loading helper ──
  function _loadImageFromBuffer(buffer, mimeType) {
    return new Promise((resolve, reject) => {
      const blob = new Blob([buffer], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  // ═══════════════════════════════════════════
  //  合并 & 导出
  // ═══════════════════════════════════════════

  function getAllPages() { return pages; }

  function getPageCount() { return pages.length; }

  function addPages(newPages) {
    pages.push(...newPages);
  }

  function clearAll() {
    pages = [];
    idCounter = 0;
  }

  function removePage(pageId) {
    const idx = pages.findIndex(p => p.id === pageId);
    if (idx >= 0) pages.splice(idx, 1);
  }

  function reorderPages(idOrder) {
    // idOrder is an array of page ids in new order
    const pageMap = new Map(pages.map(p => [p.id, p]));
    pages = idOrder.map(id => pageMap.get(id)).filter(Boolean);
  }

  function getFileCount() {
    const files = new Set(pages.map(p => p.sourceFileId));
    return files.size;
  }

  /**
   * 合并所有页面为单个 PDF 并触发下载
   */
  async function exportPDF(filename = 'merged.pdf') {
    if (pages.length === 0) throw new Error('NO_PAGES');

    const outDoc = await PDFLib.PDFDocument.create();

    for (const page of pages) {
      if (page.sourceType === 'pdf') {
        // Copy pages from source PDF
        const [copiedPage] = await outDoc.copyPages(page.srcDoc, [page.pageIndex]);
        outDoc.addPage(copiedPage);
      } else if (page.sourceType === 'image' || page.sourceType === 'docx') {
        // These already have their own PDFDoc; copy from it
        const [copiedPage] = await outDoc.copyPages(page.srcDoc, [0]);
        outDoc.addPage(copiedPage);
      }
    }

    const pdfBytes = await outDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ═══════════════════════════════════════════
  //  缩略图渲染 (pdf.js)
  // ═══════════════════════════════════════════

  /**
   * 渲染单页缩略图到 canvas
   * @param {Object} page - 内部 page 对象
   * @param {number} targetWidth - 目标宽度 px
   * @returns {Promise<HTMLCanvasElement>}
   */
  async function renderThumbnail(page, targetWidth = 200) {
    if (page.sourceType === 'pdf') {
      return await _renderPDFThumbnail(page, targetWidth);
    } else if (page.sourceType === 'image') {
      return await _renderImageThumbnail(page, targetWidth);
    } else if (page.sourceType === 'docx') {
      return await _renderDocxThumbnail(page, targetWidth);
    }
    throw new Error('Unknown source type');
  }

  async function _renderPDFThumbnail(page, targetWidth) {
    const pdfPage = await page.pdfJsDoc.getPage(page.pageIndex + 1);
    const viewport = pdfPage.getViewport({ scale: 1 });
    const scale = targetWidth / viewport.width;
    const scaledViewport = pdfPage.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    const ctx = canvas.getContext('2d');

    // Draw paper background
    ctx.fillStyle = '#faf9f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await pdfPage.render({
      canvasContext: ctx,
      viewport: scaledViewport,
    }).promise;

    return canvas;
  }

  async function _renderImageThumbnail(page, targetWidth) {
    const img = await _loadImage(page.imgData.src);
    const scale = targetWidth / img.naturalWidth;
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = img.naturalHeight * scale;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#faf9f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return canvas;
  }

  async function _renderDocxThumbnail(page, targetWidth) {
    // DOCX pages were rendered as PNG during import
    // Re-render from the srcDoc page
    const srcPage = page.pdfPage;
    const { width, height } = srcPage.getSize();
    const scale = targetWidth / width;

    // For now, use a proxy: render a small version of what we stored
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#faf9f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Get the embedded image from the PDF page
    // Since we embedded PNGs, extract and draw
    const pdfBytes = await page.srcDoc.save();
    const pdfJsDoc = await pdfjsLib.getDocument({ data: pdfBytes.slice(0) }).promise;
    const pdfJsPage = await pdfJsDoc.getPage(1);
    const viewport = pdfJsPage.getViewport({ scale });
    await pdfJsPage.render({ canvasContext: ctx, viewport }).promise;

    return canvas;
  }

  function _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  return {
    importFile,
    getAllPages,
    getPageCount,
    getFileCount,
    addPages,
    clearAll,
    removePage,
    reorderPages,
    exportPDF,
    renderThumbnail,
  };
})();
