# quip leader board

## Quip CLI

See [https://github.com/kwent/quip.js](https://github.com/kwent/quip.js)

## Environment Vars

Place these in your .env file

```
NODE_ENV=dev
QUIP_ACCESS_TOKEN="<access token>"
MONGODB_URI="mongodb://localhost:27017/fusion_demo"
```

## Helpful commands

Check the output of the rest services

```
quip msg getMessages --payload '{"thread_id":"lfjQAAhrQ5cd"}' --pretty
```

Local Mongo DB:

```
mongod --dbpath ~/Documents/mongodb/data/db/
```
