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

var THREADID = process.env.QUIP_THREADID;
var COLLECTION = process.env.MONGODB_COLLECTION;

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
  var cll = dbObject.collection(COLLECTION);

  cll.aggregate([
    { $match: { yearmonth: { $gte: "2017-08" } } },
    { $group: { _id: { author_name: "$author_name", yearmonth: "$yearmonth" }, total: { $sum: "$count" } } },
    { $sort: { total: -1 } }
  ]).toArray(function(error, docs) {
    responseObj.json(docs);
  });
}

function refreshData(responseObj) {

  var months = getMonths();
  var minMonth = months[months.length - 1];

  //console.log("Min Month " + minMonth);

  function waterfallOver(iterator, callback) {

      var currentMonth;

      function processNext(item) {
        //console.log("Starting processNext " + currentMonth + ", " + item.yearmonth + ", " + item.date);
        currentMonth = item.yearmonth;

        // if nextItemIndex equals the number of items in list, then we're done
        if(currentMonth && currentMonth < minMonth) {
          callback(item);
        } else {
          // otherwise, call the iterator on the next item
          iterator(item, processNext);
        }
      }

      // instead of starting all the iterations, we only start the 1st one
      iterator(null, processNext);
  }

  waterfallOver(function (item, processNext) {
    //console.log("Starting waterfallOver");
    var options = {
      "thread_id": THREADID,
      "count": 100
    };

    if (item) {
      //console.log("max " + item.created_usec + " on this date " + item.date);
      options.max_created_usec = item.created_usec;
    }

    Quip.msg.getMessages(options, function(error, data) {
      if (error) {
        throw error;
      }

      var item = processItems(data);

      processNext(item);
    });
  }, function (item) {
    responseObj.json([{complete: "true"}, item]);
  });

  function processItems(data) {
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
      dbObject.collection(COLLECTION).replaceOne(
        { "id": item.id },
        item,
        { upsert: true }
      );
    }
    return item;
  }
}

function getMonths() {
  var numberOfMonths = 2;
  var months = [];
  var anchorDate = new Date();
  for (var subtract = 0; subtract < numberOfMonths; subtract++) {
    var targetDate = new Date();
    targetDate.setMonth(anchorDate.getMonth() - subtract, 1);
    months.push(dateFormat(targetDate, "yyyy-mm"));
  }

  return months;
}

function getData(responseObj) {
  var months = getMonths();
  var minMonth = months[months.length - 1];

  var monthsToUse = {};
  for (var i = 0; i < months.length; i++) {
    monthsToUse[months[i]] = {
      label: months[i],
      data: []
    };
  }

  dbObject.collection(COLLECTION).aggregate([
    { $match: { yearmonth: { $gte: minMonth } } },
    { $group: {
      _id: { author_name: "$author_name", yearmonth: "$yearmonth" },
      author_name: { $first: "$author_name" },
      yearmonth: { $first: "$yearmonth" },
      total: { $sum: "$count" }
    } },
    { $sort: { total: -1 } }
  ]).toArray(function(err, docs){
    if ( err ) {
      throw err;
    }

    var collector = {};

    var catArray = [];

    for (var index in docs) {
      var doc = docs[index];

      if (!collector[doc.author_name]) {
        collector[doc.author_name] = {};
        for (var d = 0; d < months.length; d++) {
          collector[doc.author_name][months[d]] = 0;
        }
      }
      collector[doc.author_name][doc.yearmonth] += doc.total;
    }

    for (var item in collector) {
      //catArray.push({"label": item});
      catArray.push(item);

      for (var c = 0; c < months.length; c++) {
        monthsToUse[months[c]].data.push(collector[item][months[c]]);
      }
    }

    var datasets = [];
    for (var s = 0; s < months.length; s++) {
      newDS = {
        //"seriesname" : monthsToUse[months[s]].label,
        "label": monthsToUse[months[s]].label,
        "data" : monthsToUse[months[s]].data
      };
      datasets.push(newDS);
    }

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
