# quip leader board

## Run on Heroku:

1. [![Deploy on Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/chadevanssf/quip-chat-leaderboard)
1. Check out the app: `http://<YOUR APP NAME>.herokuapp.com`

## Environment/Config Vars

Place these in your .env file OR config vars for Heroku

```
NODE_ENV=dev
QUIP_ACCESS_TOKEN="<access token>"
MONGODB_URI="mongodb://localhost:27017/fusion_demo"
QUIP_THREADID="lfjQAAhrQ5cd"
MONGODB_COLLECTION="pitb"
```

## Quip CLI

See [https://github.com/kwent/quip.js](https://github.com/kwent/quip.js)

## Helpful commands

Check the output of the rest services

```
quip msg getMessages --payload '{"thread_id":"lfjQAAhrQ5cd"}' --pretty
```

Local Mongo DB:

```
mongod --dbpath ~/Documents/mongodb/data/db/
```
