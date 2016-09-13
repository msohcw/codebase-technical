var _Geocoder;

var startLatLng, endLatLng;
var rideList = [];

$(document).ready(function(){
  $('#est-submit').click(function(event){
    event.preventDefault();
    start = $('#est-start-input').val();
    end = $('#est-end-input').val();
    startLatLng = latLngPair(start);
    endLatLng = latLngPair(end);
    if(!startLatLng) geocode(start, 'start');
    if(!endLatLng) geocode(end, 'end');

    // Small hack, but avoids callback
    var check = setInterval(function(){
      if(startLatLng && endLatLng){
        clearInterval(check);
        compare(startLatLng, endLatLng);
      }
    }, 100);
  }) 
})

function initGoogleMaps(){
  console.log("Google Maps API loaded");
  _Geocoder = new google.maps.Geocoder();
}

function latLngPair(string){
  var valid = new RegExp(/-?[0-9]+\.[0-9]+[^0-9-]+-?[0-9]+\.[0-9]+/, 'g');
  var each = new RegExp(/-?[0-9]+\.[0-9]+((?=[^0-9-])|(?=$))/, 'g');

  if(!valid.test(string)) return false;

  var matches = [];
  string.replace(each, function(x){
    matches.push(x);
    return x;
  })
  
  var latLng = {'lat': matches[0], 'lng': matches[1]};
  return latLng;
}

function geocode(location, name){
  _Geocoder.geocode({'address':location}, function(results, status){
    if(status == 'OK'){
      var latLng = results[0].geometry.location;
      latLng = {'lat' : latLng.lat(), 'lng' : latLng.lng()};
      if(name == 'start') startLatLng = latLng;
      if(name == 'end') endLatLng = latLng;
    }else{
      console.log('Geocoding failed. Tried to geocode ' + location +'. Got ' + status + ' ' + results);
      return false;
    }
  })
}

function compare(startLatLng, endLatLng){
  var valid = ['uberX', 'UberBLACK', 'uberXL', 'UberSUV', 'POOL', 'Lyft', 'Lyft Plus', 'Lyft Line'];
  var query = '?';
  query += 'start_lat=' + startLatLng['lat'];
  query += '&start_lng=' + startLatLng['lng'];
  query += '&end_lat=' + endLatLng['lat'];
  query += '&end_lng=' + endLatLng['lng'];

  rideList = [];

  // lyft
  var lyft_done = false;
  $.ajax({
    'url' : '/estimates/lyft' + query,
    'success' : function(results){
      var estimates = results['cost_estimates'];
      console.log(estimates);
      for(var i = 0; i < estimates.length; ++i){
        var display = estimates[i]['display_name'];
        if(valid.indexOf(display) == -1) continue; // invalid type
        
        // handle primetime
        primetime = estimates[i]['primetime_percentage'].slice(0,-1);
        primetime = Number(primetime)/100 + 1;
        maxCost = estimates[i]['estimated_cost_cents_max'];
        minCost = estimates[i]['estimated_cost_cents_min'];
        if(primetime > 1){
          maxCost *= primetime;
          minCost *= primetime;
        }
        
        var estimate = {
          'display' : display,
          'duration' : estimates[i]['estimated_duration_seconds'],
          'maxCost' : maxCost,
          'minCost' : minCost,
          'averageCost' : (maxCost+minCost)/2,
          'primesurge' : (primetime > 1)
        }
        rideList.push(estimate);
      }
      lyft_done = true;
    }
  })
  // uber
  var uber_done = false;
  $.ajax({
    'url' : '/estimates/uber' + query,
    'success' : function(results){
      var estimates = results['prices'];
      for(var i = 0; i < estimates.length; ++i){
        var display = estimates[i]['display_name'];
        if(valid.indexOf(display) == -1){
          continue; // invalid type
        }
        maxCost = estimates[i]['high_estimate'] * 100;
        minCost = estimates[i]['low_estimate'] * 100;

        var estimate = {
          'display' : display,
          'duration' : estimates[i]['duration'],
          'maxCost' : maxCost,
          'minCost' : minCost,
          'averageCost' : (maxCost+minCost)/2,
          'primesurge' : (Number(estimates[i]['surge_multiplier']) > 1)
        }
        rideList.push(estimate);
      }
      uber_done = true;
    }
  })

  var check = setInterval(function(){
    if(lyft_done && uber_done){
      clearInterval(check);
      displayRides();
    }
  }, 100);
}

function displayRides(){
  $('#rides-list-body').empty();
  
  $('#ride-answer').text("Computing results...");

  rideList.sort(function(a, b){
    var x = a['averageCost'];
    var y = b['averageCost'];
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });

  for(var i = 0; i < rideList.length; ++i){
    var tableRow = $('<tr></tr>');
    
    var display = $('<td>'+rideList[i]['display']+'</td>');
    var cost = dollarify(rideList[i]['minCost']) + ' - ' + dollarify(rideList[i]['maxCost']);
    cost = $('<td>'+cost+'</td>');
    var duration = minutes(rideList[i]['duration']);
    duration = $('<td>'+duration+'</td>');
    var primesurge= (rideList[i]['primesurge'])?'Yes':'No';
    primesurge = $('<td>'+primesurge+'</td>');

    tableRow.append(display);
    tableRow.append(cost);
    tableRow.append(duration);
    tableRow.append(primesurge);
    $('#rides-list-body').append(tableRow);
  }
  
  var bestRide = rideList[0];

  $('#ride-answer').text(bestRide['display'] + ' is your cheapest option, with a price of ' + dollarify(bestRide['minCost']) + ' - ' + dollarify(bestRide['maxCost']) + '.');
}

function minutes(seconds){
  seconds = Number(seconds);
  return Math.floor(seconds/60) + ':' + leftpad(seconds%60,2);
}

function dollarify(cents){
  cents = Number(cents);
  return '$' + Math.floor(cents/100) + '.' + leftpad(Math.round(cents%100),2);
}

function leftpad(number, width){
  // huzzah for leftpad independence
  var zeroesNeeded = width - String(number).length;
  var ret = '';
  for(var i = 0; i < zeroesNeeded; ++i) ret += '0';
  return (ret+number);
}
