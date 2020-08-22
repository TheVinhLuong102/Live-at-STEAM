import React from 'react';
import { Resizable, ResizableBox } from 'react-resizable';


export default function YoutubeIframe() {
    let [scratchUrl, setScratchUrl] = React.useState();

    function updateNewScratchUrl() {
        fetch("./scratchsource.json")
        .then((response) => response.json())
        .then(data => {
            console.log(data)
            if(data.url !== scratchUrl)
                setScratchUrl(data.url)
        })
        .catch((e) => {
            console.error(e)
        })
    }

    React.useEffect( () => {
        const interval = setInterval(() => {
            updateNewScratchUrl();
        }, 1000);
        return () => clearInterval(interval);
    })

    return (
        <div>
            <ResizableBox className="box" width={800} height={600} axis="both">
                <iframe width="100%" height="100%" 
                    src={scratchUrl} 
                    frameBorder="0" 
                    allowTransparency="true"
                    scrolling="no"
                    allowFullScreen/>
             </ResizableBox>
        </div>
    )
}