# Colonizers

<!-- [![Build Status](https://travis-ci.org/colonizers/colonizers.svg?branch=master)](https://travis-ci.org/colonizers/colonizers)
[![Dependency Status](https://david-dm.org/colonizers/colonizers.svg)](https://david-dm.org/colonizers/colonizers)
[![devDependency Status](https://david-dm.org/colonizers/colonizers/dev-status.svg)](https://david-dm.org/colonizers/colonizers#info=devDependencies)
[![Code Climate](https://codeclimate.com/github/colonizers/colonizers/badges/gpa.svg)](https://codeclimate.com/github/colonizers/colonizers) -->

A HTML5 multiplayer game, based on the popular board game ["Catan" (formerly "The Settlers of Catan")](http://en.wikipedia.org/wiki/The_Settlers_of_Catan) by Klaus Teuber.

Works across multiple devices (desktops, tablets, and mobile phones).

![Screenshot](http://i.imgur.com/j91XT2y.png)

## Running locally

Make sure you have the following installed:

- Node.js 8
- MongoDB
- RabbitMQ

```sh
git clone https://github.com/colonizers/colonizers.git
cd colonizers
yarn
cd packages/colonizers-client
gulp tilesets
cd ../..
yarn start
```

The app should now be running at [http://localhost:3000](http://localhost:3000)

<!-- ## Try it out on Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy) -->

## Related Modules

This application uses the following Colonizers modules:

- [core](https://github.com/colonizers/colonizers-core) - core game logic and data formats
- [client](https://github.com/colonizers/colonizers-client) - gameplay user interface

## A work in progress!

Colonizers is very much a work in progress, with several critical gameplay
features still to be implemented. Breaking changes are to be expected, and the database schema may change.

Contributions (both issues and pull requests) are very welcome!
