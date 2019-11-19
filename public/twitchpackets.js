// TODO this should listen to the packet expiration time and automatically regenerate before it expires
class TwitchPackets {
    static MESSAGES_PER_30_SECONDS = 20;
    static EVENT_CONNECT = 'connect';
    static EVENT_DISCONNECT = 'disconnect';
    static EVENT_RAW_MESSAGE = 'raw-message';
    static EVENT_MESSAGE = 'message';
    static EVENT_ERROR = 'error';

    // socket information
    static _socket = null;
    static _autoReconnect = false;
    static _username = null;
    static _hostUsername = null;
    static _clientID = null;
    static _secret = null;
    static _refreshToken = null;

    // event listeners
    static _eventListeners = {};

    // rate limiting
    static _messageSentTimes = [];
    static _messageQueue = [];

    static getAccessToken(clientID, secret, refreshToken) {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.onload = () => {
                if (request.status !== 200) {
                    return reject(request.responseText);
                }

                console.info('Twitch packets refresh authentication completed successfully.');
                return resolve(JSON.parse(request.responseText));
            };
            request.onerror = () => {
                return reject(request.responseText);
            };

            const params = 'grant_type=refresh_token&refresh_token=' + refreshToken + '&client_id=' + clientID + '&client_secret=' + secret;
            request.open('POST', 'https://id.twitch.tv/oauth2/token?' + params, true);
            request.send();
        });
    }

    static connectTemporary(username, hostUsername, accessToken) {
        TwitchPackets._autoReconnect = false;
        TwitchPackets._username = username;
        TwitchPackets._hostUsername = hostUsername;
        TwitchPackets._clientID = null;
        TwitchPackets._secret = null;
        TwitchPackets._refreshToken = null;

        TwitchPackets._connect(accessToken);
    }

    static connectPermanent(username, hostUsername, clientID, secret, refreshToken) {
        TwitchPackets._autoReconnect = true;
        TwitchPackets._username = username;
        TwitchPackets._hostUsername = hostUsername;
        TwitchPackets._clientID = clientID;
        TwitchPackets._secret = secret;
        TwitchPackets._refreshToken = refreshToken;

        TwitchPackets._connect(null);
    }

    static send(message) {
        if (message.length > 500) {
            console.warn('Twitch packets tried to send a message that was over the 500 character limit. ', message);
            return;
        }

        const delay = TwitchPackets._getCurrentMessageDelay();
        const sendPromise = new Promise(resolve => {
            setTimeout(() => {
                TwitchPackets._send('PRIVMSG #' + TwitchPackets._hostUsername + ' :' + message);
                return resolve();
            }, delay);
        });

        TwitchPackets._messageQueue.push(sendPromise);
        sendPromise.then(() => {
            TwitchPackets._messageQueue = TwitchPackets._messageQueue.filter(promise => promise !== sendPromise);
            TwitchPackets._addMessageSentTime();
        });

        return sendPromise;
    }

    static disconnect() {
        TwitchPackets._autoReconnect = false;
        TwitchPackets._username = null;
        TwitchPackets._hostUsername = null;
        TwitchPackets._clientID = null;
        TwitchPackets._secret = null;
        TwitchPackets._refreshToken = null;
        if (TwitchPackets._socket) {
            TwitchPackets._socket.close();
        }
    }

    static isConnected() {
        return TwitchPackets._socket && TwitchPackets._socket.readyState === 1;
    }

    static canSendPacketImmediately() {
        // console.log(TwitchPackets._getCurrentMessageDelay());
        return TwitchPackets._getCurrentMessageDelay() === 0;
    }

    static addListener(event, listener) {
        TwitchPackets._eventListeners[event] = TwitchPackets._eventListeners[event] || [];
        TwitchPackets._eventListeners[event].push(listener);
    }

    static removeListener(event, listener) {
        if (!listener) {
            delete TwitchPackets._eventListeners[event];
        }

        TwitchPackets._eventListeners[event] = (TwitchPackets._eventListeners[event] || []).filter(currentListener => {
            return currentListener !== listener;
        });

        if (TwitchPackets._eventListeners[event].length === 0) {
            delete TwitchPackets._eventListeners[event];
        }
    }

    static _addMessageSentTime() {
        TwitchPackets._messageSentTimes.push(Date.now());
    }

    static _getCurrentMessageDelay() {
        const now = Date.now();

        while (TwitchPackets._messageSentTimes.length > 0 && now - TwitchPackets._messageSentTimes[0] > 30000) {
            TwitchPackets._messageSentTimes.shift();
        }

        // the problem with this logic, although its neat, is that if theres ever a delay in sending, then 30 seconds past that there will be a cluster of sending, then 30 seconds past that there will be another delay, and so on
        // const rate = 30000 / TwitchPackets.MESSAGES_PER_30_SECONDS;
        // const sessionRateDelay = Math.max((TwitchPackets._messageSentTimes.length + 1) * rate - (now - TwitchPackets._messageSentTimes[0] || 0), 0);
        // const queueDelay = TwitchPackets._messageQueue.length * rate;
        // return sessionRateDelay + queueDelay;

        const rate = 30000 / TwitchPackets.MESSAGES_PER_30_SECONDS;
        const mostRecentMessageDelay = Math.max(rate - (now - (TwitchPackets._messageSentTimes[TwitchPackets._messageSentTimes.length - 1] || 0)), 0);
        const queueDelay = TwitchPackets._messageQueue.length * rate;
        return mostRecentMessageDelay + queueDelay;
    }

    static _connect(accessToken) {
        if (TwitchPackets._socket && !(TwitchPackets._socket.readyState === 2 || TwitchPackets._socket.readyState === 3)) {
            console.info('Twitch packets is disconnecting from the current socket...');
            TwitchPackets._socket.close();

            if (!TwitchPackets._autoReconnect) {
                TwitchPackets._createNewSocket(accessToken);
            }
        } else {
            TwitchPackets._createNewSocket(accessToken);
        }
    }

    static _createNewSocket(accessToken) {
        if (accessToken) {
            console.info('Twitch packets is connecting to a new socket...');
            TwitchPackets._socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
            TwitchPackets._socket.addEventListener('message', event => TwitchPackets._onMessage(event));
            TwitchPackets._socket.addEventListener('error', event => TwitchPackets._onError(event));
            TwitchPackets._socket.addEventListener('open', () => TwitchPackets._onOpen(accessToken));
            TwitchPackets._socket.addEventListener('close', () => TwitchPackets._onClose());
            return;
        }

        if (!TwitchPackets._autoReconnect) {
            console.error('Twitch packets attempted to connect to a new socket without being given an access token.');
            return;
        }

        TwitchPackets.getAccessToken(TwitchPackets._clientID, TwitchPackets._secret, TwitchPackets._refreshToken).then(response => {
            if (!response.access_token) {
                console.error('Twitch packets received a valid access token response without an access token. ', response);
                return;
            }

            if (!response.refresh_token) {
                console.error('Twitch packets received a valid access token response without an refresh token. ', response);
                return;
            }

            TwitchPackets._refreshToken = response.refresh_token;
            TwitchPackets._createNewSocket(response.access_token);
        }).catch(error => {
            console.error('Twitch packets refresh authentication request completed with an incorrect status. ', error);
        });
    }

    static _getCredentialInformation() {
        return {
            username: TwitchPackets._username,
            clientID: TwitchPackets._clientID,
            secret: TwitchPackets._secret,
            refreshToken: TwitchPackets._refreshToken,
        };
    }

    static _send(message) {
        if (!TwitchPackets._socket || TwitchPackets._socket.readyState !== 1) {
            console.info('Twitch packets tried to send a message when the socket wasn\'t ready. ', message);
            return;
        }

        // maybe this is extreme but I think I need to fix all characters less than 32 since its text based
        for (let i = 0; i < message.length; i++) {
            const charCode = message.charCodeAt(i);
            if (charCode < 32) {
                message = message.substring(0, i) + String.fromCharCode(0x8000 | charCode) + message.substring(i + 1);
            }
        }
        // let invalidIndex;
        // while ((invalidIndex = message.indexOf(String.fromCharCode(0x0000))) !== -1) {
        //     message = message.substring(0, invalidIndex) + String.fromCharCode(0x8000) + message.substring(invalidIndex + 1);
        // }

        TwitchPackets._socket.send(message);
    }

    static _onMessage(event) {
        TwitchPackets._dispatch(TwitchPackets.EVENT_RAW_MESSAGE, event);

        const username = event.data.split('!')[0].substring(1);
        if (username === TwitchPackets._username) {
            return;
        }

        let message = event.data ? event.data.split('PRIVMSG #' + TwitchPackets._hostUsername + ' :')[1] : undefined;
        if (message === undefined) {
            return;
        }

        for (let i = 0; i < message.length; i++) {
            const charCode = message.charCodeAt(i) - 0x8000;
            if (charCode >= 0 && charCode < 32) {
                message = message.substring(0, i) + String.fromCharCode(charCode) + message.substring(i + 1);
            }
        }
        // let invalidIndex;
        // while ((invalidIndex = message.indexOf(String.fromCharCode(0x8000))) !== -1) {
        //     message = message.substring(0, invalidIndex) + String.fromCharCode(0x0000) + message.substring(invalidIndex + 1);
        // }

        TwitchPackets._dispatch(TwitchPackets.EVENT_MESSAGE, {username: username, message: message});
    }

    static _onError(event) {
        console.error('Twitch packets socket error: ', event);

        TwitchPackets._dispatch(TwitchPackets.EVENT_ERROR, event);
    }

    static _onOpen(accessToken) {
        console.info('Twitch packets socket connected.');
        TwitchPackets._send('PASS oauth:' + accessToken);
        TwitchPackets._send('NICK ' + TwitchPackets._username);
        TwitchPackets._send('JOIN #' + TwitchPackets._hostUsername);

        TwitchPackets._dispatch(TwitchPackets.EVENT_CONNECT);
    }

    static _onClose() {
        console.info('Twitch packets socket closed.');

        TwitchPackets._dispatch(TwitchPackets.EVENT_DISCONNECT);

        if (!TwitchPackets._autoReconnect) {
            console.info('Twitch packets will not attempt to reconnect.');
            return;
        }

        TwitchPackets._createNewSocket(null);
    }

    static _dispatch(event, result) {
        const listeners = TwitchPackets._eventListeners[event] || [];
        for (let i = 0; i < listeners.length; i++) {
            listeners[i](result);
        }
    }
}