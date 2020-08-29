import React from "react";
import { useCookies } from "react-cookie";
//@ts-ignore
import { UserData } from "../Types/User";
import jwtDecode from "jwt-decode";

export function useUserData() {
  const [userData, setUserData] = React.useState({
    isLoggedIn: false,
  } as UserData);
  const [cookies] = useCookies(["live-site-jwt"]);
  React.useEffect(() => {
    const token = cookies["live-site-jwt"];
    if (token) {
      try {
        let decodedUserData: any = jwtDecode(token);
        setUserData({
          isLoggedIn: true,
          jwtToken: token,
          ...decodedUserData,
        });
      } catch (e) {
        console.error(e);
        console.log("Failed to decode jwt token from cookies");
      }
    } else {
      setUserData({
        isLoggedIn: false,
      });
    }
  }, [cookies]);

  return userData;
}

//export const useUserData = singletonHook({isLoggedIn: false}, useUserDataImpl);
