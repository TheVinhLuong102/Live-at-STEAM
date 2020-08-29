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
  //@ts-ignore
} from "@gotitinc/design-system";
//@ts-ignore
import classNames from "classnames";
import jwtDecode from "jwt-decode";
import { UserData } from "../Types/User";
import FunctionButtonGroup from "./FunctionButtonGroup";

type NewMessagePayload = {
  username: string;
  message_id: string;
  msg: string;
  type: string;
};
type DeleteMessagePayload = {
  message_id: string;
};

type NewMemberJoined = {
  username: string;
  room: string;
};

let socket: SocketIOClient.Socket | null = null;

function UserMessageUI({
  username,
  message,
  message_type,
}: {
  username: string | null | undefined;
  message: string | null | undefined;
  message_type: string | null | undefined;
}) {
  const [hover, setHover] = React.useState(false);

  return (
    <div
      className="u-flex u-marginBottomExtraSmall u-paddingRightMedium u-positionRelative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="u-flexShrink-0 u-marginRightExtraSmall">
        <Avatar src={require("../assets/images/kid-boy.png")} />
      </div>
      <div className="u-flexGrow-1 u-text200 u-marginTopTiny u-textWordBreak">
        <span
          className={classNames(
            "u-fontBold u-marginRightExtraSmall u-textLight"
          )}
        >
          {username}
        </span>
        <span
          className={classNames(message_type === "global" && "u-textWarning")}
        >
          {message}
        </span>
      </div>
      {hover && (
        <div className="u-positionAbsolute u-positionRight u-positionTop">
          <Dropdown alignRight>
            <Dropdown.Toggle className="u-textLight hover:u-textGray u-lineHeightNone u-rotate90">
              <Icon size="extraSmall" name="more" />
            </Dropdown.Toggle>
            <Dropdown.Container
              className="u-paddingVerticalExtraSmall"
              additionalStyles={{ minWidth: 150 }}
            >
              <Dropdown.Item
                className="u-cursorPointer u-alignItemsCenter"
                role="button"
                onClick={() => {}}
              >
                <Icon name="flag" size="extraSmall" />
                <span className="u-marginLeftExtraSmall u-text200 u-textNoWrap">
                  Báo cáo vi phạm
                </span>
              </Dropdown.Item>
            </Dropdown.Container>
          </Dropdown>
        </div>
      )}
    </div>
  );
}

function SystemMessageUI({
  message,
  type,
}: {
  message: string | null | undefined;
  type: string | null | undefined;
}) {
  return (
    <div
      className={classNames(
        "u-text200 u-fontItalic u-marginBottomExtraSmall",
        type === "info" && "u-textLight",
        type === "error" && "u-textNegative"
      )}
    >
      {message}
    </div>
  );
}

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
          message_type={message_type}
        />
      );
    case "api_message":
      return <SystemMessageUI message={payload.response} type="error" />;
    default:
      return null;
  }
}

type Room = {
  name: string;
  count: number;
};

type Message = {
  message_type?: string;
  payload: any;
  action: string;
};

export default function Chatbox({
  serverAddress,
  isLoggedIn,
  userData,
}: {
  serverAddress: string;
  isLoggedIn: boolean;
  userData: UserData | null | undefined;
}) {
  const [messages, updateMessages] = React.useState([] as Message[]);
  const [messageInput, setMessageInput] = React.useState("");
  const [cookies] = useCookies(["live-site-jwt"]);
  const [rooms, setRooms] = React.useState([] as Room[]);
  const [sendAll, setSendAll] = React.useState(false);

  const loadRooms = (event: any) => {
    event.preventDefault();
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
          Authorization: `Bearer ${cookies["live-site-jwt"]}`,
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
          Authorization: `Bearer ${cookies["live-site-jwt"]}`,
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
    socket?.close();

    const token = cookies["live-site-jwt"];

    socket = window.io(serverAddress, {
      query: `token=${token}`,
    }) as SocketIOClient.Socket;

    socket.on("message", (payload: NewMessagePayload) => {
      console.log(payload);
      messages.push({
        payload: payload,
        message_type: payload.type,
        action: "message",
      });
      updateMessages([...messages]); // have to do this to trigger rerender
    });

    socket.on("delete_mesage", (payload: DeleteMessagePayload) => {
      const newMessages = messages.map((m) => {
        if (
          m.action != "message" ||
          (m.payload as NewMessagePayload).message_id != payload.message_id
        )
          return m;
        return {
          payload: {
            response: "Message was deleted by Admin",
          },
          action: "api_message",
        };
      });
      updateMessages([...newMessages]);
    });

    socket.on("new_member_joined", (payload: NewMemberJoined) => {
      messages.push({
        payload: payload,
        action: "new_member_joined",
      });
      updateMessages([...messages]); // have to do this to trigger rerender
    });

    return () => {
      if (socket) socket.close();
    };
  }, [cookies["live-site-jwt"]]);

  //auto scroll
  React.useEffect(() => {
    var objDiv = document.querySelector(".ChatBox-list > div");

    if (objDiv) objDiv.scrollTop = objDiv.scrollHeight;
  }, [messages]);

  return (
    <React.Fragment>
      {!isLoggedIn && (
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
        {/* TODO: Show only for admins */}
        <div className="u-backgroundWhite u-borderTop u-borderLeft u-borderRight u-paddingExtraSmall u-text200 u-flex u-flexRow">
          <Dropdown>
            <Dropdown.Button variant="primary" size="small" onClick={loadRooms}>
              <Button.Label>Chọn phòng</Button.Label>
            </Dropdown.Button>
            <Dropdown.Container
              id="123"
              className="u-paddingVerticalExtraSmall"
              additionalStyles={{ minWidth: 320 }}
            >
              {rooms.map((r, i) => (
                <div className=" u-paddingHorizontalSmall u-paddingVerticalTiny">
                  <Form.Check type="radio" id={`room-${r}`} label={r} />
                </div>
              ))}
            </Dropdown.Container>
          </Dropdown>
        </div>
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
          <FunctionButtonGroup isSignedIn={isLoggedIn} />
        </div>
        <ChatBox className="u-border u-backgroundWhite">
          <ChatBox.List>
            {messages.map((m, i) => (
              <ChatMessage key={i} {...m} />
            ))}
          </ChatBox.List>
          <ChatBox.Context>
            <Composer
              disabledAttachButton
              disabledSendButton={false}
              sendButtonActive={messageInput.trim() !== "" && isLoggedIn}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMessageInput(e.target.value)
              }
              inputProps={{
                value: messageInput,
                maxRows: 4,
                placeholder: "Tin nhắn cho lớp ...",
                disabled: !isLoggedIn,
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
            {/* TODO: Show only for admins */}
            <Form.Check
              id="send_all"
              checked={sendAll}
              label="Send All"
              onChange={() => setSendAll(!sendAll)}
            />
          </ChatBox.Context>
        </ChatBox>
      </div>
    </React.Fragment>
  );
}
