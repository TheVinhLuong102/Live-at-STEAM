import React from "react";
import { useCookies } from "react-cookie";
import {
  ChatBox,
  Composer,
  Avatar,
  Form,
  BubbleChat,
  Separator,
  Badge,
  //@ts-ignore
} from "@gotitinc/design-system";
//@ts-ignore

import {
  NewMessagePayload,
  DeleteMessagePayload,
  NewMemberJoined,
  Room,
  Message,
  JoinRoomResponse,
} from "../Types/Common";

import { UserMessageUI, SystemMessageUI } from "./MessageUI";
import FunctionButtonGroup from "./FunctionButtonGroup";
import { useUserData } from "../Hooks/User";
import { useSocket } from "../Hooks/Socket";
import { useChatAnalytics } from "../Hooks/Analytics";

function ChatMessage({
  message_type,
  payload,
  action,
  socket,
}: {
  message_type?: string;
  payload: any;
  action: string;
  socket: SocketIOClient.Socket | null | undefined;
}) {
  switch (action) {
    case "new_member_joined":
      return (
        <SystemMessageUI
          message={`${payload.username} vừa tham gia phòng "${payload.room}".`}
          type="info"
        />
      );
    case "message":
      return (
        <UserMessageUI
          username={payload.username}
          message={payload.msg}
          messageId={payload.message_id}
          message_type={message_type as string}
          socket={socket}
        />
      );
    case "api_message_highlight":
      return <SystemMessageUI message={payload.response} type="error" />;

    case "api_message":
      return <SystemMessageUI message={payload.response} type="info" />;
    default:
      return null;
  }
}

