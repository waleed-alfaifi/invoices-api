# Invoices App API

An API built for the [invoices manager app](https://github.com/waleed-alfaifi/invoice-app) using TypeScript and Prisma with Node and Express.

## Run locally

To run locally, you need to provide a `DATABASE_URL` in a `.env` file in the project folder. See `.env.example`.

```
git clone https://github.com/waleed-alfaifi/invoices-api.git
npm install
npm run start:dev
```

API routes will be served by http://localhost:5000 in development.

## TODOs

- [ ] Cache `GET` responses
- [ ] Add rate limiting
- [ ] Create docs using Swagger

## License
MIT
