import React from "react";

type NewMessagePayload = {
  username: string;
  msg: string;
};

let socket: SocketIOClient.Socket | null = null;

export default function Chatbox({ serverAddress }: { serverAddress: string }) {
  const [messages, updateMessages] = React.useState([] as string[]);
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

    socket.on("new_message", (payload: NewMessagePayload) => {
      messages.push(`${payload.username}: ${payload.msg}`);
      updateMessages([...messages]); // have to do this to trigger rerender
    });

    return () => {
      if (socket) socket.close();
    };
  }, [jwtToken]);

  //auto scroll
  React.useEffect(() => {
    var objDiv = document.getElementById("chatBody");

    if(objDiv)
      objDiv.scrollTop = objDiv.scrollHeight;
  });

  return (
    <div>
      <div className="panel panel-primary">
        <div className="panel-heading">
          <span className="glyphicon glyphicon-comment"></span> Họp Nhóm
          <div className="btn-group pull-right">
            <button
              type="button"
              className="btn btn-default btn-xs dropdown-toggle"
            >
              <span className="glyphicon glyphicon-chevron-down"></span>
            </button>
          </div>
        </div>
        <div className="panel-body" id="chatBody" style={{ textAlign: "left" }}>
          <ul className="chat">
            {messages.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
        <div className="panel-footer">
          <div className="input-group">
            <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
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
                className="btn btn-warning btn-sm"
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
