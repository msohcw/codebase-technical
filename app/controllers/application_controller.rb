class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  def index
    render html: "#TODO fill with example case"
  end
end
