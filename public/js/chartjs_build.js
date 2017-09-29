var chartData;

$(function(){
  $.ajax({

    url: '/leaderboardData',
    type: 'GET',
    success : function(data) {
      //var template = Handlebars.compile($("#tabular-template").html());
      //$("#table-location").html(template(data));

      var chartOptions = {
        responsive: true,
        legend: {
          position: "top"
        },
        title: {
          display: true,
          text: "Leaderboard for " + data.title,
        },
        scales: {"yAxes": [
          {"ticks":{"beginAtZero":true}}
        ]}
      };

      var bgColors = [
        "rgba(54, 162, 235, 0.2)", // blue
        "rgba(255, 99, 132, 0.2)", // red
        "rgba(75, 192, 192, 0.2)", // green
        "rgba(255, 159, 64, 0.2)", // orange
        "rgba(255, 205, 86, 0.2)", // yellow
        "rgba(153, 102, 255, 0.2)", // purple
        "rgba(201, 203, 207, 0.2)" // grey
      ];
      var bColors = [
        "rgb(54, 162, 235)", // blue
        "rgb(255, 99, 132)", // red
        "rgb(75, 192, 192)", // green
        "rgb(255, 159, 64)", // orange
        "rgb(255, 205, 86)", // yellow
        "rgb(153, 102, 255)", // purple
        "rgb(201, 203, 207)" // grey
      ];

      for (var index = 0; index < data.datasets.length; index++) {
        var ds = data.datasets[index];
        ds.fill = false;
        ds.backgroundColor = bgColors[index % bgColors.length];
        ds.borderColor = bColors[index % bColors.length];
        ds.borderWidth = 1;
      }

      var ctx = document.getElementById("chart").getContext("2d");
      var chart = new Chart(ctx, {
        "type": "horizontalBar",
        "data": data,
        "options": chartOptions
      });
    }
  });
});
