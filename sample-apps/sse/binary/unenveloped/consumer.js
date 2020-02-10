(() => {
    const key = 'API:KEY';
    const channel = 'sample-app-sse';
    const url = `https://realtime.ably.io/event-stream?channels=${channel}&v=1.1&key=${key}&delta=vcdiff&enveloped=false`;
    const eventSource = new EventSource(url);
    const channelDecoder = new DeltaCodec.VcdiffDecoder();
    
    eventSource.onmessage = (event) => {
        let data = event.data;

        try {
            if (DeltaCodec.VcdiffDecoder.isBase64Delta(data)) {
                data = channelDecoder.applyBase64Delta(data).asUint8Array();
            } else {
                channelDecoder.setBase64Base(data);
            }
        } catch(e) {
            /* Delta decoder error */
            console.log(e);
        }
    
        /* Process decoded data */
        console.log(data);
    };
})();
