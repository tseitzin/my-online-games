import { Car, Position } from '../../../types/race';

const CAR_LENGTH = 48;
const CAR_WIDTH = 22;

export function drawCar(
  ctx: CanvasRenderingContext2D,
  car: Car,
  position: Position,
  rotation: number
): void {
  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(rotation);

  // Drop shadow for depth
  drawShadow(ctx);

  drawNascarBody(ctx, car.color);
  drawCarNumber(ctx, car.number);

  ctx.restore();
}

function drawShadow(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(2, 3, CAR_LENGTH / 2 + 2, CAR_WIDTH / 2 + 1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawNascarBody(ctx: CanvasRenderingContext2D, color: string): void {
  const halfLength = CAR_LENGTH / 2;
  const halfWidth = CAR_WIDTH / 2;

  // Main body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-halfLength + 6, -halfWidth);
  ctx.lineTo(halfLength - 14, -halfWidth);
  ctx.quadraticCurveTo(halfLength, -halfWidth + 2, halfLength, 0);
  ctx.quadraticCurveTo(halfLength, halfWidth - 2, halfLength - 14, halfWidth);
  ctx.lineTo(-halfLength + 6, halfWidth);
  ctx.quadraticCurveTo(-halfLength, halfWidth - 3, -halfLength, 0);
  ctx.quadraticCurveTo(-halfLength, -halfWidth + 3, -halfLength + 6, -halfWidth);
  ctx.closePath();
  ctx.fill();

  // Black outline
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Racing stripe (white, center of car from rear to mid-body)
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-halfLength + 8, 0);
  ctx.lineTo(0, 0);
  ctx.stroke();

  // Spoiler at rear
  ctx.fillStyle = darkenColor(color, 0.6);
  ctx.fillRect(-halfLength + 2, -halfWidth - 1, 4, halfWidth * 2 + 2);

  // Dark interior
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(0, -halfWidth + 2);
  ctx.lineTo(halfLength - 17, -halfWidth + 3);
  ctx.lineTo(halfLength - 14, 0);
  ctx.lineTo(halfLength - 17, halfWidth - 3);
  ctx.lineTo(0, halfWidth - 2);
  ctx.closePath();
  ctx.fill();

  // Blue windshield glass
  ctx.fillStyle = '#87CEEB';
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(2, -halfWidth + 3);
  ctx.lineTo(halfLength - 19, -halfWidth + 4);
  ctx.lineTo(halfLength - 16, 0);
  ctx.lineTo(halfLength - 19, halfWidth - 4);
  ctx.lineTo(2, halfWidth - 3);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // Wheels
  ctx.fillStyle = '#333333';
  ctx.fillRect(-halfLength - 2, -halfWidth - 2, 9, 5);
  ctx.fillRect(-halfLength - 2, halfWidth - 3, 9, 5);
  ctx.fillRect(halfLength - 12, -halfWidth - 1, 7, 4);
  ctx.fillRect(halfLength - 12, halfWidth - 3, 7, 4);

  // Side mirrors
  ctx.fillStyle = '#222222';
  ctx.fillRect(-halfLength + 3, -halfWidth - 4, 3, 2);
  ctx.fillRect(-halfLength + 3, halfWidth + 2, 3, 2);

  // Headlights (front)
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#FFFDE7';
  ctx.beginPath();
  ctx.arc(halfLength - 4, -halfWidth + 4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(halfLength - 4, halfWidth - 4, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Taillights (rear)
  ctx.fillStyle = '#F44336';
  ctx.beginPath();
  ctx.arc(-halfLength + 8, -halfWidth + 3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-halfLength + 8, halfWidth - 3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawCarNumber(ctx: CanvasRenderingContext2D, number: number): void {
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const text = number.toString();
  ctx.strokeText(text, -8, 0);
  ctx.fillText(text, -8, 0);
  ctx.restore();
}

function darkenColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.floor(r * factor)},${Math.floor(g * factor)},${Math.floor(b * factor)})`;
}

export function drawCarPreview(
  ctx: CanvasRenderingContext2D,
  color: string,
  number: number,
  x: number,
  y: number,
  scale: number = 1
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(-Math.PI / 2);

  drawNascarBody(ctx, color);
  drawCarNumber(ctx, number);

  ctx.restore();
}
