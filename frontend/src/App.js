//@flow

import React from "react";
import logo from "./logo.svg";
import "./App.css";
import YoutubeIframe from "./Components/YoutubeIframe.js";
import ScratchIframe from "./Components/ScratchIframe.js";
import Chatbox from "./Components/Chatbox.js";

function App() {
  return (
    <div className="App">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-8" >
            <YoutubeIframe />
          </div>
          <div className="col-sm-4">
            <Chatbox serverAddress="127.0.0.1:3600" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
