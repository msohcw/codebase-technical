console.log("Loaded");

var _Geocoder;

var startLatLng, endLatLng;

$(document).ready(function(){
  console.log("jQuery loaded");
  
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
  var valid = ['uberX', 'UberBLACK', 'uberXL', 'UberSUV', 'Lyft', 'Lyft Plus'];
  var query = '?';
  query += 'start_lat=' + startLatLng['lat'];
  query += '&start_lng=' + startLatLng['lng'];
  query += '&end_lat=' + endLatLng['lat'];
  query += '&end_lng=' + endLatLng['lng'];

  var rideList = [];

  // lyft
  $.ajax({
    'url' : '/estimates/lyft' + query,
    'success' : function(results){
      var estimates = results['cost_estimates'];
      for(var i = 0; i < estimates.length; ++i){
        var display = estimates[i]['display_name'];
        if(valid.indexOf(display) == -1) continue; // invalid type
        
        // handle primetime
        primetime = estimates[i]['primetime_percentage'].splice(0,-1);
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
    }
  })
  // uber
  $.ajax({
    'url' : '/estimates/uber' + query,
    'success' : function(results){
      var estimates = results['prices'];
      for(var i = 0; i < estimates.length; ++i){
        var display = estimates[i]['display_name'];
        if(valid.indexOf(display) == -1) continue; // invalid type
        maxCost = estimates[i]['high_estimate'] * 100;
        minCost = estimates[i]['low_estimate'] * 100;

        var estimate = {
          'display' : display,
          'duration' : estimates[i]['duration'],
          'maxCost' : maxCost,
          'minCost' : minCost,
          'averageCost' : (maxCost+minCost)/2,
          'primesurge' : (surge_multiplier > 1)
        }
        rideList.push(estimate);
      }
    }
  })
  
  console.log(rideList);
}
