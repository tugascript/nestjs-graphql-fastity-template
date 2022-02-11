# NestJS GraphQL Boilerplate

## Description

Full boiler plate of a NestJS, GraphQL and PostgreSQL (with Mikro-ORM) monolithic backend app.
It implements:

- Configuration (adds most used config classes):

* - Cache with Redis
* - GraphQL with dataloaders, subscriptions and GraphQL through Websockets
* - MikroORM with SQLite in development and PostgreSQL in production

- Authentication:

* - JWT Authentication for HTTP
* - Custom Session Authentication for Websockets (based on Facebook Messenger Design)
* - Two-Factor authentication with email

- Uploader:

* - Basic image only uploader with Sharp optimizations for a Linode Bucket (it can be changed for AWS S3)

- Pagination:

* - Has the generics for Edges and Paginated types
* - A basic one way cursor pagination function

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
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Unit Testing

BEFORE EACH TEST:

- Check if NODE_ENV is not production
- Remove the current test.db
- Create a new test.db

```bash
# remove test.db
$ rm test.db

# create a new test.db
$ yarn migrate:create
```

EACH TEST SHOULD BE RUN SEPERATLY

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
