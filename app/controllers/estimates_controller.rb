class EstimatesController < ApplicationController
  def show
    print(params[:id]);
    print(params[:type]);
  end
end
