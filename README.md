## Twitch as a Packet Distributor

Use twitch to send packets between computers at a rate of 2 messages per second!

    NOTE: The accounts used must be mods, or otherwise you have to lower their messages per 30 seconds to 20 in the source code.
    Even then you'll probably still be "shadow muted" if you're not a mod.

This library lets you do 3 things:
* Create json credential files for your account.
    * You can use the web server locally to generate json credential files for each of your bots. These files contain all information necessary for the library to authenticate.
    * See the section `create json credential files` below.
* Generate an authentication token using the json credential file information.
    * The information needed is your bot client ID, your bot secret key, and a refresh token.
    * This authentication token is used to log into the twitch redistribution channel in the next step.
* Log in to the twitch redistribution channel using your twitch username, a host channel twitch username, and an authentication token.
    * You should use this method after the authentication token has been generated on a server using the json credential file and passed to the client.
    * See the section `` below.


    NOTE: You could potentially be banned on twitch for using this bot and using twitch as a packet distributor.

#### Install everything locally

 > Clone the repository.
 >
 > Be sure you have yarn installed. *[https://yarnpkg.com/](https://yarnpkg.com/)*
 >
 > `cd TwitchPackets`
 >
 > `yarn install`
 >
 > `yarn start`
 >
 > Navigate to *[http://localhost/](http://localhost/)* and see that the website works.
 
#### Set up your application on twitch

* Create a new application.
* Name it whatever you want, it only shows when the user is authenticating.
* Set the oauth redirect url to `http://localhost` in the application management settings.

#### Create a bot and download json credential files

* To create a bot just create a new account on twitch.
* Your bot apparently must be a mod in your channel if you're going to get near the 20 messages per 30 second limit, otherwise you'll be shadow muted by twitch for some arbitrary amount of time. I learned.
* Once this account is created navigate back to *[http://localhost/](http://localhost/)* and follow the instructions on the website.
* Once you've authenticated you can click "download credential file" and store this on your server. The information in this file can be used to refresh your auth token.

#### Twitch setup

* Be sure you have `Non-Mod Chat Delay` turned off in your hosts moderation settings.
* If you're using more than 1 account be sure `Followers-only mode` is turned off in your hosts moderation settings.
* Depending on how you set up your bot system, be sure that `Email Verification` is turned off in your hosts moderation settings.