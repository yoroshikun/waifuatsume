import {
  DOMParser,
  initParser,
} from 'https://deno.land/x/deno_dom/deno-dom-wasm-noinit.ts';
import { WEB_URL } from './consts.ts';
import { dl } from './logger.ts';

const getAuthToken = async (): Promise<string> => {
  await initParser();

  const url = WEB_URL;
  const res = await fetch(url);
  const html = await res.text();
  const parser = new DOMParser().parseFromString(html, 'text/html');
  const scripts = parser?.getElementsByTagName('script');
  const script = scripts?.find((s) => s.innerHTML.includes('window.authToken'));

  if (!script) {
    dl.critical('Failed to find token in html');
    Deno.exit(1);
  }

  const token = script.innerHTML.split('"')[1];
  dl.debug('Token: ' + token);
  return token;
};

export default getAuthToken;
