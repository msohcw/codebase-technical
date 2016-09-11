class EstimatesController < ApplicationController 
  def show
    render :json => uber(params[:start_lat], params[:start_lng], params[:end_lat], params[:end_lng])
  end

  def uber(start_lat, start_lng, end_lat, end_lng)
    uber_base_url = 'https://api.uber.com/v1/'
    query = {
      'start_latitude' => start_lat,
      'start_longitude' => start_lng,
      'end_latitude' => end_lat,
      'end_longitude' => end_lng
    }

    headers = { 'Authorization' => 'Token ' + ENV['UBER_SERVER_TOKEN'] }
    response = HTTParty.get(uber_base_url + 'estimates/price/', :query => query, :headers => headers)
    return response 
  end
  
  def lyft(start_lat, start_lng, end_lat, end_lng)
  end
end
