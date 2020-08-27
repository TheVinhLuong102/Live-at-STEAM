import React from 'react';
import { Resizable, ResizableBox } from 'react-resizable';


export default function YoutubeIframe() {
    let [youtubeUrl, setYoutubeUrl] = React.useState();

    function updateNewStreamUrl() {
        //dummy API
        fetch("./youtubesource.json")
        .then((response) => response.json())
        .then(data => {
            if(data.url !== youtubeUrl)
                setYoutubeUrl(data.url)
        })
        .catch((e) => {
            console.error(e)
        })
    }

    React.useEffect( () => {
        const interval = setInterval(() => {
            updateNewStreamUrl();
        }, 1000);
        return () => clearInterval(interval);
    }, [])

    return (
        <iframe width="100%" style={{"height":"70vh"}}
                src={youtubeUrl} 
                frameBorder="0" 
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen/>
    )
}