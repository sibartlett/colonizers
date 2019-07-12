# What is Colonizers?

A HTML5 multiplayer game, based on the popular board game ["Catan" (formerly "The Settlers of Catan")](http://en.wikipedia.org/wiki/The_Settlers_of_Catan) by Klaus Teuber. Users can create user accounts and create/join games. There is also a REST-like API. The web application also works across multiple devices (desktops, tablets, and mobile phones).

![Screenshot](http://i.imgur.com/j91XT2y.png)

# How to use this image

```
docker run  --name some-colonizers --link some-mongo:mongo some-rabbitmq:rabbitmq -d colonizers/colonizers
```

The following environment variables are also honored for configuring your Colonizers instance:

- `-e COLONIZERS_MONGO_URL` (defaults to the linked `mongo` container)
- `-e COLONIZERS_RABBITMQ_URL` (defaults to the linked `rabbitmq` container)
- `-e COLONIZERS_RABBITMQ_QUEUE` (useful when running multiple load-balanaced instances)

If you'd like to be able to access the instance from the host without the container's IP, standard port mappings can be used:

```
docker run  --name some-colonizers --link some-mongo:mongo some-rabbitmq:rabbitmq -p 8080:80 -d colonizers/colonizers
```

Then, access it via `http://localhost:8080` or `http://host-ip:8080` in a browser.

## ... via `docker-compose`

Example docker-compose.yml for `colonizers/colonizers`:

```yml
colonizers:
  image: colonizers/colonizers:latest
  links:
    - mongo
    - rabbitmq
  ports:
    - 8080:80

mongo:
  image: mongo:latest

rabbitmq:
  image: rabbitmq:latest
  hostname: rabbitmq
  environment:
    - RABBITMQ_NODENAME=colonizers
```

Run `docker-compose up`, wait for it to initialize completely, and visit `http://localhost:8080` or `http://host-ip:8080`.

An advanced `docker-compose.yml` file with load-balncing via `nginx` is available. It can be found [here](https://github.com/colonizers/colonizers/blob/master/docker), along with a nginx.conf file.
