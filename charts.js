// You an replace this timeframe with other relative timeframes
// Examples: 'this_6_months', 'previous_6_weeks', or 'this_7_days'
// See the Keen API docs for more relative timeframes: https://keen.io/docs/api/#relative-timeframes
const timeframe = 'this_4_weeks';
const timezone = 'UTC'; // https://keen.io/docs/api/#timezone

const client = new KeenAnalysis({
  projectId: '5011efa95f546f2ce2000000',
  readKey: 'D9E2872BB0841C7D080D77BA1CC6E49E07FBBF8C9312D650396711AA0B02B2F8'
});

const elementCurrentDatetime = document.getElementById('current-datetime');
if (elementCurrentDatetime) elementCurrentDatetime.innerHTML = new Date().toUTCString();

let activeTab;

function jsUcfirst(string)
{
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function switchTab(tabName){
  activeTab = tabName;
  const headerTab = document.querySelector('#header-tab-name');
  headerTab.innerHTML = jsUcfirst(tabName);
  const tabs = document.querySelectorAll('.nav-links .tab a');
  tabs.forEach(tab => {
    tab.classList.remove('active');
    tab.classList.add('text-black-50');
  });
  const tab = document.querySelector(`.nav-links .tab-${tabName} a`);
  tab.classList.add('active');
  tab.classList.remove('text-black-50');
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(tab => {
    tab.classList.add('hide');
  });
  const tabContent = document.getElementById(`tab-content-${tabName}`);
  tabContent.classList.remove('hide');
  window.renderCharts();
}

const aLogo = document.getElementById('a-logo');
aLogo.addEventListener('click', (e) => {
  e.preventDefault();
  switchTab('overview');
});

const aOverview = document.getElementById('a-overview');
aOverview.addEventListener('click', (e) => {
  e.preventDefault();
  switchTab('overview');
});

const aViews = document.getElementById('a-views');
aViews.addEventListener('click', (e) => {
  e.preventDefault();
  switchTab('views');
});

const aClicks = document.getElementById('a-clicks');
aClicks.addEventListener('click', (e) => {
  e.preventDefault();
  switchTab('clicks');
});

const colors = ['#51a5de', '#76ddfb', '#5eadff', '#5e77ff', '#8698fc', '#6d83ff', '#5770ff', '#6d9aff'];

const pieColors = [
  '#5E77FF',
  '#9C60FE',
  '#F162FE',
  '#FD65B7',
  '#FD6768',
  '#FDB86A',
  '#F2FC6C',
  '#A5FC6E',
  '#71FB85',
  '#73FBD0',
  '#76DDFA',
  '#76f4fa',
  '#bb76fa',
  '#fa76bf'
];

const triadicColors = [
  '#5e77ff',
  '#ff5e77',
  '#77ff5e',
  '#ffe65e'
];

const barColors = [
  '#fed760',
  '#FD5E76',
  '#965eff',
  '#9bc77b',
  '#5e77ff',
  '#ffe65e',
  '#ff5e77',

];

function parseInto2DArray(result, columnKey, rowKey){
  const columns = [];
  const rows = [];
  const matrix = [];
  matrix.push(['Index']);
  const nulls = [];
  result.forEach(item => {
    let newColumn = item[columnKey];
    if (matrix[0].indexOf(newColumn) === -1) {
      matrix[0][matrix[0].length] = newColumn;
      nulls.push(null);
    }
  });

  result.forEach(item => {
    let newRow = item[rowKey];
    let rowIndex = matrix.findIndex(rowItem => rowItem[0] === newRow);
    if (rowIndex === -1) {
      matrix[matrix.length] = [newRow, ...nulls];
      rowIndex = matrix.length - 1;
    }
    let columnIndex = matrix[0].findIndex(rowItem => rowItem === item[columnKey]);
    matrix[rowIndex][columnIndex] = item.result;
  });

  return matrix;
}

const areaChartWithDetails = ({
  client,
  container,
  queries,
  title
}) => {
  const containerElement = document.getElementById(container);
  containerElement.innerHTML = `
  <div class="perecent-difference"></div>
  <div class="current-count"></div>
  <div class="chart"></div>`;

  client
  .query({
    saved_query_name: queries.current
  })
  .then(res => {
    const countPageviewsPrevious24h = res.result;
    client
    .query({
      saved_query_name: queries.compareWith
    })
    .then(res => {
      const countPageviewsPrevious24hDayAgo = res.result - countPageviewsPrevious24h;

      let percentDifference = Math.round(countPageviewsPrevious24h/countPageviewsPrevious24hDayAgo*100);
      if (percentDifference < 100) {
        percentDifference = (100 - percentDifference)*-1;
      }
      if (percentDifference > 100) {
        percentDifference -= 100;
      }

      const countLabel = containerElement.querySelector('.current-count');
      countLabel.innerHTML = countPageviewsPrevious24h;
      const percentLabel = containerElement.querySelector('.perecent-difference');
      let faDirection = 'up';
      if (percentDifference < 0){
        faDirection = 'down';
        percentLabel.classList.add('chart-inline-label-decreased', 'chart-inline-label-decreased-important');
        countLabel.classList.add('chart-inline-label-decreased');
      }
      if (percentDifference > 0){
        percentLabel.classList.add('chart-inline-label-increased');
        countLabel.classList.add('chart-inline-label-increased');
      }
      percentLabel.innerHTML = `<i class='fas fa-angle-${faDirection}'></i> ${percentDifference} %`;

    });
  });


  client
  .query({
    saved_query_name: queries.area
  })
  .then(res => {
    const chartRoot = containerElement.querySelector(".chart");
    const revenueChart = new KeenDataviz({
      container: chartRoot,
      title,
      results: res,
      type: 'area-spline',
      point: {
        r: 0,
        focus: {
          expand: {
            r: 5,
            enabled: true
          },
        },
        select: {
          r: 5,
          enabled: true
        }
      },
      axis: {
        y: {
          show: false
        },
        x: {
          show:false
        }
      },
      grid:{
        x: {
          show: false
        },
        y: {
          show: false
        }
      },
      colors: ['#5e77ff'],
      padding: {
        left: 0,
        right: 0
      },
    });
  });
};



window.renderCharts = () => {

  if (activeTab === 'views') {
    client
    .query({
      saved_query_name: 'autocollector-dashboard-demo---pageviews-by-country-interval-daily'
    })
    .then(results => {
      results.result.forEach(result => {
        result.value.sort((a,b) =>{
          return b.result - a.result;
        })
        .splice(7, 9999);
      });
      const chart = new KeenDataviz({
        container: `.chart-pageviews-by-country-interval-daily`,
        title: 'Views by country',
        type: 'bar',
        legend: {
          position: 'right',
          pagination: {
            limit: 9
          },
          label: {
            textMaxLength: 30
          }
        },
        results,
        sortGroups: 'desc',
        colors: pieColors,
        padding: {
          left: 55,
          top: 0,
          right: 25,
          bottom: 30
        }
      });
    });

    client
    .query({
      saved_query_name: 'autocollector-dashboard-demo---count-pageviews-by-day-of-week'
    })
    .then(results => {
      const chart = new KeenDataviz({
        container: `.chart-pageviews-by-day-of-week`,
        title: 'Views by day of the week',
        type: 'area',
        labelMapping: {
          1: 'Sun',
          2: 'Mon',
          3: 'Tue',
          4: 'Wed',
          5: 'Thu',
          6: 'Fri',
          7: 'Sat'
        },
        legend: {
          position: 'right',
          pagination: {
            limit: 7
          },
          label: {
            textMaxLength: 30
          }
        },
        colors: pieColors,
        results,
        padding: {
          left: 60,
          top: 0,
          right: 30,
          bottom: 20
        }
      });
    });

    client
    .query({
      saved_query_name: 'autocollector-dashboard-demo---views-by-hour'
    })
    .then(results => {
      const chart = new KeenDataviz({
        container: `.chart-views-by-hour`,
        title: 'Views by hour',
        type: 'bar',
        legend: {
          position: 'right',
          pagination: {
            limit: 7
          },
          label: {
            textMaxLength: 30
          }
        },
        colors: pieColors,
        results,
        padding: {
          left: 45,
          top: 0,
          right: 20,
          bottom: 20
        },
        axis:{

        }
      });
    });



    client
    .query({
      saved_query_name: 'autocollector-dashboard-demo---count-views-by-page'
    })
    .then(results => {
      results.result.sort((a,b) =>{
        return b.result - a.result;
      })
      .splice(10, 9999);
      const chart = new KeenDataviz({
        container: `.chart-count-views-by-page`,
        title: 'Top pages by views',
        type: 'pie',
        stacked: true,
        //  sortGroups: 'desc',
        legend: {
          position: 'right',
          pagination: {
            limit: 10
          },
          label: {
            textMaxLength: 30
          }
        },
        colors: pieColors,
        results,
        padding: {
          left: 0,
          top: 0,
          right: 0,
          bottom: 0
        }
      });
    });

    client
    .query({
      saved_query_name: 'autocollector-dashboard-demo---longest-time-on-page'
    })
    .then(results => {
      results.result.forEach(a =>{
        a.result = (a.result).toFixed(0);
      });
      results.result.sort((a,b) =>{
        return b.result - a.result;
      });
      const chart = new KeenDataviz({
        container: `.chart-longest-time-on-page`,
        title: 'Time on page',
        type: 'table',
        labelMapping: {
          Index: 'Link',
          Result: 'Seconds'
        },
        labelMappingDimension: 'column',
        results
      });
    });

    client
    .query({
      saved_query_name: 'autocollector-dashboard-demo---percent-of-page-read'
    })
    .then(results => {
      results.result.forEach(a =>{
        a.result = (a.result * 100).toFixed(0);
      });
      results.result.sort((a,b) =>{
        return b.result - a.result;
      });
      const chart = new KeenDataviz({
        container: `.chart-percent-of-page-read`,
        title: 'Pages by scroll depth',
        type: 'table',
        labelMapping: {
          Index: 'Page',
          Result: '%'
        },
        labelMappingDimension: 'column',
        legend: {
          position: 'right',
          pagination: {
            limit: 6
          },
          label: {
            textMaxLength: 30
          }
        },
        colors: pieColors,
        results
      });
    });


    client
    .query({
      saved_query_name: 'autocollector-dashboard-demo---count-pageviews-top-referrers-previous-7-days'
    })
    .then(function(results){
      // Handle the result
      results.result.sort((a,b) =>{
        return b.result - a.result;
      })
      .splice(20,9999);
      const chart = new KeenDataviz({
        container: `.chart-pageviews-by-referrer`,
        title: 'Pageviews by referrer',
        type: 'donut',
        labelMapping: {
          Index: 'Domain',
          Result: 'Visitors'
        },
        labelMappingDimension: 'column',
        legend: {
          position: 'left',
          label: {
            textMaxLength: 32
          },
          pagination: {
            limit: 11
          }
        },
        padding:{
          left: 40
        },
        donut: {
          width: 60
        },
        colors: pieColors,

        results
      });

    })
    .catch(function(err){
      // Handle the error

    });


    client
    .query({
      saved_query_name: 'autocollector-dashboard-demo---screen-width'
    })
    .then(function(results){
      // Handle the result
      results.result.sort((a,b) =>{
        return b.result - a.result;
      })
      .splice(10,9999);

      const chart = new KeenDataviz({
        container: `.chart-top-pages-screen-width`,
        title: 'Screen resolutions',
        type: 'horizontal-bar',
        results,
        colors: pieColors,
        padding: {
          bottom: 20
        }
      });

    })
    .catch(function(err){
      // Handle the error

    });

    client
    .query({
      saved_query_name: 'autocollector-dashboard-demo---pageviews-by-os'
    })
    .then(function(results){
      // Handle the result
      results.result.sort((a,b) =>{
        return b.result - a.result;
      })
      .splice(3,9999);

      const chart = new KeenDataviz({
        container: `.chart-pageviews-by-os`,
        title: 'Guests by OS',
        type: 'bar',
        results,
        colors: pieColors,
        padding: {
          bottom: 20,
          right: 30
        }
      });

    })
    .catch(function(err){
      // Handle the error

    });

    // !!! pageviews

    client
    .query({
      saved_query_name: 'autocollector-dashboard-demo---count-pageviews-previous-7d-interval-daily'
    })
    .then(results => {

      client
      .query({
        saved_query_name: 'autocollector-dashboard-demo---count-pageviews-previous-7d-interval-daily-unique-users'
      })
      .then(results2 => {

        const pageviewsInterval = new KeenDataviz({
          container: '#chart-views-uniques-7d',
          title: 'Page views by day',
          type: 'area',
          colors: pieColors,
          results: [results, results2],
          legend: {
            position: 'top'
          },
          labelMapping: {
            'pageviews count': 'Views',
            'pageviews count_unique': 'Uniques'
          },
          sortGroups: 'desc',
          padding: {
            left: 50,
            top: 0,
            right: 35,
            bottom: 10
          },

          point: {
            r: 0,
            focus: {
              expand: {
                r: 4,
                enabled: true
              },
            },
            select: {
              r: 5,
              enabled: true
            }
          },
          padding: {
            right: 20,
            left: 40,
          },
        });

        pageviewsInterval.view._artifacts.c3.select(false, false);

      });

    });

    return;
  }


  if (activeTab === 'clicks') {


    client
    .query({
      saved_query_name: 'autocollector-dashboard-demo---clicks-by-country-daily'
    })
    .then(function(results){
      // Handle the result
      results.result.forEach(result => {
        result.value.sort((a,b) =>{
          return b.result - a.result;
        })
        .splice(7, 9999);
      });
      const chart = new KeenDataviz({
        container: `.chart-clicks-by-country-daily`,
        title: 'Clicks by Country daily',
        type: 'bar',
        padding:{
          left: 60,
          bottom: 20
        },
        legend: {
          pagination:{
            limit: 12
          },
          label: {
            textMaxLength: 32
          }
        },
        colors: pieColors,
        results,
        sortGroups: 'desc'
      });
      chart.view._artifacts.c3.select(false, false);
    })
    .catch(function(err){
      // Handle the error

    });

    client
    .query({
      saved_query_name: 'autocollector-dashboard-demo---clicks-by-country'
    })
    .then(function(results){
      // Handle the result

      const chart = new KeenDataviz({
        container: `.chart-clicks-by-country`,
        title: 'Overall clicks by Country',
        type: 'pie',
        padding:{
          left: 50,
          bottom: 20
        },
        legend: {
          pagination:{
            limit: 8
          },
          label: {
            textMaxLength: 32
          }
        },
        colors: pieColors,
        results,
        sortGroups: 'desc'
      });
    })
    .catch(function(err){
      // Handle the error

    });






    client
    .query({
      saved_query_name: 'autocollector-dashboard-demo---outbound-clicks'
    })
    .then(results => {
      results.result.sort((a,b) =>{
        return b.result - a.result;
      })
      .splice(10,9999);
      const chart = new KeenDataviz({
        container: `.chart-outbound-clicks`,
        title: 'Outbound link clicks',
        type: 'table',
        labelMapping: {
          Index: 'Link',
          Result: 'Clicks'
        },
        labelMappingDimension: 'column',
        results
      });
    });



    client
    .query({
      saved_query_name: 'autocollector-dashboard-demo---clicks-by-html-tag'
    })
    .then(results => {
      results.result
      .splice(10,9999);
      const chart = new KeenDataviz({
        container: `.chart-clicks-by-html-tag`,
        title: 'Clicks by HTML tag',
        type: 'donut',
        colors: pieColors,
        results,
        sortGroups: 'desc',
        legend: {
          pagination: {
            limit: 18
          }
        },
        padding:{
          bottom: 20
        }
      });
    });

    client
    .query({
      saved_query_name: 'autocollector-dashboard-demo---clicks-by-button-in-org-section'
    })
    .then(results => {
      results.result
      .splice(10,9999);

      results.result.forEach(item => {
        item['element.text'] = item['element.text'].trim();
      });

      results.result = results.result.filter(item => {
        return !!item['element.text'];
      });

      const chart = new KeenDataviz({
        container: `.chart-clicks-by-button-in-org-section`,
        title: 'Clicks by Button in Projects',
        type: 'horizontal-bar',
        results,
        colors: pieColors,
        sortGroups: 'desc',
        padding:{
          left: 140,
          bottom: 20
        },
      });
    });

    client
    .query({
      saved_query_name: 'autocollector-dashboard-demo---clicks-by-button-in-static-section'
    })
    .then(results => {

      results.result.sort((a,b) =>{
        return b.result - a.result;
      })
      .splice(12,9999);

      results.result.forEach(item => {
        item['element.text'] = item['element.text'].trim();
      });

      results.result = results.result.filter(item => {
        return !!item['element.text'];
      });

      const chart = new KeenDataviz({
        container: `.chart-clicks-by-button-in-static-section`,
        title: 'Clicks by Button in Docs',
        type: 'pie',
        colors: pieColors,
        results,
        sortGroups: 'desc',
        padding:{
          left: 20,
          bottom: 20
        },
        legend:{
          pagination: {
            limit: 22
          },
          label:{
            textMaxLength: 32
          }
        }
      });
    });



    client
    .query({
      saved_query_name: 'autocollector-dashboard-demo---clicks-api-docs-sdks'
    })
    .then(results => {

      results.result.sort((a,b) =>{
        return b.result - a.result;
      })
      .splice(12,9999);

      results.result.forEach(item => {
        item['element.text'] = item['element.text'].trim();
      });

      results.result = results.result.filter(item => {
        return !!item['element.text'];
      });

      const chart = new KeenDataviz({
        container: `.chart-clicks-api-docs-sdks`,
        title: 'API SDKs',
        type: 'pie',
        colors: pieColors,
        results,
        sortGroups: 'desc',
        padding:{
          left: 20,
          bottom: 20
        },
        legend:{
          pagination: {
            limit: 22
          },
          label:{
            textMaxLength: 32
          }
        }
      });
    });





    client
    .query({
      saved_query_name: 'autocollector-dashboard-demo---clicks-login-google-github'
    })
    .then(results => {
      results.result.sort((a,b) =>{
        return b.result - a.result;
      })
      .splice(2,9999);

      const chart = new KeenDataviz({
        container: `.chart-clicks-login-google-github`,
        title: 'Sign Up clicks',
        type: 'bar',
        colors: pieColors,
        results,
        sortGroups: 'desc',
        padding:{
          left: 50,
          bottom: 20
        },
        legend:{
          label:{
            textMaxLength: 32
          }
        }
      });
    });



    client
    .query({
      saved_query_name: 'autocollector-dashboard-demo---clicks-api-docs-sdks-by-country'
    })
    .then(results => {

      results.result.sort((a,b) =>{
        return b.result - a.result;
      })
      .splice(6,9999);

      const chart = new KeenDataviz({
        container: `.chart-clicks-api-docs-sdks-by-country`,
        title: 'The most popular SDKs by Country',
        type: 'bar',
        colors: pieColors,
        results,
        sortGroups: 'desc',
        padding:{
          left: 50,
          bottom: 20
        },
        legend:{
          label:{
            textMaxLength: 32
          }
        }
      });
    });



    client
    .query({
      saved_query_name: 'autocollector-dashboard-demo---clicks-explorer'
    })
    .then(results => {

      const chart = new KeenDataviz({
        container: `.chart-clicks-explorer`,
        title: 'Clicks in the Keen Explorer',
        type: 'area-step',
        colors: pieColors,
        results,
        sortGroups: 'desc',
        padding:{
          left: 50,
          bottom: 20
        },
        legend:{
          label:{
            textMaxLength: 32
          }
        }
      });
    });


  }

  if (activeTab === 'overview') {

    areaChartWithDetails({
      client,
      title: 'Views Last 24h',
      container: 'chart-views-last-24h',
      queries: {
        current: 'autocollector-dashboard-demo---count-pageviews-previous-24h',
        compareWith: 'autocollector-dashboard-demo---count-pageviews-previous-48h',
        area: 'autocollector-dashboard-demo---count-pageviews-previous-24h-interval-hourly'
      }
    });

    areaChartWithDetails({
      client,
      title: 'Views Last 7d',
      container: 'chart-views-last-7d',
      queries: {
        current: 'autocollector-dashboard-demo---count-pageviews-previous-7d',
        compareWith: 'autocollector-dashboard-demo---count-pageviews-previous-14d',
        area: 'autocollector-dashboard-demo---count-pageviews-previous-7d-interval-daily'
      }
    });

    areaChartWithDetails({
      client,
      title: 'Clicks Last 24h',
      container: 'chart-clicks-last-24h',
      queries: {
        current: 'autocollector-dashboard-demo---count-clicks-previous-24h',
        compareWith: 'autocollector-dashboard-demo---count-clicks-previous-48h',
        area: 'autocollector-dashboard-demo---count-clicks-previous-24h-interval-hourly'
      }
    });

    areaChartWithDetails({
      client,
      title: 'Clicks Last 7d',
      container: 'chart-clicks-last-7d',
      queries: {
        current: 'autocollector-dashboard-demo---count-clicks-previous-7d',
        compareWith: 'autocollector-dashboard-demo---count-clicks-previous-14d',
        area: 'autocollector-dashboard-demo---count-clicks-previous-7d-interval-daily'
      }
    });

    client
    .query({
      saved_query_name: 'autocollector-dashboard-demo---count-pageviews-by-city'
    })
    .then(res => {

      const citiesFromResult = res.result;
      citiesFromResult.forEach(cityFromResult => {
        let cityInCoordinatesArray =
        coordinates.find(item => item.fields.city.toLowerCase() === cityFromResult['geo.city'].toLowerCase());
        if (cityInCoordinatesArray) {
          cityFromResult.coordinates = cityInCoordinatesArray.geometry.coordinates;
        }
      });
      const citiesWithCoordinates = citiesFromResult.filter(city => !!city.coordinates);

      let activeMapData;
      const appMapAreaNode = document.getElementById('map');

      function init(){
        window.mapInited = true;
        L.mapbox.accessToken = 'pk.eyJ1Ijoia2Vlbi1pbyIsImEiOiIza0xnNXBZIn0.PgzKlxBmYkOq6jBGErpqOg';
        const map = L.mapbox.map('map', 'keen-io.kae20cg0', {
          attributionControl: true,
          center: [ 35.77350, -98.41104 ],
          zoom: 5
        });
        activeMapData = L.layerGroup().addTo(map);
        activeMapData.clearLayers();

        citiesWithCoordinates.forEach((city, index) => {
          let size = 'small';
          if (city.result > 3) {
            size = 'medium';
          }
          if (city.result > 7) {
            size = 'large';
          }
          var em = L.marker(new L.LatLng(city.coordinates[1], city.coordinates[0]), {
            icon: L.mapbox.marker.icon({
              'marker-color': {
                small: pieColors[0],
                medium: pieColors[1],
                large: pieColors[2]
              }[size],
              'marker-size':  size,
              'marker-symbol': city.result
            })
          }).addTo(activeMapData);;
        });
        /*
        icon: L.icon({
        'marker-color': '#00bbde',
        iconUrl: './img/large.png',
        iconRetinaUrl: './img/large.png',
        iconSize: [size, size]
      })
      */
    }

    if (!window.mapInited) {
      init();
    }

  });

  client
  .query({
    saved_query_name: 'autocollector-dashboard-demo---count-pageviews-top-referrers-previous-7-days-interval-daily'
  })
  .then(results => {
    new KeenDataviz({
      container: '.chart-top-referrers',
      title: 'Views By Top 3 Sources',
      type: 'area-spline',
      colors: pieColors,
      results,
      legend: {
        position: 'top'
      },
      labelMapping: {
        'fbads': 'Facebook',
        'adwords': 'Google',
        'sendgrid_docs': 'Sendgrid'
      },
      sortGroups: 'desc',
      padding: {
        left: 50,
        top: 0,
        right: 35,
        bottom: 0
      }
    });
  });


  /*
  client
  .query({
  saved_query_name: 'autocollector-dashboard-demo---count-pageviews-by-browser-family'
})
.then(results => {

const revenuexChart = new KeenDataviz({
container: '.chart-user-agents',
title: 'User agents',
type: 'pie',
colors: pieColors,
results,
sortGroups: 'desc',
legend: {
pagination: {
limit: 4
}
},
size: {
width: 320
}
});
});
*/

const metricBox = ({ title, value, container, icon }) => {
  const element = document.getElementById(container);
  element.innerHTML = `
  <i class='fas fa-${icon}'></i>
  <div class='label'>
  <div class='value'>${value}</div>
  <div class='title'>${title}</div>
  </div>
  `;
};

client
.query({
  saved_query_name: 'autocollector-dashboard-demo---unique-users-this-7d'
})
.then(results => {
  metricBox({
    title: 'Unique Visitors',
    icon: 'users',
    value: results.result,
    container: 'unique-users-this-7d'
  });
});

client
.query({
  saved_query_name: 'autocollector-dashboard-demo---average-time-on-page'
})
.then(results => {
  metricBox({
    title: 'Avg Time on Site',
    icon: 'clock',
    value: results.result.toFixed(0) + ' seconds',
    container: 'average-time-on-page'
  });
});

client
.query({
  saved_query_name: 'autocollector-dashboard-demo---average-clicks-per-user'
})
.then(results => {
  const clicksPerUser = Math.floor(
    results.result.reduce((acc = 0, item) => {
      return (acc.result || acc || 0) + parseInt(item.result);
    }) / results.result.length
  );
  metricBox({
    title: 'Avg Clicks per User',
    icon: 'hand-pointer',
    value: clicksPerUser,
    container: 'average-clicks-per-user'
  });
});

client
.query({
  saved_query_name: 'autocollector-dashboard-demo---average-scroll-ratio'
})
.then(results => {
  metricBox({
    title: 'Avg Page Read',
    icon: 'percent',
    value: results.result.toFixed(2) * 100,
    container: 'average-scroll-ratio'
  });
});

return;

}

}

switchTab('overview');
