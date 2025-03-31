import { promisify } from 'util';

import { Canvas } from 'canvas'; // Import Canvas type from 'canvas'

export function toBufferAsync(canvas: Canvas) {
  return promisify(canvas.toBuffer.bind(canvas))() as Promise<Buffer>;
}
