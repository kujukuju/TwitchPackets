const axios = require('axios');

const TwitchPackets = require('../twitchpackets');

// overwrite the getAccessToken method to be node compatible
TwitchPackets.getAccessToken = (clientID, secret, refreshToken) => {
    return new Promise((resolve, reject) => {
        const params = 'grant_type=refresh_token&refresh_token=' + refreshToken + '&client_id=' + clientID + '&client_secret=' + secret;
        axios.post('https://id.twitch.tv/oauth2/token?' + params).then(response => {
            if (response.status !== 200) {
                return reject(response.data);
            }

            console.info('Twitch packets refresh authentication completed successfully.');
            console.log(response);
            return resolve(response.data);
        }).catch(error => {
            return reject(error);
        });
    });
};

module.exports = TwitchPackets;