// Copyright 2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import heicConvert from 'heic-convert';
import { parentPort } from 'worker_threads';

import {
  WrappedWorkerRequest,
  WrappedWorkerResponse,
} from './heicConverterMain';

if (!parentPort) {
  throw new Error('Must run as a worker thread');
}

const port = parentPort;

function respond(uuid: string, error: Error | undefined, response?: File) {
  const wrappedResponse: WrappedWorkerResponse = {
    uuid,
    error: error ? error.stack : undefined,
    response,
  };
  port.postMessage(wrappedResponse);
}

port.on('message', async ({ uuid, data }: WrappedWorkerRequest) => {
  try {
    const file = await heicConvert({
      buffer: new Uint8Array(data),
      format: 'JPEG',
      quality: 0.75,
    });

    respond(uuid, undefined, file);
  } catch (error) {
    respond(uuid, error, undefined);
  }
});
