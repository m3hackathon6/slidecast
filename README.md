# Slidecast

Slidecast is an application that allows you to synchronise a [SlideShare](http://slideshare.net/) presentation across multiple devices. 

Viewers can view the presentation on their own devices, and slide transitions are automatically synchronized. When the presenter moves on to the next slide, so will the viewers. 

## Dependencies

Redis

## Running

1. Install Node.js and npm (Node Package Manager). On OS X:

        $ brew install npm

2. Clone this repo 

3. Download the required dependencies:

        $ cd slidecast
        $ npm install

4. Start Redis:

        $ redis-server

5. Start the server:

        $ npm start

    The app should now be running at [http://localhost:3000/](http://localhost:3000/)

## Developing

To enable debug logging, set an appropriate environment variable:

    $ DEBUG=slidecast npm start

We recommend running the server using nodemon, a tool that automatically restarts the server whenever you change a file.

    $ npm install -g nodemon
    $ DEBUG=slidecast nodemon bin/www

# Attributions

Pikachu image used under [Creative Commons Attribution-NonCommercial-NoDerivs licence](http://creativecommons.org/licenses/by-nc-nd/3.0/). Original is [here](http://kamoodle.deviantart.com/art/Shiny-Pikachu-307350397).

Thanks [sherv.net](http://www.sherv.net/emoticons.html) for free emoticons. Original is [here](http://www.sherv.net/face-emoticons.html).
