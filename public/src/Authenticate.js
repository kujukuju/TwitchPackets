/**
 * Created by Trent on 11/4/2019.
 */

'use strict';

class Authenticate {
    static REDIRECT_URL = 'http://localhost';

    static authenticate(clientID, secret, code) {
        if (!code) {
            const params = 'client_id=' + clientID + '&redirect_uri=' + encodeURIComponent(Authenticate.REDIRECT_URL) + '&response_type=code&scope=chat:read+chat:edit';
            window.location.href = 'https://id.twitch.tv/oauth2/authorize?' + params;
            return;
        }

        return Authenticate._getToken(clientID, secret, code);
    }

    static refresh(clientID, secret, refreshToken) {
        return Authenticate._refreshToken(clientID, secret, refreshToken);
    }

    static _getToken(clientID, secret, code) {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.onload = () => {
                if (request.status !== 200) {
                    console.log('Request completed with an incorrect status. ', request.status);
                    return reject(request.responseText);
                }

                console.log('Authentication completed.');
                console.log(JSON.parse(request.responseText));
                return resolve(JSON.parse(request.responseText));
            };
            request.onerror = () => {
                return reject(request.responseText);
            };

            const params = 'client_id=' + clientID + '&client_secret=' + secret + '&code=' + code + '&grant_type=authorization_code&redirect_uri=' + encodeURIComponent(Authenticate.REDIRECT_URL);
            request.open('POST', 'https://id.twitch.tv/oauth2/token?' + params, true);
            request.send();
        });
    }

    static _refreshToken(clientID, secret, refreshToken) {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.onload = () => {
                if (request.status !== 200) {
                    console.log('Request completed with an incorrect status. ', request.status);
                    return reject(request.responseText);
                }

                console.log('Refresh authentication completed.');
                console.log(JSON.parse(request.responseText));
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
}