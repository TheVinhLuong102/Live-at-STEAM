import React from "react";
import logo from "./logo.svg";
import "./App.css";
import NavBar from "./Components/Navbar";
import YoutubeIframe from "./Components/YoutubeIframe";
import ScratchIframe from "./Components/ScratchIframe";
import Chatbox from "./Components/Chatbox";

function App() {
  return (
    <div className="App">
      <NavBar />
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-8">
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
