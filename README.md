# NestJS GraphQL Boilerplate

## Description

Full boiler plate of a NestJS, GraphQL and PostgreSQL (with Mikro-ORM) monolithic backend app.
It implements:

- Configuration (adds most used config classes):

* - Cache with Redis
* - GraphQL with subscriptions and GraphQL through Websockets
* - MikroORM with SQLite in development and PostgreSQL in production

- Authentication:

* - JWT Authentication for HTTP
* - Custom Session Authentication for Websockets (based on Facebook Messenger Design)
* - Two-Factor authentication with email

- Uploader:

* - Basic image only uploader with Sharp optimizations for a generic S3 Bucket

- Pagination:

* - Has the generics for Edges and Paginated types
* - Relay cursor pagination function

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

## Support the frameworks used in this template

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

Mikro-ORM is a TypeScript ORM for Node.js based on Data Mapper, Unit of Work and Identity Map patterns. If you like MikroORM, give it a [star](https://github.com/mikro-orm/mikro-orm) on GitHub and consider [sponsoring](https://github.com/sponsors/B4nan) its development!

[Sharp](https://github.com/lovell/sharp) is a high performance Node.js image processor. If you want to [support them.](https://opencollective.com/libvips)

## License

This template is [MIT licensed](LICENSE).
