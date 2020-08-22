//@flow

import React from "react";
import { Resizable, ResizableBox } from "react-resizable";

type NewMessagePayload = $ReadOnly<{
  username: string,
  msg: string,
}>;

export default function Chatbox({
  serverAddress,
}: $ReadOnly<{
  serverAddress: string,
}>) {

  const [messages, updateMessages] = React.useState([]);
  const [messageInput, setMessageInput] = React.useState("");

  let socket = null;
  const handleSubmit = (event) => {
    event.preventDefault();
    console.log(messageInput);
    if (socket) {
      socket.emit("message", messageInput);
      setTimeout(() => setMessageInput(""), 1);
    }
  };

  React.useEffect(() => {
    //TODO(davidvu): pass JWT signed token
    socket = window.io(serverAddress, { query: "username=davidvu" });
    socket.on("new_message", (payload: NewMessagePayload) => {
      updateMessages([...messages, `${payload.username}: ${payload.msg}`]);
    });
    return () => {
      if (socket) socket.close();
    };
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
        <div className="panel-body" style={{"text-align": "left"}}>
          <ul className="chat">{messages.map((m,i) => <li key={i}>{m}</li>) } </ul>
        </div>
        <div className="panel-footer">
          <div className="input-group">
            <form onSubmit={handleSubmit} style={{"text-align": "left"}}>
              <input
                style={{"width": "90%"}}
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
