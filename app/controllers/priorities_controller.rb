class PrioritiesController < ApplicationController
  def index
    @priorities = IssuePriority.all
    render json: @priorities.map { |priority| { id: priority.id, name: priority.name } }
  end
end
