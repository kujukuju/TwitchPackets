/**
 * Created by Trent on 11/18/2019.
 */

'use strict';

class GameExample {
    // your name will be an empty string just to make things easy
    static HARDCODED_CLIENT_USERNAME = '';

    static initialize() {
        TwitchPackets.addListener(TwitchPackets.EVENT_MESSAGE, event => {
            const username = event.username;
            const message = event.message;

            PacketProcessor.processPacket(username, message);
        });

        GameRenderer.initialize();

        // start loops
        GameLogic.update();
        GameRenderer.render();

        // process inputs
        window.addEventListener('keydown', (event) => {
            if (!TwitchPackets.isConnected()) {
                return;
            }

            switch (event.keyCode) {
                case 87: {
                    GameLogic.getPlayer(GameExample.HARDCODED_CLIENT_USERNAME).setInput(Player.INPUT_W, true);
                } break;

                case 65: {
                    GameLogic.getPlayer(GameExample.HARDCODED_CLIENT_USERNAME).setInput(Player.INPUT_A, true);
                } break;

                case 83: {
                    GameLogic.getPlayer(GameExample.HARDCODED_CLIENT_USERNAME).setInput(Player.INPUT_S, true);
                } break;

                case 68: {
                    GameLogic.getPlayer(GameExample.HARDCODED_CLIENT_USERNAME).setInput(Player.INPUT_D, true);
                } break;
            }
        });

        window.addEventListener('keyup', (event) => {
            if (!TwitchPackets.isConnected()) {
                return;
            }

            switch (event.keyCode) {
                case 87: {
                    GameLogic.getPlayer(GameExample.HARDCODED_CLIENT_USERNAME).setInput(Player.INPUT_W, false);
                } break;

                case 65: {
                    GameLogic.getPlayer(GameExample.HARDCODED_CLIENT_USERNAME).setInput(Player.INPUT_A, false);
                } break;

                case 83: {
                    GameLogic.getPlayer(GameExample.HARDCODED_CLIENT_USERNAME).setInput(Player.INPUT_S, false);
                } break;

                case 68: {
                    GameLogic.getPlayer(GameExample.HARDCODED_CLIENT_USERNAME).setInput(Player.INPUT_D, false);
                } break;
            }
        });
    }
}

class GameLogic {
    static TICK = 17;

    static _playerListByName = {};

    static update() {
        const time = Date.now();

        // set your player to active since we wont be receiving packets for you
        GameLogic.getPlayer(GameExample.HARDCODED_CLIENT_USERNAME).setActive();

        // update players
        // const playerNames = Object.keys(GameLogic._playerListByName);
        // for (let i = 0; i < playerNames.length; i++) {
        //     GameLogic._playerListByName[playerNames[i]].update(time);
        // }
        // update only your player since were on 1.5 second intervals we only want to interpolate
        GameLogic.getPlayer(GameExample.HARDCODED_CLIENT_USERNAME).update(time);

        // send packets after updating everyone
        GameLogic.getPlayer(GameExample.HARDCODED_CLIENT_USERNAME).sendPackets();

        // clean up inactive players
        const playerNames = Object.keys(GameLogic._playerListByName);
        for (let i = 0; i < playerNames.length; i++) {
            if (GameLogic._playerListByName[playerNames[i]].isInactive()) {
                delete GameLogic._playerListByName[playerNames[i]];
            }
        }

        // very quickly and poorly set the logic loop delay based on immediate performance
        const delay = Math.max(GameLogic.TICK - (Date.now() - time), 0);
        setTimeout(GameLogic.update, delay);
    }

    static getPlayer(username) {
        GameLogic._playerListByName[username] = GameLogic._playerListByName[username] || new Player(username);
        return GameLogic._playerListByName[username];
    }
}

class GameRenderer {
    static _canvas = null;
    static _context = null;
    static _dimensions = [0, 0];

    static render() {
        const time = Date.now();

        GameRenderer._context.clearRect(0, 0, GameRenderer._dimensions[0], GameRenderer._dimensions[1]);
        GameRenderer._context.fillStyle = '#2a2a2a';
        GameRenderer._context.fillRect(0, 0, GameRenderer._dimensions[0], GameRenderer._dimensions[1]);

        // do game render stuff
        const playerNames = Object.keys(GameLogic._playerListByName);
        for (let i = 0; i < playerNames.length; i++) {
            // interpolate the rendering for all non-client players, normally youd offset by latency too but we dont know latency
            const renderTime = playerNames[i] === GameExample.HARDCODED_CLIENT_USERNAME ? time - GameLogic.TICK : time - TwitchPackets.getPacketRate();
            GameLogic._playerListByName[playerNames[i]].render(renderTime, GameRenderer._context);
        }

        // set the delay to re-animate
        window.requestAnimationFrame(GameRenderer.render);
    }

