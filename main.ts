import { serve } from 'https://deno.land/std@0.140.0/http/server.ts';
import Client from './utils/api/client.ts';
import { asBlob, asBuffer } from './utils/api/export.ts';

serve(async (_req) => {
  const client = new Client();
  await client.init();
  client.joinSession();
  await client.isReady();
  client.generateWaifus(0);
  await client.isReady();
  client.setCurrentWaifu(client.waifuBuffer[0][0]);
  client.close();

  return new Response(asBuffer(client.currentWaifu!.image), {
    headers: {
      'content-type': 'image/png',
      'content-length': asBuffer(client.currentWaifu!.image).length.toString(),
    },
  });
});
