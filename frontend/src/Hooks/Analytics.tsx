
import { singletonHook } from 'react-singleton-hook';
import React from 'react';
import { Room } from '../Types/Common';


export type ChatAnalytics = {
    numUsers: number,
    numRooms: number,
    rooms: Room[]
}
const init = {
    numUsers: 0,
    numRooms: 0,
    rooms: [],
}

function useChatRoomsAnalyticsImpl() {

    const [analytics, setAnalytics] = React.useState(init as ChatAnalytics);
    const [runRoutine, setRunRoutine] = React.useState(true);
    const updateRoutine = () => {
        fetch(`/api/getRooms`, {
            method: "GET",
            credentials: "same-origin",
            headers: {
              "Content-type": "application/json",
            },
        }).then((r) => r.json())
        .then((r: {response: Room[]}) => {
            let newAnalytics = {
                numUsers : r.response.map(r => r.count).reduce((a, b) => a + b),
                numRooms: r.response.length,
                rooms: r.response
            }
            setAnalytics(newAnalytics);
            if(runRoutine)
                setTimeout(() => updateRoutine(), 5000);
        })
        .catch((e) => {
            console.error(e);
            if(runRoutine)
                setTimeout(() => updateRoutine(), 5000);
        });
    }

    React.useEffect(() => {
        updateRoutine();
        return () => {
            setRunRoutine(false)
        }
    }, []);

    return analytics;
}

export const useChatAnalytics = singletonHook(init, useChatRoomsAnalyticsImpl);