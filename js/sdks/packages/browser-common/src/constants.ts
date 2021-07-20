// this is only used for the vanilla JS apps which are not currently supported, IE these constants are deprecated
export const __SECURE_FRAME_URL__: string =
  process.env.REACT_APP_SECURE_FRAME_URL || process.env.SECURE_FRAME_URL || 'http://localhost:37766';
export const secureFramePathname = '/frame';
export const secureFrameSessionVerifyPathname = '/session/verify';