    static getDimensions() {
        return GameRenderer._dimensions;
    }

    static initialize() {
        GameRenderer._canvas = document.getElementById('canvas');
        GameRenderer._context = GameRenderer._canvas.getContext('2d');

        GameRenderer._resize();
        window.addEventListener('resize', GameRenderer._resize);
    }

    static _resize() {
        const bounds = GameRenderer._canvas.getBoundingClientRect();
        GameRenderer._dimensions[0] = bounds.width;
        GameRenderer._dimensions[1] = bounds.height;
        GameRenderer._canvas.width = bounds.width;
        GameRenderer._canvas.height = bounds.height;
    }
}

class Player {
    static INACTIVE_DELAY = 5000;
    static INPUT_W = 0;
    static INPUT_A = 1;
    static INPUT_S = 2;
    static INPUT_D = 3;

    _username = null;
    _lastActiveTime = 0;
    _position = [0, 0];
    _positionTime = 0;
    _lastPosition = [0, 0];
    _lastPositionTime = 0;
    _velocity = [0, 0];
    _inputs = [false, false, false, false];

    constructor(username) {
        this._username = username;
        this._lastActiveTime = Date.now();
        this._position[0] = Math.random() - 0.5;
        this._position[1] = Math.random() - 0.5;
        this._positionTime = Date.now();
        this._lastPosition[0] = this._position[0];
        this._lastPosition[1] = this._position[1];
        this._lastPositionTime = Date.now();
    }

    update(time) {
        if (this._inputs[Player.INPUT_W]) {
            this._velocity[1] -= 0.0006;
        }
        if (this._inputs[Player.INPUT_S]) {
            this._velocity[1] += 0.0006;
        }
        if (this._inputs[Player.INPUT_A]) {
            this._velocity[0] -= 0.0006;
        }
        if (this._inputs[Player.INPUT_D]) {
            this._velocity[0] += 0.0006;
        }

        const velocitySpeedSquared = this._velocity[0] * this._velocity[0] + this._velocity[1] * this._velocity[1];
        if (velocitySpeedSquared > 0) {
            const velocitySpeed = Math.sqrt(velocitySpeedSquared);
            const newVelocitySpeed = velocitySpeed * 0.95;

            this._velocity[0] *= newVelocitySpeed / velocitySpeed;
            this._velocity[1] *= newVelocitySpeed / velocitySpeed;
        }

        this.setPosition(this._position[0] + this._velocity[0], this._position[1] + this._velocity[1]);
    }

    sendPackets() {
        if (TwitchPackets.canSendPacketImmediately()) {
            const positionPacket = PacketProcessor.createPositionPacket(this._position[0], this._position[1]);
            const velocityPacket = PacketProcessor.createVelocityPacket(this._velocity[0], this._velocity[1]);
            const inputPacket = PacketProcessor.createInputPacket(this._inputs[Player.INPUT_W], this._inputs[Player.INPUT_A], this._inputs[Player.INPUT_S], this._inputs[Player.INPUT_D]);

            TwitchPackets.send(positionPacket + velocityPacket + inputPacket);
        }
    }

    render(time, context) {
        // const renderPosition = this._position;
        const renderPosition = this._getInterpolatedPosition(time);

        const dimensions = GameRenderer.getDimensions();
        const x = (renderPosition[0] + 0.5) * dimensions[0];
        const y = (renderPosition[1] + 0.5) * dimensions[1];

        context.fillStyle = '#4dade4';
        context.moveTo(x, y);
        context.beginPath();
        context.arc(x, y, 8, 0, Math.PI * 2);
        context.fill();
        context.closePath();

        context.font = '12px Arial';
        context.fillText(this._username, x, y - 16);
    }

    setActive() {
        this._lastActiveTime = Date.now();
    }

    setPosition(x, y) {
        this._lastPosition[0] = this._position[0];
        this._lastPosition[1] = this._position[1];
        this._lastPositionTime = this._positionTime;
        this._position[0] = x;
        this._position[1] = y;
        this._positionTime = Date.now();
    }

    setVelocity(x, y) {
        this._velocity[0] = x;
        this._velocity[1] = y;
    }

    isInactive() {
        return Date.now() - this._lastActiveTime > Player.INACTIVE_DELAY;
    }

    setInput(key, value) {
        this._inputs[key] = value;
    }

    _getInterpolatedPosition(time) {
        const percentageThrough = Math.max(Math.min((time - this._lastPositionTime) / (this._positionTime - this._lastPositionTime), 1), 0);

        return [
            this._lastPosition[0] + (this._position[0] - this._lastPosition[0]) * percentageThrough,
            this._lastPosition[1] + (this._position[1] - this._lastPosition[1]) * percentageThrough,
        ];
    }
}

