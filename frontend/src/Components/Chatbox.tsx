import React from "react";
import { useCookies } from "react-cookie";
//@ts-ignore
import { ChatBox, Composer, Avatar, Button, Icon, Dropdown, Overlay, Tooltip, Modal, BubbleChat } from '@gotitinc/design-system';
//@ts-ignore
import classNames from 'classnames';

type NewMessagePayload = {
  username: string;
  msg: string;
  type: string;
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
  username: string | null | undefined,
  message: string | null | undefined,
  message_type: string | null | undefined,
}) {
  const [hover, setHover] = React.useState(false);

  return (
    <div
      className="u-flex u-marginBottomExtraSmall u-paddingRightMedium u-positionRelative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="u-flexShrink-0 u-marginRightExtraSmall">
        <Avatar src={require('../assets/images/kid-boy.png')} />
      </div>
      <div className="u-flexGrow-1 u-text200 u-marginTopTiny u-textWordBreak">
        <span
          className={classNames(
            'u-fontBold u-marginRightExtraSmall u-textLight',
          )}
        >
          {username}
        </span>
        <span
          className={classNames(message_type === "global" && 'u-textWarning')}
        >
          {message}
        </span>
      </div>
      {hover && (
        <div className="u-positionAbsolute u-positionRight u-positionTop">
          <Dropdown alignRight>
            <Dropdown.Toggle className="u-textLight hover:u-textGray u-lineHeightNone u-rotate90">
              <Icon
                size="extraSmall"
                name="more"
              />
            </Dropdown.Toggle>
            <Dropdown.Container
              className="u-paddingVerticalExtraSmall"
              additionalStyles={{ minWidth: 150 }}
            >
              <Dropdown.Item className="u-cursorPointer u-alignItemsCenter" role="button" onClick={() => {}}>
                <Icon name="flag" size="extraSmall" />
                <span className="u-marginLeftExtraSmall u-text200 u-textNoWrap">Báo cáo vi phạm</span>
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
  message: string | null | undefined,
  type: string | null | undefined,
}) {
  return (
    <div
      className={classNames(
        "u-text200 u-fontItalic u-marginBottomExtraSmall",
        type === "info" && "u-textLight",
        type === "error" && "u-textNegative",
      )}
    >
      {message}
    </div>
  );
};

function ChatMessage({
  username,
  message,
  room,
  message_type,
  type,
}: {
  username: string | null | undefined;
  message: string | null | undefined;
  room: string | null | undefined;
  message_type: string | null | undefined;
  type: string;
}) {
  switch (type) {
    case "new_member_joined":
      return (
        <SystemMessageUI
          message={`${username} just joined the room "${room}"`}
          type="info"
        />
      );
    case "new_message":
      return (
        <UserMessageUI
          username={username}
          message={message}
          message_type={message_type}
        />
      );
    case "api_message":
      return (
        <SystemMessageUI
          message={message}
          type="error"
        />
      );
    default:
      return null;
  }
}

type Room = {
  name: string,
  count: number
};

type ServerMessage = {
  username?: string;
  message?: string | null | undefined;
  room?: string | null | undefined;
  message_type?: string;
  type: string;
};

export default function Chatbox({ serverAddress }: { serverAddress: string }) {
  const [messages, updateMessages] = React.useState([] as ServerMessage[]);
  const [messageInput, setMessageInput] = React.useState("");
  const [cookies] = useCookies(["live-site-jwt"]);
  const [isSignedIn, setIsSignedIn] = React.useState(false);
  const [rooms, setRooms] = React.useState([] as Room[]);
  const [show, setShow] = React.useState(false);

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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement> | undefined) => {
    if (event) {
      event.preventDefault();
    }
    console.log(messageInput);
    let messageToSend = messageInput;
    let event_type = "message";

    //hacky command handling
    if (messageInput.includes("/global")) {
      event_type = "global_message";
      messageToSend = messageInput.replace("/global ", "").trim();
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
            message: r.response,
            type: "api_message",
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
            message: r.response,
            type: "api_message",
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
  };

  React.useEffect(() => {
    socket?.close();

    const token = cookies["live-site-jwt"];

    socket = window.io(serverAddress, {
      query: `token=${token}`,
    }) as SocketIOClient.Socket;

    if (token) {
      setIsSignedIn(true);
    } else {
      setIsSignedIn(false);
    }

    socket.on("message", (payload: NewMessagePayload) => {
      messages.push({
        username: payload.username,
        message: payload.msg,
        message_type: payload.type,
        type: "new_message",
      });
      updateMessages([...messages]); // have to do this to trigger rerender
    });

    socket.on("new_member_joined", (payload: NewMemberJoined) => {
      messages.push({
        username: payload.username,
        room: payload.room,
        type: "new_member_joined",
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
      {isSignedIn && show && (
        <div className="u-positionAbsolute u-positionFull u-zIndexModal u-flex u-flexGrow-1 u-alignItemsCenter u-justifyContentCenter">
          <div className="Modal-backDrop u-positionAbsolute u-positionFull u-backgroundBlack u-zIndex2 Show "/>
          <div className="u-positionRelative u-zIndex3 u-marginMedium">
            <Modal size="small" relative>
              <Modal.Header closeButton onHide={() => setShow(false)}/>
              <Modal.Body>
                <div className="u-textCenter">
                  Chỉ được chuyển phòng tối đa 1 lần trong 5 phút. Bạn chắc chắn muốn chuyển phòng chứ?
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="primary" width="full">Chuyển phòng</Button>
              </Modal.Footer>
            </Modal>
          </div>
        </div>
      )}
      {!isSignedIn && (
        <div className="u-positionAbsolute u-positionFull u-zIndexModal u-flex u-alignItemsEnd">
          <div className="Modal-backDrop u-positionAbsolute u-positionFull u-backgroundBlack u-zIndex2 Show "/>
            <div className="u-positionRelative u-zIndex3 u-marginSmall u-marginBottomExtraLarge">
              <BubbleChat
                className="u-marginNone"
                text="Xin chào, đăng nhập vào tài khoàn STEAM for Vietnam LMS của bạn để bất đầu chat với các thành viên khác trong phòng chat này!"
                type="outbound"
                avatar={() =>  <Avatar className="u-flexShrink-0 u-marginRightExtraSmall u-marginTopExtraSmall" src={require('../assets/images/nophoto.svg')} />}
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
          <div className="u-flexShrink-0 u-flex u-alignItemsCenter u-justifyContentCenter">
            <Dropdown alignRight>
              <Dropdown.Button onlyIcon variant="positive_outline" className="u-roundedCircle u-marginRightExtraSmall is-disabled">
                <Button.Icon><Icon name="raiseHand"/></Button.Icon>
              </Dropdown.Button>
              <Dropdown.Container className="u-overflowHidden u-borderNone">
                <div 
                  className="u-paddingExtraSmall u-backgroundBlack u-textWhite"
                >
                  Chức năng giơ tay sẽ được cập nhật trong các phiên bản sau!
                </div>
              </Dropdown.Container>
            </Dropdown>
  
            <Overlay.Trigger
              key="bottom"
              placement="bottom"
              hoverOverlay
              delay={{ show: 0, hide: 100 }}
              overlay={(props: Object) => (
                <Tooltip id="tooltip-change-room" {...props}>
                  Chuyển sang phòng chat khác
                </Tooltip>
              )}
            >
              <Button onlyIcon variant="primary_outline" className="u-roundedCircle">
                <Button.Icon><Icon name="arrowForward"/></Button.Icon>
              </Button>
            </Overlay.Trigger>
          </div>
        </div>
        <ChatBox className="u-border u-backgroundWhite">
          <ChatBox.List>
            {messages.map((m, i) => (
              <ChatMessage
                key={i}
                username={m.username}
                message={m.message}
                room={m.room}
                message_type={m.message_type}
                type={m.type}
              />
            ))}
          </ChatBox.List>
          <ChatBox.Context>
            <Composer
              disabledAttachButton
              disabledSendButton={false}
              sendButtonActive={!!messageInput && isSignedIn}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessageInput(e.target.value)}
              inputProps={{
                value: messageInput,
                maxRows: 4,
                placeholder: "Tin nhắn cho lớp ...",
                disabled: !isSignedIn,
                onKeyDown: async (e: React.KeyboardEvent<HTMLInputElement>) => {
                  const keyCode = (e.keyCode || e.which);
                  if (keyCode === 13 && !e.shiftKey && messageInput.trim() !== '') {
                    e.preventDefault();
                    handleSubmit(undefined);
                  }
                }
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
