/**
 * Created by Trent on 11/18/2019.
 */

'use strict';

class GameExample {
    static initialize() {
        TwitchPackets.addListener(TwitchPackets.EVENT_MESSAGE, event => {
            const username = event.username;
            const message = event.message;

            PacketProcessor.processPacket(username, message);
        });

        GameLogic.update();
        GameRenderer.render();
    }
}

class GameLogic {
    static update() {
        const start = Date.now();

        // do game logic stuff

        // set the delay to re-logic
        const delay = Math.max(17 - (Date.now() - start), 0);
        setTimeout(GameLogic.update, delay);
    }
}

class GameRenderer {
    static render() {
        // do game render stuff

        // set the delay to re-animate
        window.requestAnimationFrame(GameRenderer.render);
    }
}

class PacketProcessor {
    static PACKET_TYPE_POSITION = 0;

    // there should ideally be logic in here to respect endianness
    static _buffer = new ArrayBuffer(4);
    static _byteBuffer = new Uint8Array(PacketProcessor._buffer);
    static _floatBuffer = new Float32Array(PacketProcessor._buffer);
    static _intBuffer  = new Int32Array(PacketProcessor._buffer);

    static processPacket(username, packet) {
        console.log(username, packet);
        const packetType = packet.charCodeAt(0);

        switch (packetType) {
            case PacketProcessor.PACKET_TYPE_POSITION: {

            } break;

            default:
                break;
        }
    }
}