export default function Chatbox() {
  const [messages, updateMessages] = React.useState([] as Message[]);
  const [messageInput, setMessageInput] = React.useState("");
  const [currentRoom, setCurrentRoom] = React.useState(null as null | string);
  const [sendAll, setSendAll] = React.useState(false);
  const [isBanned, setIsBanned] = React.useState(false);
  const socket = useSocket();
  const userData = useUserData();
  const chatAnalytics = useChatAnalytics();

  const isAdmin = userData?.isLoggedIn && userData?.role === 0;

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement> | undefined
  ) => {
    if (event) {
      event.preventDefault();
    }
    let messageToSend = messageInput.trim();
    let event_type = "message";

    //hacky command handling
    if (sendAll) {
      event_type = "global_message";
    } else if (messageInput.startsWith("/join_room")) {
      event_type = "join_room";
      messageToSend = messageInput.replace("/join_room ", "").trim(); // room name
    } else if (messageInput.startsWith("/unban")) {
      event_type = "unban_user";
      messageToSend = messageInput.replace("/unban ", "").trim(); // user name
    } else if (messageInput.startsWith("/ban")) {
      event_type = "ban_user";
      messageToSend = messageInput.replace("/ban_user ", "").trim(); // user name
    }

    socket?.emit(event_type, messageToSend);
    setTimeout(() => setMessageInput(""), 1);
    setSendAll(false);
  };

  React.useEffect(() => {
    if (!socket) return;

    socket.on("message", (payload: NewMessagePayload) => {
      console.log(payload);
      messages.push({
        payload: payload,
        message_type: payload.type,
        action: "message",
      });
      updateMessages([...messages]);
    });

    socket.on("delete_message", (payload: DeleteMessagePayload) => {
      for (let i = 0; i < messages.length; ++i) {
        if (
          messages[i].action === "message" &&
          (messages[i].payload as NewMessagePayload).message_id ===
            payload.message_id
        ) {
          messages[i] = {
            payload: {
              response: "Tin nhắn đã bị xoá bởi admin.",
            },
            action: "api_message_highlight",
          };
          break;
        }
      }

      updateMessages([...messages]);
    });

    socket.on("ban_applied", (username: string) => {
      messages.push({
        payload: {
          response: `${username} đã bị cấm chat!`,
        },
        action: "api_message",
      });

      if (username === userData.username) setIsBanned(true);
      updateMessages([...messages]);
    });

    socket.on("unban_applied", (username: string) => {
      messages.push({
        payload: {
          response: `${username} đã có thể tiếp tục chat!`,
        },
        action: "api_message",
      });

      if (username === userData.username) setIsBanned(false);

      updateMessages([...messages]);
    });

    socket.on("new_member_joined", (payload: NewMemberJoined) => {
      messages.push({
        payload: payload,
        action: "new_member_joined",
      });
      updateMessages([...messages]);
    });

    socket.on("join_room_resp", (payload: JoinRoomResponse) => {
      messages.push({
        payload: payload,
        action: "api_message",
      });

      if (payload.status === 1) setCurrentRoom(payload.room);

      updateMessages([...messages]);
    });

    socket.on("report_user_resp", (payload: any /*TODO: add type*/) => {
      messages.push({
        payload: payload,
        action: "api_message",
      });

      if (payload.status === 1) setCurrentRoom(payload.room);

      updateMessages([...messages]);
    });

    return () => {
      if (socket) socket.close();
    };
  }, [socket]);

  //auto scroll
  React.useEffect(() => {
    var objDiv = document.querySelector(".ChatBox-list > div");

    if (objDiv) objDiv.scrollTop = objDiv.scrollHeight;
  }, [messages]);

  return (
    <React.Fragment>
      {!userData.isLoggedIn && (
        <div className="u-positionAbsolute u-positionFull u-zIndexModal u-flex u-alignItemsEnd">
          <div className="Modal-backDrop u-positionAbsolute u-positionFull u-backgroundBlack u-zIndex2 Show" />
          <div className="u-positionRelative u-zIndex3 u-marginSmall u-marginBottomExtraLarge">
            <BubbleChat
              className="u-marginNone"
              text="Xin chào, đăng nhập vào tài khoản STEAM for Vietnam LMS của bạn để bất đầu chat với các thành viên khác trong phòng chat này!"
              type="outbound"
              avatar={() => (
                <Avatar
                  className="u-flexShrink-0 u-marginRightExtraSmall u-marginTopExtraSmall"
                  src={require("../assets/images/nophoto.svg")}
                />
              )}
            />
          </div>
        </div>
      )}
      <div className="u-flex u-flexColumn u-flexGrow-1">
        <div className="u-backgroundWhite u-borderTop u-borderLeft u-borderRight u-paddingExtraSmall u-text200 u-flex u-flexRow">
          <div className="u-flexGrow-1">
            <div>
              <span>Số phòng chat:&nbsp;</span>
              <span className="u-fontMedium">{chatAnalytics.numRooms}</span>
            </div>
            <div>
              <span>Phòng chat hiện tại:&nbsp;</span>
              <span className="u-fontMedium">{currentRoom}</span>
            </div>
            <div>
              <span>Số người trong phòng:&nbsp;</span>
              <span className="u-fontMedium">{chatAnalytics.rooms.filter((r) => r.name === currentRoom)?.[0]?.count}</span>
            </div>
          </div>
          <FunctionButtonGroup
            isSignedIn={userData.isLoggedIn}
            isAdmin={isAdmin}
            socket={socket}
          />
        </div>
        <ChatBox className="u-border u-backgroundWhite">
          <ChatBox.List>
            {messages.map((m, i) => (
              <ChatMessage key={i} {...m} socket={socket} />
            ))}
          </ChatBox.List>
          <ChatBox.Context>
            <Separator variant="lighter" />
            {isAdmin && (
              <div className="u-paddingExtraSmall">
                <Form.Check
                  id="send_all"
                  checked={sendAll}
                  label="Gửi cho tất cả"
                  onChange={() => setSendAll(!sendAll)}
                />
              </div>
            )}
            <Composer
              className="u-borderTopNone"
              disabledAttachButton
              disabledSendButton={false}
              sendButtonActive={
                messageInput.trim() !== "" && userData.isLoggedIn
              }
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMessageInput(e.target.value)
              }
              inputProps={{
                value: messageInput,
                maxRows: 4,
                placeholder: "Tin nhắn cho lớp ...",
                disabled: !userData.isLoggedIn || userData.isBanned || isBanned,
                onKeyDown: async (e: React.KeyboardEvent<HTMLInputElement>) => {
                  const keyCode = e.keyCode || e.which;
                  if (
                    keyCode === 13 &&
                    !e.shiftKey &&
                    messageInput.trim() !== ""
                  ) {
                    e.preventDefault();
                    handleSubmit(undefined);
                  }
                },
                // TODO: limit
                maxLength: 2000,
              }}
              sendButtonProps={{
                onClick: handleSubmit,
              }}
            />
          </ChatBox.Context>
        </ChatBox>
      </div>
    </React.Fragment>
  );
}
