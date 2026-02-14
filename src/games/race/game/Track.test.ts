import { describe, it, expect, vi } from 'vitest'

// IMPORTANT: import helpers BEFORE Track so that the Path2D mock is set up first
import { createMockCanvasContext } from '../test/raceTestHelpers'

import {
  calculateTrackDimensions,
  getPositionAndRotation,
  getPositionOnTrack,
  getRotationAtPosition,
  drawTrack,
} from './Track'
import { TrackType } from '../../../types/race'
import { TRACK_CONFIG } from '../../../constants/race'

// ─── Section 1: Math / Geometry ─────────────────────────────────────────────

describe('Track math and geometry', () => {
  // ── calculateTrackDimensions ──────────────────────────────────────────

  describe('calculateTrackDimensions', () => {
    it('Oval: returns correct center, radii, and no pathSegments', () => {
      const dims = calculateTrackDimensions(1200, 800, 4, TrackType.Oval)

      expect(dims.centerX).toBe(600)
      expect(dims.centerY).toBe(400)
      expect(dims.radiusX).toBeCloseTo(1200 * 0.42)
      expect(dims.radiusY).toBeCloseTo(800 * 0.38)
      expect(dims.laneCount).toBe(4)
      expect(dims.pathSegments).toBeUndefined()
      expect(dims.totalLength).toBeUndefined()
      expect(dims.cumulativeDistances).toBeUndefined()
      expect(dims.cachedPath).toBeUndefined()
    })

    it('Speedway: returns pathSegments, totalLength > 0, and cumulativeDistances', () => {
      const dims = calculateTrackDimensions(1200, 800, 4, TrackType.Speedway)

      expect(dims.pathSegments).toBeDefined()
      expect(dims.pathSegments!.length).toBeGreaterThan(0)
      expect(dims.totalLength).toBeDefined()
      expect(dims.totalLength!).toBeGreaterThan(0)
      expect(dims.cumulativeDistances).toBeDefined()
      expect(dims.cumulativeDistances!.length).toBe(dims.pathSegments!.length + 1)
      expect(dims.cumulativeDistances![0]).toBe(0)
      expect(dims.cachedPath).toBeDefined()
    })

    it('Figure8: returns pathSegments with totalLength > 0', () => {
      const dims = calculateTrackDimensions(1200, 800, 4, TrackType.Figure8)

      expect(dims.pathSegments).toBeDefined()
      expect(dims.pathSegments!.length).toBeGreaterThan(0)
      expect(dims.totalLength).toBeDefined()
      expect(dims.totalLength!).toBeGreaterThan(0)
      expect(dims.cumulativeDistances).toBeDefined()
      expect(dims.cachedPath).toBeDefined()
    })

    it('RoadCourse: returns pathSegments with totalLength > 0', () => {
      const dims = calculateTrackDimensions(1200, 800, 4, TrackType.RoadCourse)

      expect(dims.pathSegments).toBeDefined()
      expect(dims.pathSegments!.length).toBeGreaterThan(0)
      expect(dims.totalLength).toBeDefined()
      expect(dims.totalLength!).toBeGreaterThan(0)
      expect(dims.cumulativeDistances).toBeDefined()
      expect(dims.cachedPath).toBeDefined()
    })

    it('trackWidth increases with laneCount', () => {
      const dims2 = calculateTrackDimensions(1200, 800, 2, TrackType.Oval)
      const dims6 = calculateTrackDimensions(1200, 800, 6, TrackType.Oval)

      // trackWidth = laneCount * TRACK_CONFIG.laneSpacing + 40
      expect(dims2.trackWidth).toBe(2 * TRACK_CONFIG.laneSpacing + 40)
      expect(dims6.trackWidth).toBe(6 * TRACK_CONFIG.laneSpacing + 40)
      expect(dims6.trackWidth).toBeGreaterThan(dims2.trackWidth)
    })
  })

  // ── getPositionAndRotation ────────────────────────────────────────────

  describe('getPositionAndRotation', () => {
    it('Oval at progress 0: position near top of ellipse (centerX, centerY - radiusY)', () => {
      const dims = calculateTrackDimensions(1200, 800, 4, TrackType.Oval)
      // progress 0 maps to angle = -PI/2 which is top of ellipse
      // For the center lane with 4 lanes, lane offset should be near zero at lane (4-1)/2 = 1.5
      // Use lane 0 and expect position near the top
      const centerLane = (dims.laneCount - 1) / 2
      const result = getPositionAndRotation(0, centerLane, dims)

      // At progress 0, angle = -PI/2 so base position is (centerX, centerY - radiusY)
      expect(result.position.x).toBeCloseTo(dims.centerX, -1)
      expect(result.position.y).toBeCloseTo(dims.centerY - dims.radiusY, -1)
      expect(Number.isFinite(result.rotation)).toBe(true)
    })

    it('Oval at progress 0.5: position near bottom of ellipse (centerX, centerY + radiusY)', () => {
      const dims = calculateTrackDimensions(1200, 800, 4, TrackType.Oval)
      const centerLane = (dims.laneCount - 1) / 2
      const result = getPositionAndRotation(0.5, centerLane, dims)

      // At progress 0.5, angle = PI/2 so base position is (centerX, centerY + radiusY)
      expect(result.position.x).toBeCloseTo(dims.centerX, -1)
      expect(result.position.y).toBeCloseTo(dims.centerY + dims.radiusY, -1)
    })

    it('Oval positions lie on the ellipse (within tolerance)', () => {
      const dims = calculateTrackDimensions(1200, 800, 4, TrackType.Oval)
      const centerLane = (dims.laneCount - 1) / 2

      // Sample several progress values for the center lane (offset = 0)
      const progressValues = [0, 0.1, 0.25, 0.5, 0.75, 0.9]

      for (const p of progressValues) {
        const { position } = getPositionAndRotation(p, centerLane, dims)

        // Point should satisfy the ellipse equation (x - cx)^2/rx^2 + (y - cy)^2/ry^2 ≈ 1
        const nx = (position.x - dims.centerX) / dims.radiusX
        const ny = (position.y - dims.centerY) / dims.radiusY
        const ellipseValue = nx * nx + ny * ny

        // Allow some tolerance for floating point
        expect(ellipseValue).toBeCloseTo(1, 0)
      }
    })

    it('Speedway: returns finite positions at various progress values', () => {
      const dims = calculateTrackDimensions(1200, 800, 4, TrackType.Speedway)

      const progressValues = [0, 0.25, 0.5, 0.75, 0.99]
      for (const p of progressValues) {
        const result = getPositionAndRotation(p, 0, dims)
        expect(Number.isFinite(result.position.x)).toBe(true)
        expect(Number.isFinite(result.position.y)).toBe(true)
        expect(Number.isFinite(result.rotation)).toBe(true)
      }
    })

    it('lane offset shifts position perpendicular to travel direction', () => {
      const dims = calculateTrackDimensions(1200, 800, 4, TrackType.Oval)

      // Compare lane 0 (inside) vs lane 3 (outside) at the same progress
      const inner = getPositionAndRotation(0.25, 0, dims)
      const outer = getPositionAndRotation(0.25, 3, dims)

      // The positions must differ — lane offset moves them apart
      const dx = inner.position.x - outer.position.x
      const dy = inner.position.y - outer.position.y
      const separation = Math.sqrt(dx * dx + dy * dy)

      // 4 lanes with laneSpacing=30 → lanes 0 and 3 are 3 * 30 = 90 units apart
      expect(separation).toBeGreaterThan(50)
      expect(separation).toBeLessThan(150)
    })
  })

  // ── getPositionOnTrack ────────────────────────────────────────────────

  describe('getPositionOnTrack', () => {
    it('returns the same position as getPositionAndRotation().position', () => {
      const dims = calculateTrackDimensions(1200, 800, 4, TrackType.Oval)
      const progress = 0.3
      const lane = 2

      const posOnly = getPositionOnTrack(progress, lane, dims)
      const combined = getPositionAndRotation(progress, lane, dims)

      expect(posOnly.x).toBeCloseTo(combined.position.x)
      expect(posOnly.y).toBeCloseTo(combined.position.y)
    })
  })

  // ── getRotationAtPosition ─────────────────────────────────────────────

  describe('getRotationAtPosition', () => {
    it('without dimensions returns simple angle formula: progress * 2PI - PI/2 + PI/2 = progress * 2PI', () => {
      // Formula: angle = progress * Math.PI * 2 - Math.PI / 2; return angle + Math.PI / 2
      // Simplifies to: progress * 2 * PI
      const rotation = getRotationAtPosition(0.25)
      const expected = 0.25 * Math.PI * 2
      expect(rotation).toBeCloseTo(expected)
    })

    it('with dimensions delegates to getPositionAndRotation', () => {
      const dims = calculateTrackDimensions(1200, 800, 4, TrackType.Oval)
      const rotation = getRotationAtPosition(0.5, dims)
      const expected = getPositionAndRotation(0.5, 0, dims).rotation
      expect(rotation).toBeCloseTo(expected)
    })
  })
})

