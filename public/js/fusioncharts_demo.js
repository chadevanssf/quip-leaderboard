var chartData;

$(function(){
  $.ajax({

    url: '/leaderboardData',
    type: 'GET',
    success : function(data) {
      var template = Handlebars.compile($("#tabular-template").html());
      $("#table-location").html(template(data));

      var chartProperties = {
        "caption": "Leaderboard for Platform Party in the Back",
        "xAxisName": "Author",
        "yAxisName": "Likes",
        "theme": "zune"
      };

      var categoriesArray = [{
          "category" : data.categories
      }];

      var lineChart = new FusionCharts({
        type: 'mscolumn2d',
        renderAt: 'chart-location',
        width: '1000',
        height: '600',
        dataFormat: 'json',
        dataSource: {
          chart: chartProperties,
          categories : categoriesArray,
          dataset : data.datasets
        }
      });
      lineChart.render();
    }
  });
});
