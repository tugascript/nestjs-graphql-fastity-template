# NestJS GraphQL Monolith Fastify

## Description

Full [NodeJS](https://nodejs.org/en/) boilerplate of a [NestJS](https://nestjs.com/) [GraphQL](https://graphql.org/)
monolithic
backend API using [PostgreSQL](https://www.postgresql.org/) as a the database.

## Technologies

In terms of languages this template takes
a [NestJS GraphQL Code First Approach](https://docs.nestjs.com/graphql/quick-start#code-first), so it's fully written in
[TypeScript](https://www.typescriptlang.org/).

In terms of frameworks it uses:

* [NestJS](https://nestjs.com/) as the main NodeJS framework;
* [Fastify](https://www.fastify.io/) as the HTTP and WS adapter;
* [Mercurius](https://mercurius.dev/#/) as the GraphQL adapter for Fastify;
* [MikroORM](https://mikro-orm.io/) as the ORM for interacting with the database;
* [Sharp](https://sharp.pixelplumbing.com/) for image manipulation and optimization.

## Features

**Configuration** (adds most used config classes)**:**

* Cache with Redis
* GraphQL with subscriptions and GraphQL through Websockets
* MikroORM with SQLite in development and PostgreSQL in production

**Authentication:**

* JWT Authentication for HTTP
* Custom Session Authentication for Websockets (based on Facebook Messenger Design)
* Two-Factor authentication with email

**Uploader:**

* Basic image only uploader with [Sharp](https://sharp.pixelplumbing.com/) optimizations for a generic S3 Bucket

**Pagination:**

* Has the generics for Edges and Paginated types;
* [Relay cursor pagination](https://relay.dev/graphql/connections.htm) function.

## Installation

```bash
$ yarn install
```

## Database Migrations

```bash
# creation
$ yarn migrate:create
# update
$ yarn migrate:update
```

## Running the app

```bash
# production mode
$ yarn start

# watch mode
$ yarn start:dev

# debug mode
$ yarn start:debug
```

## Local setup

1. Create a repo using this template.
2. Install the dependencies:

```bash
$ yarn install
```

3. Create a .env file with all the fields equal to the [example](.env.example).
4. Run the app in development mode:

```bash
$ yarn start:dev
```

## Unit Testing

### BEFORE EACH TEST (Individual or All):

- Check if NODE_ENV is not production
- Remove the current test.db
- Create a new test.db

```bash
# remove test.db
$ rm test.db
# create a new test.db
$ yarn migrate:create
```

### All tests:

```bash
# unit tests
$ yarn run test  --detectOpenHandles
```

### Individual test:

```bash
# unit tests
$ yarn run test service-name.service.spec.ts --detectOpenHandles
```

## Deployment

### Steps:

1. Go to [DigitalOcean](https://www.digitalocean.com/), [Linode](https://www.linode.com/)
   or [Hetzner](https://www.hetzner.com/);
2. Create a server running [Ubuntu LTS](https://ubuntu.com/);
3. Install [dokku](https://dokku.com/docs~v0.28.1/getting-started/installation/#1-install-dokku);
4. Run the following commands on your server for dokku initial set-up:

```bash
$ cat ~/.ssh/authorized_keys | dokku ssh-keys:add admin
$ dokku domains:set-global your-global-domain.com
```

5. Create a new app and connect git:

```bash
$ dokku apps:create app-name
```

6. Add the [Postgres plugin](https://github.com/dokku/dokku-postgres) to dokku, create a new PG instance and link it to
   the app:

```bash
$ sudo dokku plugin:install https://github.com/dokku/dokku-postgres.git postgres
$ dokku postgres:create app-name-db
$ dokku postgres:link app-name-db app-name
```

7. Add the [Redis plugin](https://github.com/dokku/dokku-redis) to dokku, and create a new Redis instance and link it to
   the app:

```bash
$ sudo dokku plugin:install https://github.com/dokku/dokku-redis.git redis
$ dokku redis:create app-name-redis
$ dokku redis:link app-name-redis app-name
```

8. Add all the other configurations as in the [example](.env.example) file:

```bash
$ dokku config:set app-name URL=https://your-domain.com ...
```

9. On the project folder on your local computer run the following commands:

```bash
$ git remote add dokku dokku@your-global-domain.com:app-name
$ git push dokku main:master
```

10. Finally set up SSL and a domain for your app:

```bash
$ sudo dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git
$ dokku config:set --global DOKKU_LETSENCRYPT_EMAIL=your-email@your.domain.com
$ dokku domains:set app-name your-domain.com
$ dokku letsencrypt:enable app-name
$ dokku letsencrypt:cron-job --add 
```

## Support the frameworks used in this template

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If
you'd like to join them, please [read more here](https://docs.nestjs.com/support).

Mikro-ORM is a TypeScript ORM for Node.js based on Data Mapper, Unit of Work and Identity Map patterns. If you like
MikroORM, give it a [star](https://github.com/mikro-orm/mikro-orm) on GitHub and
consider [sponsoring](https://github.com/sponsors/B4nan) its development!

[Sharp](https://sharp.pixelplumbing.com/) is a high performance Node.js image processor. If you want
to [support them.](https://opencollective.com/libvips)

## License

This template is [MIT licensed](LICENSE).
