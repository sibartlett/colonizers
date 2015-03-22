# Colonizers

A HTML5 multiplayer game, based on the popular board game ["Catan" (formerly "The Settlers of Catan")](http://en.wikipedia.org/wiki/The_Settlers_of_Catan) by Klaus Teuber.

Works across multiple devices (desktops, tablets, and mobile phones).

![Screenshot](http://i.imgur.com/j91XT2y.png)

[![Dependency Status](https://david-dm.org/colonizers/colonizers.svg)](https://david-dm.org/colonizers/colonizers)
[![devDependency Status](https://david-dm.org/colonizers/colonizers/dev-status.svg)](https://david-dm.org/colonizers/colonizers#info=devDependencies)


## A work in progress!

Colonizers is very much a work in progress, with several critical gameplay
features still to be implemented. Breaking changes are to be expected, and the database schema may change.

Contributions (both issues and pull requests) are very welcome!


## Try it out on Heroku...

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)


## Running locally

Make sure you have [Node.js](https://github.com/joyent/node/wiki/Installation) and [MongoDB](http://www.mongodb.org/display/DOCS/Quickstart) installed.

```sh
git clone https://github.com/sibartlett/colonizers.git
cd colonizers
npm install
npm start
```

The app should now be running at [http://localhost:8080](http://localhost:8080)


## Setting up a development environment

The ```setup-dev-env.sh``` script clones various Colonizers modules into subdirectories, and symlinks them using the ```npm link``` command.

```sh
# Clone Colonizers repository
git clone git@github.com:colonizers/colonizers.git

cd colonizers

# Run setup script
sh setup-dev-env.sh
```
