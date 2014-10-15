# Slidecast

Slidecast is an application that allows you to synchronise a [reveal.js](http://lab.hakim.se/reveal-js/) presentation across multiple devices. 

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
