## Twitch as a Packet Distributor

Use twitch to send packets between computers at a rate of 20 messages per second!

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

#### Install everything

 > yarn install
 
#### Set up your bot on twitch

* Create a new application
* Name it whatever you want, it only shows then the user is authenticating
* Set the url of your application to http://localhost

#### Twitch setup

* Be sure you have `Non-Mod Chat Delay` turned off in your hosts moderation settings.
* If you're using more than 1 account be sure `Followers-only mode` is turned off in your hosts moderation settings.
* Depending on how you set up your bot system, be sure that `Email Verification` is turned off in your hosts moderation settings.

#### Create json credential files

 > yarn start
 >
 > -> http://localhost/
 >
 > Follow the instructions on the page
 >
 > 


    It seems like this should work using the same bot codes and random users, but that doesn't seem to be the case.