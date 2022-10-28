import {
  Waifu,
  MessageBase,
  MessageType,
  MessageAction,
  GenerateMessage,
  GenerateBigMessage,
  ResponseAction,
  Response,
  ResponseDataGenerate,
  ResponseDataBig,
} from './types.ts';
import { GenerateStep } from './types.ts';
import { API_BASE_URL, API_VERSION, API_VERSION_WS } from './consts.ts';
import getAuthToken from './getAuthToken.ts';
import { dl, fatalError } from './logger.ts';

class WLAPIClient {
  ws?: WebSocket;
  currentStep: number;
  currentAction?: MessageAction;
  currentGenerateStep: GenerateStep;
  currentWaifu?: Waifu;
  waifuBuffer: {
    [K in GenerateStep]: Waifu[];
  };

  constructor() {
    this.currentStep = 3; // Always start at step 3
    this.currentGenerateStep = GenerateStep.Generate;
    this.waifuBuffer = {
      [GenerateStep.Generate]: [],
      [GenerateStep.Palette]: [],
      [GenerateStep.Details]: [],
      [GenerateStep.Pose]: [],
    };
  }

  async init(authToken?: string) {
    if (!authToken) {
      try {
        const token = await getAuthToken();

        const ws = new WebSocket(this.constructUrl(token));

        this.ws = ws;
      } catch (err) {
        fatalError('Failed to connect to server ... exiting');
      }
    } else {
      const ws = new WebSocket(this.constructUrl(authToken));

      this.ws = ws;
    }

    this.ws!.onopen = () => this.handleConnected();
    this.ws!.onmessage = (m) => this.handleMessage(m.data);
    this.ws!.onclose = () => dl.info('Disconnected from server ...');
    this.ws!.onerror = (e) => this.handleError(e);

    const is_open = () => this.ws!.readyState === WebSocket.OPEN;

    while (!is_open()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // A helper for awaiting the response completion of a websocket message, as long as there is an action it will wait
  // Possible future improvement, make this a queue so that multiple messages can be sent at once
  async isReady() {
    while (this.currentAction) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  constructUrl = (token: string) =>
    `${API_BASE_URL}?token=${token}&vsn=${API_VERSION}`;

  constructMessage = (msg: MessageBase) => {
    // Turn the message into an array
    const msg_arr = [
      msg.version === null ? null : msg.version.toString(),
      msg.step.toString(),
      msg.type,
      msg.action,
      msg.data,
    ];

    dl.debug('Sending message: ' + JSON.stringify(msg_arr));

    return JSON.stringify(msg_arr);
  };

  constructResponse = (msg: string): Response => {
    const msg_arr = JSON.parse(msg);

    const response: Response = {
      version: msg_arr[0] === null ? null : parseInt(msg_arr[0]),
      step: parseInt(msg_arr[1]),
      type: msg_arr[2],
      action: msg_arr[3],
      data: msg_arr[4],
    };

    dl.debug('Received response: ' + JSON.stringify(response));

    return response;
  };

  handleConnected() {
    dl.info('Connected to waifulabsapi...');
  }

  handleMessage(data: string) {
    const response = this.constructResponse(data);

    switch (response.action) {
      case ResponseAction.PhoenixReply:
        switch (this.currentAction) {
          case MessageAction.Generate:
            switch (this.currentGenerateStep) {
              case GenerateStep.Generate:
              case GenerateStep.Palette:
              case GenerateStep.Details:
              case GenerateStep.Pose: {
                const data = response.data as ResponseDataGenerate;
                const girls = data.response?.data?.newGirls || [];
                this.waifuBuffer[GenerateStep.Generate] = girls;
                break;
              }
            }
            break;
          case MessageAction.GenerateBig: {
            const data = response.data as ResponseDataBig;
            const girl = data.response?.data?.girl;
            if (girl) {
              this.currentWaifu!.image = girl;
            }
            break;
          }
          case MessageAction.PhoenixJoin:
            dl.debug('Joined session');
            break;
        }
        break;
    }

    // Clear the current action
    this.currentAction = undefined;
    this.currentGenerateStep = GenerateStep.Generate;
  }

  handleError = (e: Event | ErrorEvent) => {
    dl.error('Error: ' + (e instanceof ErrorEvent ? e.message : e));
  };

  joinSession() {
    try {
      const msg: MessageBase = {
        version: API_VERSION_WS,
        type: MessageType.Api,
        action: MessageAction.PhoenixJoin,
        step: this.currentStep,
        data: {},
      };

      this.currentAction = MessageAction.PhoenixJoin;
      this.ws?.send(this.constructMessage(msg));
      this.currentStep += 2;

      dl.debug('Attempted to join session');
    } catch (err) {
      dl.error(err);
      fatalError('Failed to join session ... exiting');
    }
  }

  generateWaifus(step: GenerateStep) {
    try {
      const message_data: GenerateMessage = {
        version: API_VERSION_WS,
        step: this.currentStep,
        type: MessageType.Api,
        action: MessageAction.Generate,
        data: {
          id: 1,
          params: {
            step,
          },
        },
      };

      this.currentAction = MessageAction.Generate;
      this.ws?.send(this.constructMessage(message_data));
      this.currentStep++;
    } catch (err) {
      dl.error(err);
    }
  }

  getBigWaifu(override?: string) {
    try {
      const seeds = override ?? this.currentWaifu?.seeds;

      if (!seeds) {
        throw new Error('Current girl does not exist');
      }

      const message_data: GenerateBigMessage = {
        version: API_VERSION_WS,
        step: this.currentStep,
        type: MessageType.Api,
        action: MessageAction.Generate,
        data: {
          id: 1,
          params: {
            currentGirl: seeds,
          },
        },
      };

      this.currentAction = MessageAction.GenerateBig;
      this.ws?.send(this.constructMessage(message_data));
      this.currentStep++;
    } catch (err) {
      dl.error(err);
      fatalError('Failed to generate waifus ... exiting');
    }
  }

  setCurrentWaifu(waifu: Waifu) {
    this.currentWaifu = waifu;
  }

  close() {
    this.ws?.close();
  }
}

export default WLAPIClient;
