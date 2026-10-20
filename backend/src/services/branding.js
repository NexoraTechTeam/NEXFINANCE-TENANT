'use strict';

const { DEFAULT_PALETTE, generatePaletteFromImage, buildPalette } = require('./palette');

const ALLOWED_FORMATS = new Set(['png', 'jpeg', 'webp', 'svg', 'gif']);
const httpError = (status, message) => Object.assign(new Error(message), { status, expose: true });

/** Public, non-sensitive tenant configuration for the frontend (no ids, no schema). */
function publicConfig(tenant) {
  const branding = tenant.branding || {};
  const school = tenant.schoolInfo || {};
  return {
    slug: tenant.slug,
    name: tenant.name,
    shortName: school.shortName || tenant.name,
    schoolInfo: school,
    palette: branding.palette || DEFAULT_PALETTE,
    logoUrl: branding.logoUpdatedAt ? `/api/v1/tenant/logo?v=${encodeURIComponent(branding.logoUpdatedAt)}` : null,
    loginImageUrl: branding.loginImageUpdatedAt
      ? `/api/v1/tenant/login-image?v=${encodeURIComponent(branding.loginImageUpdatedAt)}` : null,
    showPoweredBy: branding.showPoweredBy !== false,
  };
}

/** Validates and normalises an uploaded logo to a ≤512px PNG. */
async function normaliseLogo(buffer) {
  const sharp = require('sharp');
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw httpError(400, 'Logo file is required');
  let meta;
  try {
    meta = await sharp(buffer).metadata();
  } catch {
    throw httpError(400, 'Logo must be a PNG, JPG, WEBP, GIF or SVG image');
  }
  if (!ALLOWED_FORMATS.has(meta.format)) throw httpError(400, 'Logo must be a PNG, JPG, WEBP, GIF or SVG image');
  return sharp(buffer, { density: 300 }).rotate()
    .resize(512, 512, { fit: 'inside', withoutEnlargement: meta.format !== 'svg' })
    .png().toBuffer();
}

const PHOTO_FORMATS = new Set(['png', 'jpeg', 'webp']);

/** Validates a login page photo and normalises it to a ≤1920px progressive JPEG. */
async function normaliseLoginImage(buffer) {
  const sharp = require('sharp');
  const invalid = () => httpError(400, 'Login image must be a PNG, JPG or WEBP image');
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw httpError(400, 'Login image file is required');
  let meta;
  try {
    meta = await sharp(buffer).metadata();
  } catch {
    throw invalid();
  }
  if (!PHOTO_FORMATS.has(meta.format)) throw invalid();
  return sharp(buffer).rotate()
    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toBuffer();
}

async function paletteFromLogo(buffer) {
  try {
    return await generatePaletteFromImage(buffer);
  } catch (err) {
    throw httpError(400, err.message || 'Could not derive colors from logo');
  }
}

function paletteFromColors(colors) {
  try {
    return buildPalette({ ...colors, source: 'manual' });
  } catch (err) {
    throw httpError(400, err.message);
  }
}

module.exports = {
  publicConfig, normaliseLogo, normaliseLoginImage, paletteFromLogo, paletteFromColors, httpError,
};
