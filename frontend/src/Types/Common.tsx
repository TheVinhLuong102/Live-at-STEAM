export type NewMessagePayload = {
  username: string;
  message_id: string;
  msg: string;
  type: string;
};

export type DeleteMessagePayload = {
  message_id: string;
};

export type NewMemberJoined = {
  username: string;
  room: string;
};

export type Room = {
  name: string;
  count: number;
};

export type Message = {
  message_type?: string;
  payload: any;
  action: string;
};

export type JoinRoomResponse = {
  status: number;
  response: string;
  username: string;
  room: string;
};
