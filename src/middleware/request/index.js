import { HTTP } from '@nexys/lib';


export const info = async (ctx, next) => {
  const { userAgent, ip, host } = ctx;

  if (!userAgent) {
    throw new HTTP.Error('UserAgent middleware not configured', 500);
  }

  const { isMobile, isTablet, os, platform, browser, version, source } = userAgent;

  ctx.state.info = {
    ip,
    host,
    isMobile,
    isTablet,
    browser: browser + ' ' + version,
    platform,
    source,
    os
  };

  await next();
}