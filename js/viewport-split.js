// Pure functions for viewport splitting with 16:9 letterbox safety
// Exports a single function splitViewport(width,height,mode='lr') returning two rects {x,y,w,h}
// mode can be 'lr' (left/right) or 'tb' (top/bottom)
// The returned rects are constrained to the largest 16:9 area within the given viewport.

export function splitViewport(width, height, mode = 'lr') {
  if (typeof width !== 'number' || typeof height !== 'number') {
    throw new Error('splitViewport requires numeric width and height');
  }
  const targetRatio = 16 / 9;
  let letterX = 0,
      letterY = 0,
      letterW = width,
      letterH = height;

  const currentRatio = width / height;
  if (currentRatio > targetRatio) {
    // Too wide, add side bars
    letterW = Math.floor(height * targetRatio);
    letterX = Math.floor((width - letterW) / 2);
    letterY = 0;
    letterH = height;
  } else if (currentRatio < targetRatio) {
    // Too tall, add top/bottom bars
    letterH = Math.floor(width / targetRatio);
    letterY = Math.floor((height - letterH) / 2);
    letterX = 0;
    letterW = width;
  }

  const rects = [];
  if (mode === 'lr') {
    const halfW = Math.floor(letterW / 2);
    rects.push({ x: letterX, y: letterY, w: halfW, h: letterH });
    rects.push({ x: letterX + halfW, y: letterY, w: letterW - halfW, h: letterH });
  } else if (mode === 'tb') {
    const halfH = Math.floor(letterH / 2);
    rects.push({ x: letterX, y: letterY, w: letterW, h: halfH });
    rects.push({ x: letterX, y: letterY + halfH, w: letterW, h: letterH - halfH });
  } else {
    throw new Error("splitViewport mode must be 'lr' or 'tb'");
  }
  return rects;
}
