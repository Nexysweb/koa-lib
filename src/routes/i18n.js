import Router from 'koa-router';
import fs from 'fs';

import JWT from '../middleware/jwt';

import {I18n as i18nService} from '@nexys/lib';

const fsp = fs.promises;

/**
 * this files serves and refreshes i18n 
 *
 * there are a few cases
 *
 * - nothing exists: the application is served with no translated content
 * - the file exists: the application fetches the file and displays the translations
 * - deprecated: reloads the translation every time the application is reloaded.
 */
const getContent = async (locale, i = 0) => {
  const filepath = `locales/${locale}.json`;

  try {
    // check if file exists
    // https://stackoverflow.com/questions/4482686/check-synchronously-if-file-directory-exists-in-node-js
    await fsp.access(filepath);

    // read file async https://stackoverflow.com/questions/34628305/using-promises-with-fs-readfile-in-a-loop
    return await fsp.readFile(filepath, 'utf8');
  } catch (error) {
    // The check failed
    
    // on the first attempt, try to load the files and the refreshes
    if (i === 0) {
      await i18nService.saveAll();
      return await getContent(locale, i+ 1);
    }

    return {};
  }
}

const router = new Router();

// serves the translations
router.get('/:locale/serve', async ctx => {
  const { locale } = ctx.params;

  const json = await getContent(locale);
  
  ctx.set({'Content-Type': 'application/json'});
  ctx.status = 200;
  ctx.body = json;
});

// refreshed the translations
router.get('/refresh', JWT.isAuthorized(['i18n']), async (ctx, next) => {
  await i18nService.saveAll();
  ctx.ok({ msg: 'refresh.success' });
});


const routes = router.routes();
export default routes;

/*
router.get('/:locale/dev', async ctx => {
  console.log('locale')
  const { locale } = ctx.params;
  //const messages = await i18nService.get(locale);
 

  console.log(ctx);
  console.log(ctx.request.url);
  console.log(locale)
  //ctx.ok(messages);

   const url = `/i18n/${locale}/serve`;

   ctx.redirect(url);
});*/