import { promisify } from 'util';

import { Canvas, CanvasRenderingContext2D } from 'canvas'; // Import Canvas type from 'canvas'

export function toBufferAsync(canvas: Canvas) {
  return promisify(canvas.toBuffer.bind(canvas))() as Promise<Buffer>;
}

// Experimental method to switch context to grayscale, usefull for next proccesing, for example OCR
export function imageDataToGrayscale(
  canvas: Canvas,
  context: CanvasRenderingContext2D,
) {
  // Convert image to grayscale manually
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    // Grayscale formula: (0.3 * R) + (0.59 * G) + (0.11 * B)
    const grayscale = 0.3 * r + 0.59 * g + 0.11 * b;

    pixels[i] = grayscale; // Red channel
    pixels[i + 1] = grayscale; // Green channel
    pixels[i + 2] = grayscale; // Blue channel
    // Alpha channel remains unchanged (pixels[i + 3])
  }

  context.putImageData(imageData, 0, 0);
}
