// TODO this should listen to the packet expiration time and automatically regenerate before it expires
class TwitchPackets {
    static _socket = null;
    static _autoReconnect = false;
    static _username = null;
    static _hostUsername = null;
    static _clientID = null;
    static _secret = null;
    static _refreshToken = null;

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

    static _connect(accessToken) {
        if (TwitchPackets._socket && !(TwitchPackets._socket.readyState === 2 || TwitchPackets._socket.readyState === 3)) {
            console.info('Twitch packets is disconnecting from the current socket...');
            TwitchPackets._socket.close();
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

    static _onMessage(event) {
        console.log('Socket message: ', event);
    }

    static _onError(event) {
        console.error('Twitch packets socket error: ', event);
    }

    static _onOpen(accessToken) {
        TwitchPackets.send('PASS oauth:' + accessToken);
        TwitchPackets.send('NICK ' + TwitchPackets._username);
        TwitchPackets.send('JOIN #' + TwitchPackets._hostUsername);
        TwitchPackets.send('PRIVMSG #' + TwitchPackets._hostUsername + ' :Connection initialized.');
    }

    static _onClose() {
        console.info('Twitch packets socket closed.');

        if (!TwitchPackets._autoReconnect) {
            console.info('Twitch packets will not attempt to reconnect.');
            return;
        }

        TwitchPackets._createNewSocket(null);
    }
}