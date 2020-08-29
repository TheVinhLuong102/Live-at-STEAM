import React from "react";
import { useCookies } from "react-cookie";
import {
  ChatBox,
  Composer,
  Avatar,
  Form,
  Button,
  Icon,
  Dropdown,
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
} from "../Types/Common";

import {UserMessageUI, SystemMessageUI} from "./MessageUI";
import FunctionButtonGroup from "./FunctionButtonGroup";
import { useUserData } from "../Hooks/User";
import { useSocket } from "../Hooks/Socket";


function ChatMessage({ message_type, payload, action }: Message) {
  switch (action) {
    case "new_member_joined":
      return (
        <SystemMessageUI
          message={`${payload.username} just joined the room "${payload.room}"`}
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
        />
      );
    case "api_message":
      return <SystemMessageUI message={payload.response} type="error" />;
    default:
      return null;
  }
}



export default function Chatbox() {
  const [messages, updateMessages] = React.useState([] as Message[]);
  const [messageInput, setMessageInput] = React.useState("");
  const [rooms, setRooms] = React.useState([] as Room[]);
  const [sendAll, setSendAll] = React.useState(false);
  const [show, setShow] = React.useState(false);
  const socket = useSocket();
  const userData = useUserData();

  const isAdmin = userData?.isLoggedIn && userData?.role === 0;

  const loadRooms = () => {
    fetch(`/api/getRooms`, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "Content-type": "application/json",
      },
    })
      .then((r) => r.json())
      .then((r) => {
        console.log(r);
        let response: Room[] = r.response;
        console.log(response);
        setRooms(response);
      })
      .catch((e) => {
        console.error(e);
      });
  };

  const joinRoom = (room: Room) => {
    // TODO: Add join room logic
    console.log(room);
  }

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
    } else if (messageInput.includes("/join_room")) {
      event_type = "join_room";
      messageToSend = messageInput.replace("/join_room ", "").trim(); // room name
    } else if (messageInput.includes("/report")) {
      // this is handled via API
      event_type = "report";
      let userName = messageInput.replace("/report ", "").trim(); // room number
      fetch(`/api/report?target_user=${userName}`, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${userData.jwtToken}`,
        },
      })
        .then((r) => r.json())
        .then((r) => {
          console.log(r);
          messages.push({
            payload: r,
            action: "api_message",
          });
          updateMessages([...messages]); // have to do this to trigger rerender
        })
        .catch((e) => {
          console.error(e);
        });
      setTimeout(() => setMessageInput(""), 1);
      return;
    } else if (messageInput.includes("/unban")) {
      event_type = "unban";
      let userName = messageInput.replace("/unban ", "").trim(); // room number
      fetch(`/admin/unban?target_user=${userName}`, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${userData.jwtToken}`,
        },
      })
        .then((r) => r.json())
        .then((r) => {
          console.log(r);
          messages.push({
            payload: r,
            action: "api_message",
          });
          updateMessages([...messages]); // have to do this to trigger rerender
        })
        .catch((e) => {
          console.error(e);
        });
      setTimeout(() => setMessageInput(""), 1);
    }
    socket?.emit(event_type, messageToSend);
    setTimeout(() => setMessageInput(""), 1);
    setSendAll(false);
  };

  React.useEffect(() => {
    if(!socket)
      return;

    socket.on("message", (payload: NewMessagePayload) => {
      console.log(payload);
      messages.push({
        payload: payload,
        message_type: payload.type,
        action: "message",
      });
      updateMessages([...messages]); // have to do this to trigger rerender
    });

    socket.on("delete_message", (payload: DeleteMessagePayload) => {
      for(let i = 0; i < messages.length; ++i) {
        if(messages[i].action == "message" &&
        (messages[i].payload as NewMessagePayload).message_id == payload.message_id) {
          messages[i] = {
            payload: {
              response: "Message was deleted by Admin",
            },
            action: "api_message",
          };
          break;
        }
      }
     
      updateMessages([...messages]);
    });

    socket.on("new_member_joined", (payload: NewMemberJoined) => {
      messages.push({
        payload: payload,
        action: "new_member_joined",
      });
      updateMessages([...messages]); // have to do this to trigger rerender
    });

    return () => {
      if(socket) socket.close();
    }
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
          <div className="Modal-backDrop u-positionAbsolute u-positionFull u-backgroundBlack u-zIndex2 Show " />
          <div className="u-positionRelative u-zIndex3 u-marginSmall u-marginBottomExtraLarge">
            <BubbleChat
              className="u-marginNone"
              text="Xin chào, đăng nhập vào tài khoàn STEAM for Vietnam LMS của bạn để bất đầu chat với các thành viên khác trong phòng chat này!"
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
              <span>Số người đang chat:&nbsp;</span>
              <span className="u-fontMedium">2401</span>
            </div>
            <div>
              <span>Số phòng chat:&nbsp;</span>
              <span className="u-fontMedium">1</span>
            </div>
            <div>
              <span>Phòng chat hiện tại:&nbsp;</span>
              <span className="u-fontMedium">1</span>
            </div>
          </div>
          <FunctionButtonGroup
            isSignedIn={userData.isLoggedIn}
            loadRooms={loadRooms}
            rooms={rooms}
            joinRoom={joinRoom}
            isAdmin={isAdmin}
          />
        </div>
        <ChatBox className="u-border u-backgroundWhite">
          <ChatBox.List>
            {messages.map((m, i) => (
              <ChatMessage key={i} {...m} />
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
              sendButtonActive={messageInput.trim() !== "" && userData.isLoggedIn}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMessageInput(e.target.value)
              }
              inputProps={{
                value: messageInput,
                maxRows: 4,
                placeholder: "Tin nhắn cho lớp ...",
                disabled: !userData.isLoggedIn,
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
