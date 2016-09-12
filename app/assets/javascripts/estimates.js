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
  console.log(startLatLng);
  console.log(endLatLng);
}
