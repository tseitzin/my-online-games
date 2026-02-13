import { Position, TrackDimensions, TrackType, PathSegment } from '../../../types/race';
import { COLORS, TRACK_CONFIG } from '../../../constants/race';

/**
 * Track math + rendering
 *
 * Lane offset uses LEFT-HAND normal of travel direction.
 * Rotation uses segment direction (no lookahead needed with combined lookup).
 * Path lookup uses binary search on pre-computed cumulative distances.
 * Track path cached as Path2D for efficient per-frame rendering.
 */

export function calculateTrackDimensions(
  canvasWidth: number,
  canvasHeight: number,
  laneCount: number,
  trackType: TrackType = TrackType.Oval
): TrackDimensions {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const trackWidth = laneCount * TRACK_CONFIG.laneSpacing + 40;

  let radiusX: number;
  let radiusY: number;
  let pathSegments: PathSegment[] | undefined;
  let totalLength: number | undefined;
  let cumulativeDistances: number[] | undefined;
  let cachedPath: Path2D | undefined;

  switch (trackType) {
    case TrackType.Speedway:
      radiusX = canvasWidth * 0.44;
      radiusY = canvasHeight * 0.40;
      pathSegments = generateSpeedwayPath(centerX, centerY, canvasWidth, canvasHeight, trackWidth);
      totalLength = calculatePathLength(pathSegments);
      break;

    case TrackType.Figure8:
      radiusX = canvasWidth * 0.44;
      radiusY = canvasHeight * 0.50;
      pathSegments = generateFigure8Path(centerX, centerY, radiusX, radiusY);
      totalLength = calculatePathLength(pathSegments);
      break;

    case TrackType.RoadCourse:
      radiusX = canvasWidth * 0.40;
      radiusY = canvasHeight * 0.35;
      pathSegments = generateRoadCoursePath(centerX, centerY, canvasWidth, canvasHeight);
      totalLength = calculatePathLength(pathSegments);
      break;

    default: // Oval
      radiusX = canvasWidth * 0.42;
      radiusY = canvasHeight * 0.38;
  }

  // Pre-compute cumulative distances for binary search
  if (pathSegments && totalLength) {
    cumulativeDistances = buildCumulativeDistances(pathSegments);
    cachedPath = buildCachedPath(pathSegments);
  }

  return {
    centerX,
    centerY,
    radiusX,
    radiusY,
    trackWidth,
    laneCount,
    pathSegments,
    totalLength,
    cumulativeDistances,
    cachedPath,
  };
}

function buildCumulativeDistances(segments: PathSegment[]): number[] {
  const cum: number[] = new Array(segments.length + 1);
  cum[0] = 0;
  for (let i = 0; i < segments.length; i++) {
    cum[i + 1] = cum[i] + segments[i].length;
  }
  return cum;
}

function buildCachedPath(segments: PathSegment[]): Path2D {
  const path = new Path2D();
  let isFirst = true;
  for (const seg of segments) {
    if (seg.type === 'straight') {
      if (isFirst) {
        path.moveTo(seg.startX, seg.startY);
        isFirst = false;
      }
      path.lineTo(seg.endX, seg.endY);
    } else if (
      seg.type === 'curve' &&
      seg.centerX !== undefined &&
      seg.centerY !== undefined &&
      seg.radius !== undefined &&
      seg.startAngle !== undefined &&
      seg.endAngle !== undefined
    ) {
      if (isFirst) {
        const x = seg.centerX + Math.cos(seg.startAngle) * seg.radius;
        const y = seg.centerY + Math.sin(seg.startAngle) * seg.radius;
        path.moveTo(x, y);
        isFirst = false;
      }
      path.arc(seg.centerX, seg.centerY, seg.radius, seg.startAngle, seg.endAngle);
    }
  }
  path.closePath();
  return path;
}

// ─── Combined position + rotation lookup ───────────────────────────────

