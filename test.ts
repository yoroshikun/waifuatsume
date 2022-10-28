import { GenerateStep } from './utils/api/types.ts';
import Client from './utils/api/client.ts';

const client = new Client();
await client.init();
client.joinSession();
await client.isReady();
client.generateWaifus(0);
await client.isReady();
client.setCurrentWaifu(client.waifuBuffer[GenerateStep.Generate][0]);
client.close();
// Get the current waifu and save it to a file
// The waifu image is base64 encoded
// const waifu = client.currentWaifu;
// const image = waifu!.image;
// export.asFile('waifu.png', image);

// `client.getBigWaifu();
// await client.isReady();
// const bigWaifu = decode(client.currentWaifu!.image);
// await Deno.writeFile('big.png', bigWaifu);`
