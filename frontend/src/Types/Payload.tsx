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