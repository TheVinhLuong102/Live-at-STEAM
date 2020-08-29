import React from "react";
//@ts-ignore
import { PageLayout } from "@gotitinc/design-system";
import classNames from 'classnames'; 
import SplitPane from "react-split-pane";
import NavBar from "./Components/Navbar";
import YoutubeIframe from "./Components/YoutubeIframe";
import Chatbox from "./Components/Chatbox";

function App() {
  const [disableIframe, setDisableIframe] = React.useState(false);

  return (
    <PageLayout
      style={{
        height: "100vh",
      }}
    >
      <PageLayout.Header className="u-borderBottom">
        <NavBar />
      </PageLayout.Header>
      <PageLayout.Body className="u-overflowVerticalAuto u-webkitScrollbar">
        <div className="Container Container--fluid u-paddingTopMedium u-paddingBottomSmall u-backgroundOpaline u-flex u-flexColumn u-flexGrow-1">
          <div
            className="u-flex u-flexColumn u-positionRelative u-flexGrow-1"
          >
            <SplitPane
              split="vertical"
              size="70%"
              pane1Style={{
                minWidth: 'calc(50% - 8px)',
                maxWidth: 'calc(80% - 8px)',
              }}
              pane2Style={{
                minWidth: 'calc(20% - 8px)',
                maxWidth: 'calc(50% - 8px)',
              }}
              onDragStarted={() => setDisableIframe(true)}
              onDragFinished={() => setDisableIframe(false)}
            >
              <div
                className={classNames(
                  "u-heightFull u-widthFull u-flex",
                  disableIframe && "u-pointerEventsNone",
                )}
              >
                <YoutubeIframe />
              </div>
              <div className="u-heightFull u-widthFull u-flex u-positionRelative">
                <Chatbox />
              </div>
            </SplitPane>
          </div>
        </div>
      </PageLayout.Body>
    </PageLayout>
  );
}

export default App;
