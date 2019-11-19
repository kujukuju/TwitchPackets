/**
 * Created by Trent on 11/4/2019.
 */

'use strict';

class Authenticate {
    static REDIRECT_URL = 'http://localhost';

    static fetchCode(clientID) {
        const params = 'client_id=' + clientID + '&redirect_uri=' + encodeURIComponent(Authenticate.REDIRECT_URL) + '&response_type=code&scope=chat:read+chat:edit';
        window.location.href = 'https://id.twitch.tv/oauth2/authorize?' + params;
    }

    static authenticate(clientID, secret, code) {
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
}