import Log from '../utils/logger.js';
import { BaseLoader, LoaderStatus, LoaderErrors } from './loader.js';
import { RuntimeException } from '../utils/exception.js';
// @ts-ignore
import { StreamrClient } from '@streamr/sdk';
const _ = require("lodash");

// For MPEG-TS/FLV over Streamr Protocol live stream
class CustomLoader extends BaseLoader {

    static isSupported() {
        return true
    }

    constructor() {
        super('streamr-loader');
        this.TAG = 'StreamrLoader';

        this._needStash = true;
        this._streamrClient = null;
        this._requestAbort = false;
        this._receivedLength = 0;
        this._client = null
        this._msgNumbers = []
        this._msgNumber = null
        this._msgCounter = 0
        this._unpackedVideoDataReceivedInBytes = 0
        this._packetLatency = 0
    }

    destroy() {
        super.destroy();
    }

    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const length = binaryString.length;
        const bytes = new Uint8Array(length);

        for (let i = 0; i < length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return bytes.buffer;
    }

    //move time adjustment estimation to separate function

    async open(dataSource) {
        try {
            this._status = LoaderStatus.kConnecting;
            const { address, privateKey } = StreamrClient.generateEthereumAccount();
            let streamrClient = window.streamr = this._client = new StreamrClient({
                auth: {
                    privateKey: privateKey,
                },
                metrics: false,
                gapFill: true
            })

            let msgCounter = 0
            // Get the current URL
            const currentUrl = new URL(window.location.href)

            // Get the values of streamId and partitionId
            const streamId = currentUrl.searchParams.get('stream') == null ? 'streamr.eth/demos/video' : currentUrl.searchParams.get('stream')
            const partitionId = currentUrl.searchParams.get('partition') == null ? 0 : parseInt(currentUrl.searchParams.get('partition'))
            console.log('stream Id: ', streamId)
            console.log('partition Id: ', partitionId)

            streamrClient.getStream(streamId).then(() => { }) // populate cache BEFORE waiting for 1st message to arrive
            streamrClient.subscribe({ id: streamId, partition: partitionId }, (message) => {
                message['b'][1]?.forEach((element) => {
                    let arrBuf = this.base64ToArrayBuffer(element)
                    this._dispatchArrayBuffer(arrBuf)
                })
            })

        } catch (e) {
            console.log(e)
            this._status = LoaderStatus.kError;
        }
    }

    abort() {
        this._client = null
    }

    _dispatchArrayBuffer(arraybuffer) {
        let chunk = arraybuffer;
        let byteStart = this._receivedLength;
        this._receivedLength += chunk.byteLength;

        if (this._onDataArrival) {
            this._onDataArrival(chunk, byteStart, this._receivedLength);
        }
    }
}

export default CustomLoader;
