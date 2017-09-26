//import express package
var express = require("express");

//import mongodb package
var mongodb = require("mongodb");

var Quip = require('Quip');

var Quip = new Quip({
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
//Make sure your mongodb daemon mongod is running on port 27017 on localhost
MongoClient.connect(dbHost, function(err, db){
  if ( err ) throw err;
  dbObject = db;
});

function getData(responseObj){
  Quip.msg.getMessages({
    "thread_id": "lfjQAAhrQ5cd",
    "count": 100
  }, function(error, data) {
    if (error)
      throw error;

    // do something with the json response
  });


  //use the find() API and pass an empty query object to retrieve all records
  dbObject.collection("fuel_price").find({}).toArray(function(err, docs){
    if ( err )
      throw err;

    var monthArray = [];
    var petrolPrices = [];
    var dieselPrices = [];

    for (var index in docs){
      var doc = docs[index];
      //category array
      var month = doc.month;
      monthArray.push({"label": doc.month});

      //series 1 values array
      var petrol = doc.petrol;
      petrolPrices.push({"value" : doc.petrol});

      //series 2 values array
      var diesel = doc.diesel;
      dieselPrices.push({"value" : doc.diesel});
    }

    var dataset = [
      {
        "seriesname" : "Petrol Price",
        "data" : petrolPrices
      },
      {
        "seriesname" : "Diesel Price",
        "data": dieselPrices
      }
    ];

    var response = {
      "dataset" : dataset,
      "categories" : monthArray
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

app.get("/leaderboardData", function(req, res){
  getData(res);
});
app.get("/", function(req, res){
  res.render("chart");
});

app.listen(PORT, function(){
  console.log("Server up: http://localhost:" + PORT);
});
