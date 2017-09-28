if (process.env.NODE_ENV !== "production") {
  require("dotenv").load();
}

//import express package
var express = require("express");

//import mongodb package
var mongodb = require("mongodb");

var QuipJs = require("quip.js");

var dateFormat = require('dateformat');

var Quip = new QuipJs({
    // Quip Access Token (required)
    accessToken: process.env.QUIP_ACCESS_TOKEN
});

//MongoDB connection URL - mongodb://host:port/dbName
var dbHost = process.env.MONGODB_URI || "mongodb://localhost:27017/fusion_demo";

var PORT = process.env.PORT || 3300;

//DB Object
var dbObject;

//get instance of MongoClient to establish connection
var MongoClient = mongodb.MongoClient;

//Connecting to the Mongodb instance.
MongoClient.connect(dbHost, function(err, db){
  if ( err ) {
    throw err;
  }
  dbObject = db;
});

function rawData(responseObj) {
  var cll = dbObject.collection("pitb");

  cll.aggregate([
    { $match: { yearmonth: { $gte: "2017-08" } } },
    { $group: { _id: { author_name: "$author_name", yearmonth: "$yearmonth" }, total: { $sum: "$count" } } },
    { $sort: { total: -1 } }
  ]).toArray(function(error, docs) {
    responseObj.json(docs);
  });
}

function refreshData(responseObj) {
  var cll = dbObject.collection("pitb");

  //get rid of the old stuff
  //cll.deleteMany({});

  Quip.msg.getMessages({
    "thread_id": "lfjQAAhrQ5cd",
    "count": 1000,
    "max_created_usec": 1504206898932845
  }, function(error, data) {
    if (error) {
      throw error;
    }

    // clean the data so we can query it better
    var item;
    for (var index in data) {
      item = data[index];

      var c = 0;
      if (item.like_user_ids) {
        c = item.like_user_ids.length;
      }
      item.count = c;
      var d = new Date(item.created_usec / 1000);
      item.date = dateFormat(d, "yyyy-mm-dd");
      item.yearmonth = dateFormat(d, "yyyy-mm");
      //console.log(item);
      cll.replaceOne(
        { "id": item.id },
        item,
        { upsert: true }
      );
    }
    // add the new stuff in
    //cll.insertMany(data);

    responseObj.json([{complete: "true"}, item]);
  });
}

function getData(responseObj) {
  var firstThisMonth = new Date();
  firstThisMonth.setDate(1);
  var thisMonth = dateFormat(firstThisMonth, "yyyy-mm");

  var firstLastMonth = new Date();
  firstLastMonth.setMonth(firstThisMonth.getMonth() - 1, 1);
  var lastMonth = dateFormat(firstLastMonth, "yyyy-mm");

  var monthsToUse = {
    thisMonth: {
      label: thisMonth,
      data: []
    },
    lastMonth: {
      label: lastMonth,
      data: []
    }
  };

  //use the find() API and pass an empty query object to retrieve all records
  dbObject.collection("pitb").find({
    yearmonth: { $gte: lastMonth },
    count: { $gt: 0 }
  }).toArray(function(err, docs){
    if ( err ) {
      throw err;
    }

    var collector = {};

    var catArray = [];

    for (var index in docs) {
      var doc = docs[index];

      if (!collector[doc.author_name]) {
        collector[doc.author_name] = {
          "currMonth": 0,
          "prevMonth": 0
        };
      }
      if (doc.yearmonth === thisMonth) {
        collector[doc.author_name].currMonth = doc.count;
      } else if (doc.yearmonth === lastMonth) {
        collector[doc.author_name].prevMonth = doc.count;
      }
    }

    for (var item in collector) {
      //catArray.push({"label": item});
      catArray.push(item);

      //seriesOne.push({"value" : collector[item].currMonth});
      monthsToUse.thisMonth.data.push(collector[item].currMonth);

      //seriesTwo.push({"value" : collector[item].prevMonth});
      monthsToUse.lastMonth.data.push(collector[item].prevMonth);
    }

    var datasets = [
      {
        //"seriesname" : "Current Month",
        "label": monthsToUse.thisMonth.label,
        "data" : monthsToUse.thisMonth.data
      },
      {
        //"seriesname" : "Previous Month",
        "label": monthsToUse.lastMonth.label,
        "data" : monthsToUse.lastMonth.data
      }
    ];

    var response = {
      "datasets" : datasets,
      //"categories" : catArray
      "labels": catArray
    };
    responseObj.json(response);
  });
}

//create express app
var app = express();

//NPM Module to integrate Handlerbars UI template engine with Express
var exphbs  = require("express-handlebars");

//Declaring Express to use Handlerbars template engine with main.handlebars as
//the default layout
app.engine("handlebars", exphbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");

//Defining middleware to serve static files
app.use("/public", express.static("public"));

app.get("/leaderboardData", function(req, res) {
  getData(res);
});
app.get("/refreshLeaderboardData", function(req, res) {
  refreshData(res);
});
app.get("/leaderboardDataRaw", function(req, res) {
  rawData(res);
});
app.get("/", function(req, res) {
  res.render("chart");
});

var server = app.listen(PORT, function() {
  console.log("Server up: http://localhost:" + PORT);
});

process.on('SIGTERM', function () {
  dbObject.close();
  server.close(function () {
    console.log("Server Closed.");
  });
  process.exit(0);
});
