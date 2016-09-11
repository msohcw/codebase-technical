class EstimatesController < ApplicationController 
  
  UBER_BASE_URL = 'https://api.uber.com/v1/'
  LYFT_BASE_URL = 'https://api.lyft.com/v1/'

  @lyft_access_token = nil

  def show
    if(params[:brand] == 'uber')
      render :json => uber(params[:start_lat], params[:start_lng], params[:end_lat], params[:end_lng])
    elsif(params[:brand] == 'lyft')
      render :json => lyft(params[:start_lat], params[:start_lng], params[:end_lat], params[:end_lng])
    end
  end

  def uber(start_lat, start_lng, end_lat, end_lng)
    query = {
      'start_latitude' => start_lat,
      'start_longitude' => start_lng,
      'end_latitude' => end_lat,
      'end_longitude' => end_lng
    }

    headers = { 'Authorization' => 'Token ' + ENV['UBER_SERVER_TOKEN'] }
    response = HTTParty.get(UBER_BASE_URL + 'estimates/price', :query => query, :headers => headers)
    return response 
  end
  
  def lyft(start_lat, start_lng, end_lat, end_lng)
    get_lyft_access_token() if @lyft_access_token.nil?
    
    headers = { 'Authorization' => 'bearer ' + @lyft_access_token }
    query = {
      'start_lat' => start_lat,
      'start_long' => start_lng,
      'end_lat' => end_lat,
      'end_long' => end_lng
    }
    response = HTTParty.get(LYFT_BASE_URL + 'cost', :query => query, :headers => headers)
    if response.code == 200
      return response 
    elsif repsonse.code == 401
      @lyft_access_token = nil
      lyft(start_lat, start_lng, end_lat, end_lng)
    end
  end

  def get_lyft_access_token
    headers = {'Content-Type' => 'application/json' }
    query = {
      'grant_type' => 'client_credentials', 
      'scope' => 'public'
    }

    Rails.logger.debug(ENV)

    auth = {
      'username' => ENV['LYFT_CLIENT_ID'],
      'password' => ENV['LYFT_CLIENT_SECRET']
    }
    response = HTTParty.post(LYFT_BASE_URL + 'oauth/token', :query => query, :headers => headers, :basic_auth => auth)
    @lyft_access_token = response['access_token']
  end
end
