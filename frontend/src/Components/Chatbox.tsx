import React from "react";
import { useCookies } from "react-cookie";

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
        <span className="font-italic" style={{ fontSize: "10px" }}>
          {username} just joined the room "{room}"
        </span>
      );
    case "new_message":
      if (message_type == "global") {
        return (
          <span style={{ color: "#FFCE33", fontSize: "12px" }}>
            {username}: {message}
          </span>
        );
      }
      return (
        <span style={{ fontSize: "12px" }}>
          {username}: {message}
        </span>
      );
    case "api_message":
      return (
        <span className="font-italic" style={{ fontSize: "10px" }}>
          {message}
        </span>
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
    var objDiv = document.getElementById("chatBody");

    if (objDiv) objDiv.scrollTop = objDiv.scrollHeight;
  });

  return (
    <div>
      <div className="panel panel-primary">
        <div className="panel-heading">
          <span className="glyphicon glyphicon-comment"></span> Họp Nhóm
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-default dropdown-toggle"
              onClick={loadRooms}
              data-toggle="dropdown"
            >
              <span className="glyphicon glyphicon-chevron-down"></span>
            </button>
            <ul className="dropdown-menu slidedown">
              {rooms.sort((a, b) => a.count - b.count) &&
                rooms.map((r, i) => 
                  <li key={i}>
                      {r.name} ({r.count})
                  </li>
                )}
            </ul>
          </div>
        </div>

        <div className="panel-body" id="chatBody" style={{ textAlign: "left" }}>
          <ul className="chat">
            {messages.map((m, i) => (
              <li key={i}>
                <ChatMessage
                  username={m.username}
                  message={m.message}
                  room={m.room}
                  message_type={m.message_type}
                  type={m.type}
                  key={i}
                />
              </li>
            ))}
          </ul>
        </div>
        <div className="panel-footer">
          <form
            onSubmit={handleSubmit}
            className="form-inline"
            style={{ textAlign: "left" }}
          >
            <input
              style={{ width: "90%" }}
              type="text"
              value={messageInput}
              className="form-control input-sm"
              placeholder={
                isSignedIn
                  ? "Tin nhắn cho lớp ..."
                  : "Bạn phải đăng nhập để tham gia phòng chat"
              }
              onChange={(e) => setMessageInput(e.target.value)}
              disabled={!isSignedIn}
            />

            <input
              type="submit"
              value="Gửi"
              style={{ marginLeft: "5px" }}
              className="btn btn-warning btn-sm"
            />
          </form>
        </div>
      </div>
    </div>
  );
}
