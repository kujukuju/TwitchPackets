
const {PacketProcessor} = require('../src/GameExample');
const TwitchPackets = require('../../public/node/index');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const prompt = (query) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
};

async function main() {
    const useFile = (await prompt('Use a json perm file or manually enter information? Type \'file\' or \'manual\': ')) === 'file';

    let username;
    let hostUsername;
    let clientID;
    let secretToken;
    let refreshToken;

    if (useFile) {
        const relativePath = await prompt('Enter the file path relative to the root project folder: ');

        try {
            const file = JSON.parse(String(fs.readFileSync(path.join(__dirname, '..', '..', relativePath))));
            username = file.username;
            clientID = file.clientID;
            secretToken = file.secret;
            refreshToken = file.refreshToken;

            console.log('Successfully read file.');
            console.log('Username: ' + username);
            console.log('Client ID: ' + clientID);

            hostUsername = await prompt('Please enter the host\'s twitch username: ');
            console.log('Host username: ', hostUsername);
        } catch (error) {
            console.error('Failed to read permission file. ', error);
            throw 'Failed to read permission file.';
        }
    } else {
        username = await prompt('Enter your twitch username: ');
        console.log('Your username: ', username);

        hostUsername = await prompt('Please enter the host\'s twitch username: ');
        console.log('Host username: ', hostUsername);

        clientID = await prompt('Please enter your client ID: ');
        console.log('Client ID: ', clientID);

        secretToken = await prompt('Please enter your secret token: ');
        console.log('Received secret token.');

        refreshToken = await prompt('Please enter your refresh token: ');
        console.log('Received refresh token.');
    }

    TwitchPackets.connectPermanent(username, hostUsername, clientID, secretToken, refreshToken);

    let angle = Math.random() * Math.PI * 2;
    setInterval(() => {
        if (TwitchPackets.canSendPacketImmediately()) {
            const position = [Math.cos(angle) * 0.4, Math.sin(angle) * 0.4];
            const positionPacket = PacketProcessor.createPositionPacket(position[0], position[1]);

            TwitchPackets.send(positionPacket);
        }

        angle += Math.PI / 40;
    }, 17);
}

main();