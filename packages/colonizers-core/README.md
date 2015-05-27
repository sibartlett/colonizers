# colonizers-core

[![npm](https://img.shields.io/npm/v/colonizers-core.svg)](https://www.npmjs.com/package/colonizers-core)
[![Build Status](https://travis-ci.org/colonizers/colonizers-core.svg?branch=master)](https://travis-ci.org/colonizers/colonizers-core)
[![Dependency Status](https://david-dm.org/colonizers/colonizers-core.svg)](https://david-dm.org/colonizers/colonizers-core)
[![devDependency Status](https://david-dm.org/colonizers/colonizers-core/dev-status.svg)](https://david-dm.org/colonizers/colonizers-core#info=devDependencies)
[![Code Climate](https://codeclimate.com/github/colonizers/colonizers-core/badges/gpa.svg)](https://codeclimate.com/github/colonizers/colonizers-core)

This is the core library for [Colonizers](http://colonizers.github.io), responsible for:

* core game logic
* data serialization formats

Colonizers is an event-driven implementation of the popular board game ["Catan" (formerly "The Settlers of Catan")](http://en.wikipedia.org/wiki/The_Settlers_of_Catan) by Klaus Teuber.

## Components

#### [Game Controller](lib/controller)

The controller is responsible for determining if a player request is a valid. Upon determining if a move is valid, the controller will emit a series of game events. For instance, when a player requests to end their turn the following events are emitted: end turn, start next turn, roll dice and distribute resources.

#### [Game Coordinator](lib/game-coordinator.js)

The coordinator is responsible for mutating the game state based on events emitted by the controller.

#### [Game Objects](lib/game-objects)

These are the objects that hold the game's state, amongst some other functions. These objects include Game, Player, Board, HexTile, HexEdge, HexTile and some other objects. The controller will inspect the game objects when determining if a move is valid, and the coordinator will mutate these objects.

These objects include:
[Game](lib/game-objects/game.js),
[Player](lib/game-objects/player.js),
[Board](lib/game-objects/board.js),
[HexTile](lib/game-objects/hex-tile.js),
[HexEdge](lib/game-objects/hex-edge.js) and
[HexCorner](lib/game-objects/hex-corner.js).

#### [Game Serializer](lib/game-serializer.js)

The serializer is responsible for serializing and deserializing between game objects and the game serialization format.

#### [ScenarioBuilder](lib/scenario-builder.js)

The scenario builder takes a scenario definition and some options, and outputs an object in the [game data format](#serialization) ready to start a game.

## Serialization

There is a data format for game state, with a [JSON schema](schemas/game.json). The data format can represent a game at any point during it's lifecycle; ideal for game saves or transmitting state between server and client. The Game Serializer transforms between this data format and the game objects.

Currently, the data format and schema are still a work in progress.
