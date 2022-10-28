// Some export helpers
import { decode } from 'https://deno.land/std@0.161.0/encoding/base64.ts';
import { Buffer } from 'https://deno.land/std@0.161.0/io/buffer.ts';

const asFile = async (path: string, image: string) => {
  const data = decode(image);
  await Deno.writeFile(path, data);
};

const asBlob = (image: string) => {
  const data = decode(image);
  return new Blob([data]);
};

const asDataUri = (image: string) => {
  return `data:image/png;base64,${image}`;
};

const asBuffer = (image: string) => decode(image);

export { asFile, asBlob, asDataUri, asBuffer };
