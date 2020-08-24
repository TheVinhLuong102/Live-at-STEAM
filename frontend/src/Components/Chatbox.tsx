import React from "react";

type NewMessagePayload = {
  username: string;
  msg: string;
};

type NewMemberJoined = {
  username: string;
  room: string;
};

let socket: SocketIOClient.Socket | null = null;

function ChatMessage({
  username,
  message,
  type,
}: {
  username: string;
  message: string | null | undefined;
  type: string;
}) {
  switch (type) {
    case "new_member_joined":
      return (
        <span className="font-italic" style={{ fontSize: "10px" }}>
          {username} just joined the room
        </span>
      );
    case "new_message":
      return (
        <span>
          {username}: {message}
        </span>
      );
    default:
      return null;
  }
}

type ServerMessage = {
  username: string;
  message?: string | null | undefined;
  type: string;
};

export default function Chatbox({ serverAddress }: { serverAddress: string }) {
  const [messages, updateMessages] = React.useState([] as ServerMessage[]);
  const [messageInput, setMessageInput] = React.useState("");
  const [jwtToken, setJWTToken] = React.useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(messageInput);
    socket?.emit("message", messageInput);
    setTimeout(() => setMessageInput(""), 1);
  };

  React.useEffect(() => {
    socket?.close();

    //TODO(davidvu): pass JWT signed token
    socket = window.io(serverAddress, {
      query: "username=davidvu",
    }) as SocketIOClient.Socket;

    socket.on("message", (payload: NewMessagePayload) => {
      messages.push({
        username: payload.username,
        message: payload.msg,
        type: "new_message",
      });
      updateMessages([...messages]); // have to do this to trigger rerender
    });

    socket.on("new_member_joined", (payload: NewMemberJoined) => {
      messages.push({
        username: payload.username,
        type: "new_member_joined",
      });
      updateMessages([...messages]); // have to do this to trigger rerender
    });

    return () => {
      if (socket) socket.close();
    };
  }, [jwtToken]);

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
        </div>
        <div className="panel-body" id="chatBody" style={{ textAlign: "left" }}>
          <ul className="chat">
            {messages.map((m, i) => (
              <li key={i}>
                <ChatMessage
                  username={m.username}
                  message={m.message}
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
              placeholder="Tin nhắn cho lớp ..."
              onChange={(e) => setMessageInput(e.target.value)}
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
