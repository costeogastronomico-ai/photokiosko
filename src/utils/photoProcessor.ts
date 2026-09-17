import { BrandingConfig, PhotoSettingsConfig } from '../types.js';

export async function processBrandedPhoto(
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
  branding: BrandingConfig,
  photoSettings: PhotoSettingsConfig,
  isMirrored = true
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain 2D canvas context');

  // Determine canvas output dimensions based on target aspect ratio
  let targetWidth = 1600;
  let targetHeight = 1200; // 4:3 default

  if (photoSettings.aspectRatio === '1:1') {
    targetWidth = 1400;
    targetHeight = 1400;
  } else if (photoSettings.aspectRatio === '16:9') {
    targetWidth = 1920;
    targetHeight = 1080;
  } else if (photoSettings.aspectRatio === '3:4') {
    targetWidth = 1200;
    targetHeight = 1600;
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Source dimensions
  let srcWidth = 0;
  let srcHeight = 0;
  if (source instanceof HTMLVideoElement) {
    srcWidth = source.videoWidth || 1280;
    srcHeight = source.videoHeight || 720;
  } else if (source instanceof HTMLImageElement) {
    srcWidth = source.naturalWidth || source.width;
    srcHeight = source.naturalHeight || source.height;
  } else {
    srcWidth = source.width;
    srcHeight = source.height;
  }

  // Calculate cropping (cover mode to avoid distortion)
  const targetRatio = targetWidth / targetHeight;
  const srcRatio = srcWidth / srcHeight;
  let cropWidth = srcWidth;
  let cropHeight = srcHeight;
  let cropX = 0;
  let cropY = 0;

  if (srcRatio > targetRatio) {
    // Source is wider than target
    cropWidth = srcHeight * targetRatio;
    cropX = (srcWidth - cropWidth) / 2;
  } else {
    // Source is taller than target
    cropHeight = srcWidth / targetRatio;
    cropY = (srcHeight - cropHeight) / 2;
  }

  // Draw camera image (with optional horizontal mirror for natural selfie feel)
  ctx.save();
  if (isMirrored) {
    ctx.translate(targetWidth, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, cropX, cropY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
  ctx.restore();

  // 1. Draw Graphic Frame if configured
  drawFrame(ctx, targetWidth, targetHeight, branding);

  // 2. Draw Text Overlay
  drawTextOverlay(ctx, targetWidth, targetHeight, branding);

  // 3. Draw Logo Overlay
  if (branding.logoUrl) {
    await drawLogo(ctx, targetWidth, targetHeight, branding);
  }

  return canvas.toDataURL('image/jpeg', 0.94);
}

function drawFrame(ctx: CanvasRenderingContext2D, width: number, height: number, branding: BrandingConfig) {
  const { frameStyle, frameColor, frameWidth } = branding;
  if (frameStyle === 'none' || frameWidth <= 0) return;

  ctx.save();

  if (frameStyle === 'modern-clean') {
    // Solid border with subtle inner glow
    ctx.strokeStyle = frameColor || '#2563eb';
    ctx.lineWidth = frameWidth;
    ctx.strokeRect(frameWidth / 2, frameWidth / 2, width - frameWidth, height - frameWidth);

    // Inner hairline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(frameWidth + 4, frameWidth + 4, width - (frameWidth + 4) * 2, height - (frameWidth + 4) * 2);
  } else if (frameStyle === 'gold-elegant') {
    // Gold gradient border
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.3, '#ca8a04');
    grad.addColorStop(0.7, '#fef08a');
    grad.addColorStop(1, '#a16207');

    ctx.strokeStyle = grad;
    ctx.lineWidth = frameWidth * 1.2;
    ctx.strokeRect(frameWidth * 0.6, frameWidth * 0.6, width - frameWidth * 1.2, height - frameWidth * 1.2);

    // Corner accents
    const cornerSize = 60;
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#fef08a';
    // Top-left
    ctx.strokeRect(frameWidth * 1.2, frameWidth * 1.2, cornerSize, cornerSize);
    // Top-right
    ctx.strokeRect(width - frameWidth * 1.2 - cornerSize, frameWidth * 1.2, cornerSize, cornerSize);
    // Bottom-left
    ctx.strokeRect(frameWidth * 1.2, height - frameWidth * 1.2 - cornerSize, cornerSize, cornerSize);
    // Bottom-right
    ctx.strokeRect(width - frameWidth * 1.2 - cornerSize, height - frameWidth * 1.2 - cornerSize, cornerSize, cornerSize);
  } else if (frameStyle === 'neon-tech') {
    // Tech glowing frame
    ctx.shadowColor = frameColor || '#38bdf8';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = frameColor || '#38bdf8';
    ctx.lineWidth = frameWidth;
    ctx.strokeRect(frameWidth / 2, frameWidth / 2, width - frameWidth, height - frameWidth);

    // Tech corner ticks
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    const tickLen = 40;
    // Corners
    ctx.beginPath();
    ctx.moveTo(frameWidth, frameWidth + tickLen);
    ctx.lineTo(frameWidth, frameWidth);
    ctx.lineTo(frameWidth + tickLen, frameWidth);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width - frameWidth - tickLen, frameWidth);
    ctx.lineTo(width - frameWidth, frameWidth);
    ctx.lineTo(width - frameWidth, frameWidth + tickLen);
    ctx.stroke();
  } else if (frameStyle === 'badge-corner') {
    // Minimal border with corner badges
    ctx.strokeStyle = frameColor || '#2563eb';
    ctx.lineWidth = Math.max(6, frameWidth * 0.5);
    ctx.strokeRect(20, 20, width - 40, height - 40);
  } else if (frameStyle === 'minimal-card') {
    // Soft outer matting
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.fillRect(0, 0, width, frameWidth);
    ctx.fillRect(0, height - frameWidth, width, frameWidth);
    ctx.fillRect(0, 0, frameWidth, height);
    ctx.fillRect(width - frameWidth, 0, frameWidth, height);
  }

  ctx.restore();
}

function drawTextOverlay(ctx: CanvasRenderingContext2D, width: number, height: number, branding: BrandingConfig) {
  const { overlayText, textPosition, textColor, textBgColor, textFontSize, textAlign } = branding;
  if (!overlayText || textPosition === 'none') return;

  ctx.save();
  const scaledFontSize = Math.round(textFontSize * (width / 1000));
  ctx.font = `bold ${scaledFontSize}px "Plus Jakarta Sans", sans-serif`;

  const paddingY = Math.round(scaledFontSize * 0.7);
  const paddingX = Math.round(scaledFontSize * 1.2);
  const textMetrics = ctx.measureText(overlayText);
  const textWidth = textMetrics.width;

  const barHeight = scaledFontSize + paddingY * 2;
  const barY = textPosition === 'top' ? 24 : height - barHeight - 24;

  if (textAlign === 'center') {
    // Draw centered rounded banner
    const bannerWidth = Math.min(width - 60, textWidth + paddingX * 2);
    const bannerX = (width - bannerWidth) / 2;

    ctx.fillStyle = textBgColor || 'rgba(15, 23, 42, 0.85)';
    drawRoundRect(ctx, bannerX, barY, bannerWidth, barHeight, 14);
    ctx.fill();

    ctx.fillStyle = textColor || '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(overlayText, width / 2, barY + barHeight / 2);
  } else if (textAlign === 'left') {
    const bannerWidth = Math.min(width - 60, textWidth + paddingX * 2);
    const bannerX = 30;

    ctx.fillStyle = textBgColor || 'rgba(15, 23, 42, 0.85)';
    drawRoundRect(ctx, bannerX, barY, bannerWidth, barHeight, 14);
    ctx.fill();

    ctx.fillStyle = textColor || '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(overlayText, bannerX + paddingX, barY + barHeight / 2);
  } else {
    const bannerWidth = Math.min(width - 60, textWidth + paddingX * 2);
    const bannerX = width - bannerWidth - 30;

    ctx.fillStyle = textBgColor || 'rgba(15, 23, 42, 0.85)';
    drawRoundRect(ctx, bannerX, barY, bannerWidth, barHeight, 14);
    ctx.fill();

    ctx.fillStyle = textColor || '#ffffff';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(overlayText, bannerX + bannerWidth - paddingX, barY + barHeight / 2);
  }

  ctx.restore();
}

async function drawLogo(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  branding: BrandingConfig
): Promise<void> {
  const { logoUrl, logoPosition, logoSize, logoMargin, logoOpacity } = branding;
  if (!logoUrl) return;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.save();
      ctx.globalAlpha = Math.max(0.1, Math.min(1.0, logoOpacity || 1.0));

      const naturalAspect = img.width / img.height;
      // logoSize is % of width (e.g. 15% -> 0.15 * width)
      const targetLogoWidth = Math.round(width * ((logoSize || 18) / 100));
      const targetLogoHeight = Math.round(targetLogoWidth / naturalAspect);
      const margin = Math.round((logoMargin || 24) * (width / 1000));

      let x = margin;
      let y = margin;

      switch (logoPosition) {
        case 'top-left':
          x = margin;
          y = margin;
          break;
        case 'top-right':
          x = width - targetLogoWidth - margin;
          y = margin;
          break;
        case 'bottom-left':
          x = margin;
          y = height - targetLogoHeight - margin;
          break;
        case 'bottom-right':
          x = width - targetLogoWidth - margin;
          y = height - targetLogoHeight - margin;
          break;
        case 'center':
          x = (width - targetLogoWidth) / 2;
          y = (height - targetLogoHeight) / 2;
          break;
      }

      ctx.drawImage(img, x, y, targetLogoWidth, targetLogoHeight);
      ctx.restore();
      resolve();
    };
    img.onerror = () => {
      console.warn('Failed to load branding logo for composition:', logoUrl);
      resolve();
    };
    img.src = logoUrl;
  });
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
