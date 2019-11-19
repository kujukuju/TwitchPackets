/**
 * Created by Trent on 11/4/2019.
 */

'use strict';

const getURLParams = () => {
    const vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => {
        vars[key] = value;
    });

    return vars;
};

window.onload = () => {
    document.getElementById('username-input').value = localStorage.getItem('username-input') || '';
    document.getElementById('host-username-input').value = localStorage.getItem('host-username-input') || '';
    document.getElementById('client-id-input').value = localStorage.getItem('client-id-input') || '';
    document.getElementById('secret-token-input').value = localStorage.getItem('secret-token-input') || '';
    document.getElementById('refresh-token-input').value = localStorage.getItem('refresh-token-input') || '';

    document.getElementById('start-button').onclick = () => {
        // get information provided and url params for the code
        const username = document.getElementById('username-input').value;
        const hostUsername = document.getElementById('host-username-input').value;
        const clientID = document.getElementById('client-id-input').value;
        const secret = document.getElementById('secret-token-input').value;
        const refreshToken = document.getElementById('refresh-token-input').value;
        const code = getURLParams().code || null;
        localStorage.setItem('username-input', username || '');
        localStorage.setItem('host-username-input', hostUsername || '');
        localStorage.setItem('client-id-input', clientID || '');
        localStorage.setItem('secret-token-input', secret || '');
        localStorage.setItem('refresh-token-input', refreshToken || '');

        // the final state is for there to be a refresh token
        if (clientID && secret && refreshToken) {
            TwitchPackets.removeListener(TwitchPackets.EVENT_CONNECT);
            TwitchPackets.addListener(TwitchPackets.EVENT_CONNECT, () => {
                const content = TwitchPackets._getCredentialInformation();
                const blob = new Blob([JSON.stringify(content)], {type: 'text/plain'});
                document.getElementById('download-button').href = window.URL.createObjectURL(blob);
                document.getElementById('download-button').download = content.username + '.json';
                document.getElementById('download-button').disabled = false;
                document.getElementById('download-button').className = '';
            });

            TwitchPackets.removeListener(TwitchPackets.EVENT_DISCONNECT);
            TwitchPackets.addListener(TwitchPackets.EVENT_DISCONNECT, () => {
                document.getElementById('download-button').disabled = true;
                document.getElementById('download-button').className = 'disabled';
            });

            TwitchPackets.connectPermanent(username, hostUsername, clientID, secret, refreshToken);
            return;
        }

        // the second to last state is when you dont have a code
        if (!code) {
            Authenticate.fetchCode(clientID);
            return;
        }

        if (!refreshToken) {
            Authenticate.authenticate(clientID, secret, code).then(response => {
                console.log('Authentication response: ', response);

                const accessToken = response.access_token;
                if (!accessToken) {
                    console.error('Received a response without an access token.');
                    return;
                }

                const refreshToken = response.refresh_token;
                if (!refreshToken) {
                    console.error('Received a response without a refresh token.');
                    return;
                }

                document.getElementById('refresh-token-input').value = refreshToken;
                localStorage.setItem('refresh-token-input', refreshToken);

                window.location = window.location.origin;
            }).catch(error => {
                console.error('Something went wrong completing your authentication request. ', error);
            });
            return;
        }

        console.error('Could not process request due to lack of necessary information provided.');
    };
};