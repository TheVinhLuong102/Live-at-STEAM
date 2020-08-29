import React from "react";
import { useUserData } from "./User";
import { singletonHook } from 'react-singleton-hook';
let socket: SocketIOClient.Socket | null = null;
const init = null;

const useSocketImpl = () => {
    const userData = useUserData();
    const [socket, setSocket] = React.useState(null as SocketIOClient.Socket | null);
    React.useEffect(() => {
        socket?.close();
    
        const token = userData.jwtToken;
        setSocket(window.io("/", {
          query: `token=${token}`,
        }) as SocketIOClient.Socket)
    
        return () => {
          if (socket) socket.close();
        };
    }, [userData]);

    return socket;
}

export const useSocket = singletonHook(init, useSocketImpl);