class PacketProcessor {
    static PACKET_TYPE_POSITION = 0;
    static PACKET_TYPE_VELOCITY = 1;
    static PACKET_TYPE_INPUT = 2;

    // there should ideally be logic in here to respect endianness
    static _buffer = new ArrayBuffer(4);
    static _floatBuffer = new Float32Array(PacketProcessor._buffer);
    static _intBuffer  = new Int32Array(PacketProcessor._buffer);

    static processPacket(username, packet) {
        const packetType = packet.charCodeAt(0);

        switch (packetType) {
            case PacketProcessor.PACKET_TYPE_POSITION: {
                // 1 character for the packet type, 2 characters for each float
                const x = PacketProcessor._getFloatFromString(packet.substring(1));
                const y = PacketProcessor._getFloatFromString(packet.substring(5));

                GameLogic.getPlayer(username).setActive();
                GameLogic.getPlayer(username).setPosition(x, y);

                // continue the rest of the packet since we chain them together
                PacketProcessor.processPacket(username, packet.substring(9));
            } break;

            case PacketProcessor.PACKET_TYPE_VELOCITY: {
                // 1 character for the packet type, 2 characters for each float
                const x = PacketProcessor._getFloatFromString(packet.substring(1));
                const y = PacketProcessor._getFloatFromString(packet.substring(5));

                GameLogic.getPlayer(username).setActive();
                GameLogic.getPlayer(username).setVelocity(x, y);

                // continue the rest of the packet since we chain them together
                PacketProcessor.processPacket(username, packet.substring(9));
            } break;

            case PacketProcessor.PACKET_TYPE_INPUT: {
                // 1 character for all 4 inputs
                const inputVal = packet.charCodeAt(1);
                const w = (inputVal & 0x8) >> 3;
                const a = (inputVal & 0x4) >> 2;
                const s = (inputVal & 0x2) >> 1;
                const d = inputVal & 0x1;

                GameLogic.getPlayer(username).setActive();
                GameLogic.getPlayer(username).setInput(Player.INPUT_W, !!w);
                GameLogic.getPlayer(username).setInput(Player.INPUT_A, !!a);
                GameLogic.getPlayer(username).setInput(Player.INPUT_S, !!s);
                GameLogic.getPlayer(username).setInput(Player.INPUT_D, !!d);

                // continue the rest of the packet since we chain them together
                PacketProcessor.processPacket(username, packet.substring(5));
            } break;

            default:
                break;
        }
    }

    static createPositionPacket(x, y) {
        const xCharacters = PacketProcessor._getCharactersFromFloat(x);
        const yCharacters = PacketProcessor._getCharactersFromFloat(y);

        return String.fromCharCode(PacketProcessor.PACKET_TYPE_POSITION) + xCharacters.join('') + yCharacters.join('');
    }

    static createVelocityPacket(x, y) {
        const xCharacters = PacketProcessor._getCharactersFromFloat(x);
        const yCharacters = PacketProcessor._getCharactersFromFloat(y);

        return String.fromCharCode(PacketProcessor.PACKET_TYPE_VELOCITY) + xCharacters.join('') + yCharacters.join('');
    }

    static createInputPacket(w, a, s, d) {
        const inputVal = (w ? 1 : 0) << 3 | (a ? 1 : 0) << 2 | (s ? 1 : 0) << 1 | (d ? 1 : 0);

        return String.fromCharCode(PacketProcessor.PACKET_TYPE_INPUT) + String.fromCharCode(inputVal);
    }

    static _getCharactersFromFloat(value) {
        PacketProcessor._floatBuffer[0] = value;
        const intVal = PacketProcessor._intBuffer[0];

        return [
            String.fromCharCode((intVal & 0xff000000) >>> 24),
            String.fromCharCode((intVal & 0x00ff0000) >>> 16),
            String.fromCharCode((intVal & 0x0000ff00) >>> 8),
            String.fromCharCode(intVal & 0x000000ff),
        ];
    }

    static _getFloatFromString(string) {
        const values = [
            string.charCodeAt(0),
            string.charCodeAt(1),
            string.charCodeAt(2),
            string.charCodeAt(3),
        ];
        PacketProcessor._intBuffer[0] = (values[0] << 24) | (values[1] << 16) | (values[2] << 8) | values[3];

        return PacketProcessor._floatBuffer[0];
    }
}

if (typeof module === 'undefined') {
    module = {
        exports: null,
    };
}

module.exports = {
    PacketProcessor,
};