// ─── Section 2: Canvas drawing smoke tests ──────────────────────────────────

describe('Track drawing (canvas smoke tests)', () => {
  function makeCtx() {
    return createMockCanvasContext()
  }

  it('drawTrack with Oval dimensions does not throw', () => {
    const ctx = makeCtx()
    const dims = calculateTrackDimensions(1200, 800, 4, TrackType.Oval)

    expect(() => drawTrack(ctx, dims)).not.toThrow()
  })

  it('drawTrack with Oval dimensions calls ctx.fillRect for background', () => {
    const ctx = makeCtx()
    const dims = calculateTrackDimensions(1200, 800, 4, TrackType.Oval)
    drawTrack(ctx, dims)

    // fillRect is called at least once for the grass background
    expect(ctx.fillRect).toHaveBeenCalled()
    // First call should be the full canvas background
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 1200, 800)
  })

  it('drawTrack with Speedway dimensions does not throw', () => {
    const ctx = makeCtx()
    const dims = calculateTrackDimensions(1200, 800, 4, TrackType.Speedway)

    expect(() => drawTrack(ctx, dims)).not.toThrow()
  })

  it('drawTrack with Figure8 dimensions does not throw', () => {
    const ctx = makeCtx()
    const dims = calculateTrackDimensions(1200, 800, 4, TrackType.Figure8)

    expect(() => drawTrack(ctx, dims)).not.toThrow()
  })

  it('drawTrack with RoadCourse dimensions does not throw', () => {
    const ctx = makeCtx()
    const dims = calculateTrackDimensions(1200, 800, 4, TrackType.RoadCourse)

    expect(() => drawTrack(ctx, dims)).not.toThrow()
  })

  it('drawTrack draws scenery (trees, bushes via arc and ellipse calls)', () => {
    const ctx = makeCtx()
    const dims = calculateTrackDimensions(1200, 800, 4, TrackType.Oval)
    drawTrack(ctx, dims)

    // Scenery uses beginPath + arc for grass speckles and trees
    expect(ctx.beginPath).toHaveBeenCalled()
    expect(ctx.arc).toHaveBeenCalled()
    // Bushes use ellipse
    expect(ctx.ellipse).toHaveBeenCalled()
  })

  it('drawTrack draws grandstands (fillRect called multiple times for stands)', () => {
    const ctx = makeCtx()
    const dims = calculateTrackDimensions(1200, 800, 4, TrackType.Oval)
    drawTrack(ctx, dims)

    // fillRect is used for background, tree trunks, grandstand structures, roofs, and start line checkers
    // Grandstands alone account for 2 stands (fillRect each) + 2 roofs (fillRect each)
    // Plus background + tree trunks + start line checkerboard squares
    const fillRectCallCount = (ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length
    expect(fillRectCallCount).toBeGreaterThan(5)
  })

  it('drawTrack draws start line (save/restore and rotate are called)', () => {
    const ctx = makeCtx()
    const dims = calculateTrackDimensions(1200, 800, 4, TrackType.Oval)
    drawTrack(ctx, dims)

    // drawStartLine uses save/translate/rotate/restore for the checkerboard
    expect(ctx.save).toHaveBeenCalled()
    expect(ctx.translate).toHaveBeenCalled()
    expect(ctx.rotate).toHaveBeenCalled()
    expect(ctx.restore).toHaveBeenCalled()
  })

  it('drawTrack with path-based track calls stroke for track surface', () => {
    const ctx = makeCtx()
    const dims = calculateTrackDimensions(1200, 800, 4, TrackType.Speedway)
    drawTrack(ctx, dims)

    // Path-based tracks use ctx.stroke(cachedPath) for the track surface + dashed center line
    expect(ctx.stroke).toHaveBeenCalled()
    // setLineDash is called for the dashed center line (and to reset it)
    expect(ctx.setLineDash).toHaveBeenCalled()
  })
})