export function getPositionAndRotation(
  progress: number,
  lane: number,
  dimensions: TrackDimensions,
  additionalOffset: number = 0
): { position: Position; rotation: number } {
  const baseLaneOffset = (lane - (dimensions.laneCount - 1) / 2) * TRACK_CONFIG.laneSpacing;
  const totalOffset = baseLaneOffset + additionalOffset;

  if (dimensions.pathSegments && dimensions.totalLength && dimensions.cumulativeDistances) {
    return getPositionAndRotationOnPath(
      progress,
      totalOffset,
      dimensions.pathSegments,
      dimensions.totalLength,
      dimensions.cumulativeDistances
    );
  }

  // Default oval/ellipse calculation
  const angle = progress * Math.PI * 2 - Math.PI / 2;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  const baseX = dimensions.centerX + cosA * dimensions.radiusX;
  const baseY = dimensions.centerY + sinA * dimensions.radiusY;

  const tangentX = -dimensions.radiusX * sinA;
  const tangentY = dimensions.radiusY * cosA;
  const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY) || 1e-6;

  const perpX = -tangentY / tangentLength;
  const perpY = tangentX / tangentLength;

  return {
    position: {
      x: baseX + perpX * totalOffset,
      y: baseY + perpY * totalOffset,
    },
    rotation: angle + Math.PI / 2,
  };
}

// Keep legacy exports for drawStartLine (which doesn't need rotation)
export function getPositionOnTrack(
  progress: number,
  lane: number,
  dimensions: TrackDimensions,
  additionalOffset: number = 0
): Position {
  return getPositionAndRotation(progress, lane, dimensions, additionalOffset).position;
}

export function getRotationAtPosition(progress: number, dimensions?: TrackDimensions): number {
  if (!dimensions) {
    const angle = progress * Math.PI * 2 - Math.PI / 2;
    return angle + Math.PI / 2;
  }
  return getPositionAndRotation(progress, 0, dimensions).rotation;
}

function getPositionAndRotationOnPath(
  progress: number,
  offset: number,
  segments: PathSegment[],
  totalLength: number,
  cumulativeDistances: number[]
): { position: Position; rotation: number } {
  if (!segments.length || !Number.isFinite(totalLength) || totalLength <= 0) {
    return { position: { x: 0, y: 0 }, rotation: 0 };
  }

  const p = normalizeProgress(progress);
  const targetDistance = p * totalLength;

  // Binary search for the segment containing targetDistance
  let lo = 0;
  let hi = segments.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (cumulativeDistances[mid + 1] < targetDistance) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  const segment = segments[lo];
  const segLen = Math.max(segment.length, 1e-6);
  const segmentProgress = (targetDistance - cumulativeDistances[lo]) / segLen;

  const position = getPositionOnSegment(segment, segmentProgress, offset);
  const rotation = getRotationFromSegment(segment, segmentProgress);

  return { position, rotation };
}

function getRotationFromSegment(segment: PathSegment, progress: number): number {
  if (segment.type === 'straight') {
    const dx = segment.endX - segment.startX;
    const dy = segment.endY - segment.startY;
    return Math.atan2(dy, dx);
  }

  if (
    segment.type === 'curve' &&
    segment.startAngle !== undefined &&
    segment.endAngle !== undefined
  ) {
    const angle = segment.startAngle + (segment.endAngle - segment.startAngle) * progress;
    const dir = segment.endAngle - segment.startAngle >= 0 ? 1 : -1;
    // Tangent direction for arc
    return Math.atan2(Math.cos(angle) * dir, -Math.sin(angle) * dir);
  }

  return 0;
}

// ─── Drawing ────────────────────────────────────────────────────────────

export function drawTrack(ctx: CanvasRenderingContext2D, dimensions: TrackDimensions): void {
  // Background
  ctx.fillStyle = COLORS.grass;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Scenery (trees, bushes, grandstands) — drawn before track so track covers overlaps
  drawScenery(ctx, dimensions);

  // Track
  if (dimensions.pathSegments) {
    drawPathBasedTrack(ctx, dimensions);
  } else {
    drawEllipseTrack(ctx, dimensions);
  }

  drawStartLine(ctx, dimensions);
}

// ─── Scenery ────────────────────────────────────────────────────────────

