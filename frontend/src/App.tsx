import React from "react";
//@ts-ignore
import { PageLayout } from '@gotitinc/design-system';
import NavBar from "./Components/Navbar";
import YoutubeIframe from "./Components/YoutubeIframe";
import ScratchIframe from "./Components/ScratchIframe";
import Chatbox from "./Components/Chatbox";

function App() {
  return (
    <PageLayout
      style={{
        height: '100vh',
      }}
    >
      <PageLayout.Header className="u-borderBottom">
        <NavBar />
      </PageLayout.Header>
      <PageLayout.Body className="u-overflowVerticalAuto u-webkitScrollbar">
        <div className="Container Container--fluid u-paddingTopMedium u-paddingBottomSmall u-flex u-flexColumn u-backgroundOpaline">
          <div className="Grid Grid--smallGutter u-flexGrow-1">
            <div className="u-size9of12">
              <YoutubeIframe />
            </div>
            <div className="u-size3of12 u-flex u-positionRelative">
              <Chatbox serverAddress="/" />
            </div>
          </div>
        </div>
      </PageLayout.Body>
    </PageLayout>
  );
}

export default App;
