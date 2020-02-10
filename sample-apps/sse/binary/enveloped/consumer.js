(() => {
    const key = 'API:KEY';
    const channel = 'sample-app-sse';
    const url = `https://realtime.ably.io/event-stream?channels=${channel}&v=1.1&key=${key}&delta=vcdiff`;
    const eventSource = new EventSource(url);
    const channelDecoder = new DeltaCodec.CheckedVcdiffDecoder();
    
    eventSource.onmessage = (event) => {
        /* event.data is JSON-encoded Ably Message (see https://www.ably.io/documentation/realtime/types#message) */
        const message = JSON.parse(event.data);
        const { id, extras } = message;
        let { data } = message;

        try {
            if (extras && extras.delta) {
                data = channelDecoder.applyBase64Delta(data, id, extras.delta.from).asUint8Array();
            } else {
                channelDecoder.setBase64Base(data, id);
            }
        } catch(e) {
            /* Delta decoder error */
            console.log(e);
        }
    
        /* Process decoded data */
        console.log(data);
    };
})();