function drawScenery(ctx: CanvasRenderingContext2D, dimensions: TrackDimensions): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  // Deterministic RNG based on canvas dimensions
  let seed = (w * 73856093) ^ (h * 19349663) ^ 0x9e3779b9;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  // Grass speckles (lighter green patches)
  ctx.fillStyle = COLORS.grassDark;
  for (let i = 0; i < 30; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 2 + rand() * 3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Trees and bushes — placed outside the track area
  const margin = dimensions.trackWidth / 2 + 40;

  for (let i = 0; i < 18; i++) {
    const x = rand() * w;
    const y = rand() * h;

    // Skip if too close to track center area
    if (isInsideTrackArea(x, y, dimensions, margin)) continue;

    // Tree: trunk + canopy
    const trunkH = 6 + rand() * 4;
    const canopyR = 8 + rand() * 8;

    // Trunk
    ctx.fillStyle = COLORS.treeTrunk;
    ctx.fillRect(x - 2, y, 4, trunkH);

    // Canopy
    ctx.fillStyle = rand() > 0.5 ? COLORS.treeDark : COLORS.treeLight;
    ctx.beginPath();
    ctx.arc(x, y - canopyR * 0.3, canopyR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Smaller bushes
  for (let i = 0; i < 25; i++) {
    const x = rand() * w;
    const y = rand() * h;

    if (isInsideTrackArea(x, y, dimensions, margin)) continue;

    const r = 4 + rand() * 5;
    ctx.fillStyle = COLORS.treeLight;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grandstands near start/finish
  drawGrandstands(ctx, dimensions, rand);
}

function isInsideTrackArea(x: number, y: number, dimensions: TrackDimensions, margin: number): boolean {
  const { centerX, centerY, radiusX, radiusY } = dimensions;
  // Elliptical check — if the point is within the outer track boundary
  const dx = (x - centerX) / (radiusX + margin);
  const dy = (y - centerY) / (radiusY + margin);
  return (dx * dx + dy * dy) < 1;
}

function drawGrandstands(
  ctx: CanvasRenderingContext2D,
  dimensions: TrackDimensions,
  rand: () => number
): void {
  const { centerX, centerY, radiusX, radiusY, trackWidth } = dimensions;

  // Place 2 grandstands — one above track, one below
  const stands = [
    { x: centerX - 40, y: centerY - radiusY - trackWidth / 2 - 30, w: 80, h: 20 },
    { x: centerX + 20, y: centerY + radiusY + trackWidth / 2 + 12, w: 70, h: 18 },
  ];

  for (const stand of stands) {
    // Stand structure
    ctx.fillStyle = COLORS.grandstand;
    ctx.fillRect(stand.x, stand.y, stand.w, stand.h);

    // Roof
    ctx.fillStyle = '#616161';
    ctx.fillRect(stand.x - 2, stand.y - 3, stand.w + 4, 4);

    // Spectators (rows of colored dots)
    const spectatorColors = ['#F44336', '#2196F3', '#FFEB3B', '#FF9800', '#E91E63', '#4CAF50', '#9C27B0'];
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < Math.floor(stand.w / 8); col++) {
        const sx = stand.x + 4 + col * 8;
        const sy = stand.y + 5 + row * 8;
        ctx.fillStyle = spectatorColors[Math.floor(rand() * spectatorColors.length)];
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// ─── Track surface drawing ──────────────────────────────────────────────

function drawEllipseTrack(ctx: CanvasRenderingContext2D, dimensions: TrackDimensions): void {
  const { centerX, centerY, radiusX, radiusY, trackWidth } = dimensions;

  // Track surface
  ctx.fillStyle = COLORS.track;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX + trackWidth / 2, radiusY + trackWidth / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Infield
  ctx.fillStyle = COLORS.infield;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX - trackWidth / 2, radiusY - trackWidth / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Center dashed line
  ctx.strokeStyle = COLORS.trackLines;
  ctx.lineWidth = 2;
  ctx.setLineDash([20, 20]);
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPathBasedTrack(ctx: CanvasRenderingContext2D, dimensions: TrackDimensions): void {
  if (!dimensions.cachedPath) return;

  const { trackWidth } = dimensions;

  // Track surface — use cached Path2D
  ctx.lineWidth = trackWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = COLORS.track;
  ctx.stroke(dimensions.cachedPath);

  // Center dashed line
  ctx.strokeStyle = COLORS.trackLines;
  ctx.lineWidth = 2;
  ctx.setLineDash([20, 20]);
  ctx.stroke(dimensions.cachedPath);
  ctx.setLineDash([]);
}

function drawStartLine(ctx: CanvasRenderingContext2D, dimensions: TrackDimensions): void {
  const { trackWidth } = dimensions;
  const checkerSize = 10;
  const lineWidth = 20;

  // Use the center lane so the start line is centered on the track
  const centerLane = (dimensions.laneCount - 1) / 2;
  const startPos = getPositionOnTrack(0, centerLane, dimensions, 0);
  const startRotation = getRotationAtPosition(0, dimensions);

  // Draw rotated checkerboard centered on the start position
  ctx.save();
  ctx.translate(startPos.x, startPos.y);
  ctx.rotate(startRotation);

  const halfWidth = trackWidth / 2;
  const halfLine = lineWidth / 2;

  for (let across = -halfWidth; across < halfWidth; across += checkerSize) {
    for (let along = -halfLine; along < halfLine; along += checkerSize) {
      const col = Math.floor((across + halfWidth) / checkerSize);
      const row = Math.floor((along + halfLine) / checkerSize);
      ctx.fillStyle = (col + row) % 2 === 0 ? COLORS.startLine : COLORS.startLineAlt;
      // Draw perpendicular to travel direction (across = perpendicular, along = travel direction)
      ctx.fillRect(along, across, checkerSize, checkerSize);
    }
  }

  ctx.restore();
}

// ─── Path math helpers ──────────────────────────────────────────────────

function calculatePathLength(segments: PathSegment[]): number {
  return segments.reduce((sum, seg) => sum + seg.length, 0);
}

function normalizeProgress(progress: number): number {
  const p = progress % 1;
  return p < 0 ? p + 1 : p;
}

function getPositionOnSegment(segment: PathSegment, progress: number, offset: number): Position {
  const t = Math.min(Math.max(progress, 0), 1);

  if (segment.type === 'straight') {
    const dx = segment.endX - segment.startX;
    const dy = segment.endY - segment.startY;

    const x = segment.startX + dx * t;
    const y = segment.startY + dy * t;

    const length = Math.sqrt(dx * dx + dy * dy);
    if (!Number.isFinite(length) || length < 1e-6) {
      return { x, y };
    }

    // LEFT-HAND normal
    const perpX = -dy / length;
    const perpY = dx / length;

    return { x: x + perpX * offset, y: y + perpY * offset };
  }

  if (
    segment.type === 'curve' &&
    segment.centerX !== undefined &&
    segment.centerY !== undefined &&
    segment.radius !== undefined &&
    segment.startAngle !== undefined &&
    segment.endAngle !== undefined
  ) {
    const angle = segment.startAngle + (segment.endAngle - segment.startAngle) * t;

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const baseX = segment.centerX + cosA * segment.radius;
    const baseY = segment.centerY + sinA * segment.radius;

    const dir = segment.endAngle - segment.startAngle >= 0 ? 1 : -1;

    const tanX = (-sinA) * dir;
    const tanY = (cosA) * dir;

    // Left-hand normal to tangent
    const normX = -tanY;
    const normY = tanX;

    const x = baseX + normX * offset;
    const y = baseY + normY * offset;

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return { x: baseX, y: baseY };
    }

    return { x, y };
  }

  return { x: 0, y: 0 };
}

// ─── Track generation ───────────────────────────────────────────────────

/**
 * FIGURE-8 (Lemniscate of Gerono)
 */
function generateFigure8Path(centerX: number, centerY: number, radiusX: number, radiusY: number): PathSegment[] {
  const segments: PathSegment[] = [];

  const a = radiusX;
  const b = radiusY;
  const steps = 320;

  const pts: { x: number; y: number }[] = [];

  for (let i = 0; i <= steps; i++) {
    const tt = (i / steps) * Math.PI * 2;
    const s = Math.sin(tt);
    const c = Math.cos(tt);

    const x = centerX + a * s;
    const y = centerY + b * s * c;

    pts.push({ x, y });
  }

  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.5) continue;

    segments.push({
      type: 'straight',
      length: len,
      startX: p1.x,
      startY: p1.y,
      endX: p2.x,
      endY: p2.y,
    });
  }

  // Close
  const last = pts[pts.length - 1];
  const first = pts[0];
  const dx = first.x - last.x;
  const dy = first.y - last.y;
  const closeLen = Math.sqrt(dx * dx + dy * dy);
  if (closeLen > 0.5) {
    segments.push({
      type: 'straight',
      length: closeLen,
      startX: last.x,
      startY: last.y,
      endX: first.x,
      endY: first.y,
    });
  }

  return segments;
}

/**
 * SPEEDWAY (stadium / rounded-rectangle)
 */
function generateSpeedwayPath(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  trackWidth: number
): PathSegment[] {
  const segments: PathSegment[] = [];

  const straightHalf = width * 0.28;

  const base = Math.min(width, height) * 0.18;
  const minSafe = trackWidth / 2 + 30;
  const turnRadius = Math.max(base, minSafe);

  const leftX = centerX - straightHalf;
  const rightX = centerX + straightHalf;

  const topY = centerY - turnRadius;
  const bottomY = centerY + turnRadius;

  const pts: { x: number; y: number }[] = [];

  // 1) Top straight: left -> right
  const topSteps = 50;
  for (let i = 0; i <= topSteps; i++) {
    const t = i / topSteps;
    pts.push({ x: leftX + (rightX - leftX) * t, y: topY });
  }

  // 2) Right semicircle: -90deg -> +90deg
  const arcSteps = 140;
  for (let i = 1; i <= arcSteps; i++) {
    const t = i / arcSteps;
    const ang = -Math.PI / 2 + Math.PI * t;
    pts.push({
      x: rightX + Math.cos(ang) * turnRadius,
      y: centerY + Math.sin(ang) * turnRadius,
    });
  }

  // 3) Bottom straight: right -> left
  const botSteps = 50;
  for (let i = 1; i <= botSteps; i++) {
    const t = i / botSteps;
    pts.push({ x: rightX + (leftX - rightX) * t, y: bottomY });
  }

  // 4) Left semicircle: +90deg -> +270deg
  for (let i = 1; i <= arcSteps; i++) {
    const t = i / arcSteps;
    const ang = Math.PI / 2 + Math.PI * t;
    pts.push({
      x: leftX + Math.cos(ang) * turnRadius,
      y: centerY + Math.sin(ang) * turnRadius,
    });
  }

  // Close
  pts.push({ ...pts[0] });

  // Convert to PathSegments
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (!Number.isFinite(len) || len < 0.01) continue;

    segments.push({
      type: 'straight',
      length: len,
      startX: p1.x,
      startY: p1.y,
      endX: p2.x,
      endY: p2.y,
    });
  }

  return segments;
}

/**
 * Shared helper: build a smooth CLOSED loop from control points
 * using centripetal Catmull-Rom + arc-length resampling.
 */
function buildSmoothClosedPath(
  control: { x: number; y: number }[],
  samplesPerSpan: number,
  targetStepPx: number,
  alpha: number = 0.5
): PathSegment[] {
  if (control.length < 4) return [];

  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  function catmullRomCentripetal(
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    t: number
  ) {
    const t0 = 0;
    const t1 = t0 + Math.pow(dist(p0, p1), alpha);
    const t2 = t1 + Math.pow(dist(p1, p2), alpha);
    const t3 = t2 + Math.pow(dist(p2, p3), alpha);

    const tt = t1 + (t2 - t1) * t;
    const safe = (v: number) => (Number.isFinite(v) && Math.abs(v) > 1e-9 ? v : 1e-9);

    const A1 = {
      x: (t1 - tt) / safe(t1 - t0) * p0.x + (tt - t0) / safe(t1 - t0) * p1.x,
      y: (t1 - tt) / safe(t1 - t0) * p0.y + (tt - t0) / safe(t1 - t0) * p1.y,
    };
    const A2 = {
      x: (t2 - tt) / safe(t2 - t1) * p1.x + (tt - t1) / safe(t2 - t1) * p2.x,
      y: (t2 - tt) / safe(t2 - t1) * p1.y + (tt - t1) / safe(t2 - t1) * p2.y,
    };
    const A3 = {
      x: (t3 - tt) / safe(t3 - t2) * p2.x + (tt - t2) / safe(t3 - t2) * p3.x,
      y: (t3 - tt) / safe(t3 - t2) * p2.y + (tt - t2) / safe(t3 - t2) * p3.y,
    };

    const B1 = {
      x: (t2 - tt) / safe(t2 - t0) * A1.x + (tt - t0) / safe(t2 - t0) * A2.x,
      y: (t2 - tt) / safe(t2 - t0) * A1.y + (tt - t0) / safe(t2 - t0) * A2.y,
    };
    const B2 = {
      x: (t3 - tt) / safe(t3 - t1) * A2.x + (tt - t1) / safe(t3 - t1) * A3.x,
      y: (t3 - tt) / safe(t3 - t1) * A2.y + (tt - t1) / safe(t3 - t1) * A3.y,
    };

    return {
      x: (t2 - tt) / safe(t2 - t1) * B1.x + (tt - t1) / safe(t2 - t1) * B2.x,
      y: (t2 - tt) / safe(t2 - t1) * B1.y + (tt - t1) / safe(t2 - t1) * B2.y,
    };
  }

  // Dense sampling
  const dense: { x: number; y: number }[] = [];
  const n = control.length;

  for (let i = 0; i < n; i++) {
    const p0 = control[(i - 1 + n) % n];
    const p1 = control[i];
    const p2 = control[(i + 1) % n];
    const p3 = control[(i + 2) % n];

    for (let s = 0; s < samplesPerSpan; s++) {
      dense.push(catmullRomCentripetal(p0, p1, p2, p3, s / samplesPerSpan));
    }
  }
  dense.push(dense[0]); // close

  // Cumulative arc lengths
  const cum: number[] = [0];
  for (let i = 1; i < dense.length; i++) {
    cum[i] = cum[i - 1] + dist(dense[i - 1], dense[i]);
  }
  const total = cum[cum.length - 1];
  if (!Number.isFinite(total) || total < 1) return [];

  // Resample uniformly by distance
  const resampled: { x: number; y: number }[] = [];
  const step = Math.max(3, targetStepPx);

  let d = 0;
  let j = 1;
  resampled.push(dense[0]);

  while (d < total) {
    d += step;
    if (d > total) d = total;

    while (j < cum.length && cum[j] < d) j++;
    const j0 = Math.min(j, cum.length - 1);
    const i0 = Math.max(0, j0 - 1);

    const d0 = cum[i0];
    const d1 = cum[j0];
    const span = d1 - d0;
    const tt = span > 1e-6 ? (d - d0) / span : 0;

    const pA = dense[i0];
    const pB = dense[j0];

    resampled.push({
      x: pA.x + (pB.x - pA.x) * tt,
      y: pA.y + (pB.y - pA.y) * tt,
    });

    if (d >= total) break;
  }

  // Convert to segments
  const segments: PathSegment[] = [];
  for (let i = 0; i < resampled.length - 1; i++) {
    const p1 = resampled[i];
    const p2 = resampled[i + 1];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (!Number.isFinite(len) || len < 0.5) continue;

    segments.push({
      type: 'straight',
      length: len,
      startX: p1.x,
      startY: p1.y,
      endX: p2.x,
      endY: p2.y,
    });
  }

  return segments;
}

/**
 * ROAD COURSE (smooth)
 */
function generateRoadCoursePath(centerX: number, centerY: number, width: number, height: number): PathSegment[] {
  const w = width * 0.82;
  const h = height * 0.64;

  const control = [
    { x: centerX - w * 0.38, y: centerY - h * 0.30 },
    { x: centerX + w * 0.34, y: centerY - h * 0.34 },
    { x: centerX + w * 0.52, y: centerY - h * 0.06 },
    { x: centerX + w * 0.40, y: centerY + h * 0.28 },
    { x: centerX + w * 0.10, y: centerY + h * 0.36 },
    { x: centerX - w * 0.22, y: centerY + h * 0.30 },
    { x: centerX - w * 0.06, y: centerY + h * 0.08 },
    { x: centerX - w * 0.34, y: centerY + h * 0.12 },
    { x: centerX - w * 0.52, y: centerY + h * 0.22 },
    { x: centerX - w * 0.54, y: centerY - h * 0.03 },
    { x: centerX - w * 0.40, y: centerY - h * 0.20 },
  ];

  return buildSmoothClosedPath(control, 50, 5, 0.5);
}
