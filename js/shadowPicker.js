(function () {
  const SIZE = 200;           // SVG coordinate size (viewBox)
  const CENTER = SIZE / 2;    // 100
  const RADIUS = SIZE / 2 - 8; // leave some padding for arrowhead, dot, stroke

  const svg = document.getElementById('svg');
  const dragDot = document.getElementById('dragDot');
  const shaft = document.getElementById('shaft');
  const markerPath = document.getElementById('markerPath');
  const shadowPicker = document.getElementById('shadowPicker');
  const preview = document.getElementById('preview');

  let dragging = false;
  let activePointerId = null;

  // Utility: convert client coords -> svg viewBox coords, handles CSS scaling
  function clientToSvg(e) {
    const rect = svg.getBoundingClientRect();
    const scaleX = SIZE / rect.width;
    const scaleY = SIZE / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return { x, y };
  }

  // central update: given pointer position (in svg coords), update dot, shaft, arrowhead, and CSS var
  function updateFromPoint(svgX, svgY) {
    const dx = svgX - CENTER;
    const dy = svgY - CENTER;
    let dist = Math.sqrt(dx * dx + dy * dy);

    // constrain drag within radius
    let nx = dx, ny = dy;
    if (dist > RADIUS) {
      nx = dx * (RADIUS / dist);
      ny = dy * (RADIUS / dist);
      dist = RADIUS;
    }

    const tipX = CENTER + nx;
    const tipY = CENTER + ny;

    // edge of circle for arrowhead/shaft end
    const angle = Math.atan2(ny, nx);
    const edgeX = CENTER + Math.cos(angle) * RADIUS;
    const edgeY = CENTER + Math.sin(angle) * RADIUS;

    // update SVG elements (shaft: center -> edge)
    shaft.setAttribute('x1', CENTER);
    shaft.setAttribute('y1', CENTER);
    shaft.setAttribute('x2', edgeX);
    shaft.setAttribute('y2', edgeY);

    // update draggable dot (remains inside circle)
    dragDot.setAttribute('cx', tipX);
    dragDot.setAttribute('cy', tipY);

    // update shadow CSS variable (map pixels -> sensible values)
    // keep same mapping as before: offsetX = nx / 5 ; blur grows with dist
    const offsetX = Math.round(nx / 5);
    const offsetY = Math.round(ny / 5);
    const blur = 12 + Math.round(dist / 10);

    // color (hex from color picker); append alpha '44'
    const hex = shadowPicker.value;           // "#rrggbb"
    const shadowHexAlpha = hex + '44';      // "#rrggbb44"

    document.documentElement.style.setProperty('--card-shadow', `${offsetX}px ${offsetY}px ${blur}px ${shadowHexAlpha}`);
  }

  // initial set (place the dot roughly at the default shadow 0px 4px 12px)
  (function init() {
    // default offsetY = 4px -> ny ≈ 4*5 = 20
    const initialY = CENTER + 20;
    dragDot.setAttribute('cx', CENTER);
    dragDot.setAttribute('cy', initialY);
    updateFromPoint(CENTER, initialY);

    // // set initial colors
    // const initialColor = shadowPicker.value;
    // shaft.setAttribute('stroke', initialColor);
    // markerPath.setAttribute('fill', initialColor);
    // dragDot.setAttribute('fill', initialColor);
  })();

  // pointer handlers on the draggable dot
  dragDot.addEventListener('pointerdown', (e) => {
    dragging = true;
    activePointerId = e.pointerId;
    // capture so we continue receiving events even when pointer leaves the dot
    try { dragDot.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  });

  // release capture & stop dragging on pointerup
  dragDot.addEventListener('pointerup', (e) => {
    dragging = false;
    if (activePointerId !== null) {
      try { dragDot.releasePointerCapture(activePointerId); } catch (err) {}
      activePointerId = null;
    }
  });

  // also clear dragging if pointer is released anywhere
  document.addEventListener('pointerup', (e) => {
    dragging = false;
    if (activePointerId !== null) {
      try { dragDot.releasePointerCapture(activePointerId); } catch (err) {}
      activePointerId = null;
    }
  });

  // pointermove on document while dragging
  document.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = clientToSvg(e);
    updateFromPoint(p.x, p.y);
  });

  // allow clicking/tapping anywhere inside the circle to jump the dot there
  svg.addEventListener('pointerdown', (e) => {
    // ignore if started on the dot, that is already handled
    if (e.target === dragDot) return;
    const p = clientToSvg(e);
    updateFromPoint(p.x, p.y);

    // start dragging immediately (nice UX on touch)
    dragging = true;
    activePointerId = e.pointerId;
  });

  svg.addEventListener('pointerup', () => {
    dragging = false;
    if (activePointerId !== null) {
      try { dragDot.releasePointerCapture(activePointerId); } catch (err) {}
      activePointerId = null;
    }
  });

  // color changes: update arrow visuals + recompute CSS var using current dot pos
  shadowPicker.addEventListener('input', () => {
    // const c = shadowPicker.value;
    // shaft.setAttribute('stroke', c);
    // markerPath.setAttribute('fill', c);
    // dragDot.setAttribute('fill', c);

    // recompute css var using current dot position
    const curX = Number(dragDot.getAttribute('cx'));
    const curY = Number(dragDot.getAttribute('cy'));
    updateFromPoint(curX, curY);
  });
})();