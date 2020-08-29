import React from "react";
import { useCookies } from "react-cookie";
//@ts-ignore
import { PageLayout } from "@gotitinc/design-system";
import NavBar from "./Components/Navbar";
import YoutubeIframe from "./Components/YoutubeIframe";
import ScratchIframe from "./Components/ScratchIframe";
import Chatbox from "./Components/Chatbox";
import { UserData } from "./Types/User";
import jwtDecode from "jwt-decode";

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [userData, setUserData] = React.useState(null as UserData | null);
  const [cookies] = useCookies(["live-site-jwt"]);
  React.useEffect(() => {
    const token = cookies["live-site-jwt"];

    if (token) {
      try {
        let decodedUserData: UserData = jwtDecode(token);
        setUserData(decodedUserData);
        setIsLoggedIn(true);
      } catch (e) {
        console.error(e);
        setIsLoggedIn(false);
        console.log("Failed to decode jwt token from cookies");
      }
    } else {
      setIsLoggedIn(false);
    }
  }, [cookies["live-site-jwt"]]);

  return (
    <PageLayout
      style={{
        height: "100vh",
      }}
    >
      <PageLayout.Header className="u-borderBottom">
        <NavBar isLoggedIn={isLoggedIn} userData={userData}/>
      </PageLayout.Header>
      <PageLayout.Body className="u-overflowVerticalAuto u-webkitScrollbar">
        <div className="Container Container--fluid u-paddingTopMedium u-paddingBottomSmall u-flex u-flexColumn u-backgroundOpaline">
          <div className="Grid Grid--smallGutter u-flexGrow-1">
            <div className="u-size9of12">
              <YoutubeIframe />
            </div>
            <div className="u-size3of12 u-flex u-positionRelative">
              <Chatbox serverAddress="/" isLoggedIn={isLoggedIn} userData={userData}/>
            </div>
          </div>
        </div>
      </PageLayout.Body>
    </PageLayout>
  );
}

export default App;
