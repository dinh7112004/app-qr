import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Thiết kế chuẩn dựa trên iPhone 11/13 (375x812)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Kiểm tra thiết bị có phải Tablet/iPad không
export const IS_TABLET = SCREEN_WIDTH >= 768;

/**
 * Tỉ lệ điều chỉnh cho iPad để tránh mọi thứ quá to
 */
const tabletFactor = IS_TABLET ? 0.65 : 1;

/**
 * Scale theo chiều ngang (cho width, marginHorizontal, paddingHorizontal, v.v.)
 */
export const s = (size: number) => {
  const scaledSize = (SCREEN_WIDTH / guidelineBaseWidth) * size;
  return IS_TABLET ? size * 1.3 : scaledSize; // Giới hạn scale trên iPad
};

/**
 * Scale theo chiều dọc (cho height, marginVertical, paddingVertical, v.v.)
 */
export const vs = (size: number) => {
  const scaledSize = (SCREEN_HEIGHT / guidelineBaseHeight) * size;
  return IS_TABLET ? size * 1.2 : scaledSize;
};

/**
 * Scale tổng hợp (thường dùng cho font size, icon size)
 */
export const ms = (size: number, factor = 0.5) => {
  const scaledSize = size + (s(size) - size) * factor;
  // Trên iPad giới hạn font size không quá 1.5 lần
  return IS_TABLET ? Math.min(scaledSize, size * 1.4) : scaledSize;
};

export const window = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};

export { SCREEN_WIDTH, SCREEN_HEIGHT };
