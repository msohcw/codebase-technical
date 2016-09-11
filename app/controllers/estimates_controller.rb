class EstimatesController < ApplicationController
  def show
    render :json => params
  end
end
