//------ Enums ------
export enum GenerateStep {
  Generate = 0,
  Palette = 1,
  Details = 2,
  Pose = 3,
}

export enum MessageType {
  Api = 'api',
  Phoenix = 'phoenix',
}

export enum MessageAction {
  PhoenixJoin = 'phx_join',
  Generate = 'generate',
  GenerateBig = 'generate_big',
}

export enum ResponseAction {
  PhoenixReply = 'phx_reply',
}

//------ Interfaces ------

export interface Waifu {
  image: string;
  seeds: string;
}

//------ Messages ------
export interface MessageBase {
  version: number | null;
  step: number;
  type: MessageType;
  action: string;
  data: Record<string, any>;
}

export interface GenerateMessage extends MessageBase {
  data: {
    id: number;
    params: {
      step: GenerateStep;
    };
  };
}

export interface GenerateBigMessage extends MessageBase {
  data: {
    id: number;
    params: {
      currentGirl: string;
    };
  };
}

//------ Responses ------

export type ResponseData =
  | ResponseDataBase
  | ResponseDataGenerate
  | ResponseDataBig;

export interface Response {
  version: number | null;
  step: number;
  type: MessageType;
  action: ResponseAction;
  data: ResponseData;
}

export interface ResponseDataBase {
  response?: {
    data?: {
      id: number;
    };
    reason?: string;
  };
  status: 'ok' | 'error';
}

export interface ResponseDataGenerate extends ResponseDataBase {
  response?: {
    data?: {
      id: number;
      newGirls: Waifu[];
    };
  };
}

export interface ResponseDataBig extends ResponseDataBase {
  response?: {
    data?: {
      id: number;
      girl: string;
    };
  };
}
