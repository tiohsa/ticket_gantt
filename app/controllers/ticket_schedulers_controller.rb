require 'date'

class TicketSchedulersController < ApplicationController
  unloadable # リクエストごとにクラスをアンロードするためのマーク

  before_action :find_project, :authorize
  before_action :find_ticket, only: [:update_dates]

  def index
      default_statuses = statuses.where.not(name: ['Closed', 'Resolved']).pluck(:id)
      month = params[:month]
      month = month ? Date.parse(params[:month]) : Date.today
      start_date = month.beginning_of_month - 7
      end_date = month.end_of_month + 7
      @issues  = @project.issues.where("start_date >= ? AND start_date <= ? AND status_id in (?)" , start_date, end_date, default_statuses)
      respond_to do |format|
        format.html
        format.json { render json: @issues.map { |ticket| to_json(ticket) } }
      end
  end

  def update_dates
    start_date = Date.parse(issue_params[:start_date]) rescue nil
    end_date = Date.parse(issue_params[:due_date]) rescue nil

    if start_date.nil?
      render json: { status: 'error', message: 'Start date is not a valid date' }, status: :unprocessable_entity
      return
    end

    if end_date.nil?
      render json: { status: 'error', message: 'End date is not a valid date' }, status: :unprocessable_entity
      return
    end

    # fullcalendarから受ける日付は一日増やしたので戻す
    @ticket.start_date = start_date
    @ticket.due_date = end_date <= start_date ?  start_date  : end_date - 1

    if @ticket.save
      render json: { status: 'ok' }
    else
      render json: { status: 'error', message: @ticket.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  private

  def to_json(ticket)
    {
       id: ticket.id,
       text: ticket.subject,
       start_date: ticket.start_date.strftime("%d-%m-%Y"),
       end_date: ticket.due_date ? (ticket.due_date + 1).strftime("%d-%m-%Y") : ticket.start_date.strftime("%d-%m-%Y"),
    }
  end

  # プロジェクトを見つけるメソッド
  def find_project
    @project = Project.find(params[:project_id])
  end

  def find_ticket
    @ticket = @project.issues.find(params[:id])
  end

  def issue_params
    params.require(:issue).permit(:start_date, :due_date)
  end
end
