# quip leader board

## Run on Heroku:

1. [![Deploy on Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/chadevanssf/quip-chat-leaderboard)
1. Check out the app: `http://<YOUR APP NAME>.herokuapp.com`
1. Refresh the data with the included link, which might take some time to populate.

## Environment/Config Vars

Place these in your .env file OR config vars for Heroku

```
NODE_ENV=dev
QUIP_ACCESS_TOKEN="<access token>"
MONGODB_URI="mongodb://localhost:27017/fusion_demo"
QUIP_THREADID="lfjQAAhrQ5cd"
MONGODB_COLLECTION="something here"
```

## Mongo DB

Since this relies on Mongo DB for data storage, make sure to set up the collection to store this info, and set the environment variable accordingly. Heroku will give you the DB URI to use, set that up as the variable listed in the Config Vars section.

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
