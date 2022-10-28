import * as log from 'https://deno.land/std/log/mod.ts';

await log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler('DEBUG'),
  },
  loggers: {
    default: {
      level: 'DEBUG',
      handlers: ['console'],
    },
  },
});

const dl = log.getLogger();

const fatalError = (msg: string) => {
  dl.critical('Fatal error: ' + msg);
  Deno.exit(1);
};

export { dl, fatalError };
