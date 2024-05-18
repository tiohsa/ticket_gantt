require 'date'

class TicketGanttsController < ApplicationController
  unloadable # リクエストごとにクラスをアンロードするためのマーク

  before_action :find_project, :authorize
  before_action :find_ticket, only: [:update_dates]

  def index
      selected_month_range = params[:month_range].to_i || 3
      start_date = params[:month] ? Date.strptime(params[:month], '%Y-%m') : Date.today.beginning_of_month
      end_date = start_date >> selected_month_range
      @issues = @project.issues.where("start_date >= ? AND start_date <= ?", start_date, end_date).order(:start_date)
      @relations = IssueRelation.all

      respond_to do |format|
          format.html
          format.json { render json:{
             data: format_issues(@issues),
             links: format_relations(@relations)
          }
        }
      end
  end

  def add_ticket
    ticket = Issue.new()
    ticket.project = @project
    ticket.subject = issue_params[:subject] unless issue_params[:subject].nil?
    ticket.description = issue_params[:description]
    ticket.tracker_id = issue_params[:tracker_id] unless issue_params[:tracker_id].nil?
    ticket.priority_id = issue_params[:priority_id] unless issue_params[:priority_id].nil?
    ticket.status_id = issue_params[:status_id] unless issue_params[:status_id].nil?
    ticket.done_ratio = issue_params[:done_ratio] unless issue_params[:done_ratio].nil?
    ticket.start_date = Date.parse(issue_params[:start_date]) rescue nil unless issue_params[:start_date].nil?
    ticket.parent_id = issue_params[:parent_id] unless issue_params[:parent_id].nil?
    ticket.author = User.current

    due_date = Date.parse(issue_params[:due_date]) rescue nil unless issue_params[:due_date].nil?
    # fullcalendarから受ける日付は一日増やしたので戻す
    if due_date && ticket.start_date
      ticket.due_date = due_date <= ticket.start_date ? ticket.start_date : due_date - 1
    end

    # done_ratioが100%になったらステータスをクローズに変更
    if ticket.done_ratio == 100
      ticket.status_id = IssueStatus.find_by(name: 'Closed').id
    end

    if ticket.save
      render json: { message: 'Task added successfully', ticket: ticket }, status: :ok
    else
      render json: { message: 'Failed to add task', errors: ticket.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update_ticket
    ticket = Issue.find(issue_params[:id])
    ticket.subject = issue_params[:subject] unless issue_params[:subject].nil?
    ticket.description = issue_params[:description]
    ticket.tracker_id = issue_params[:tracker_id] unless issue_params[:tracker_id].nil?
    ticket.priority_id = issue_params[:priority_id] unless issue_params[:priority_id].nil?
    ticket.status_id = issue_params[:status_id] unless issue_params[:status_id].nil?
    ticket.done_ratio = issue_params[:done_ratio] unless issue_params[:done_ratio].nil?
    ticket.parent_id = issue_params[:parent_id] unless issue_params[:parent_id].nil?
    ticket.start_date = Date.parse(issue_params[:start_date]) rescue nil unless issue_params[:start_date].nil?

    due_date = Date.parse(issue_params[:due_date]) rescue nil unless issue_params[:due_date].nil?
    # fullcalendarから受ける日付は一日増やしたので戻す
    if due_date && ticket.start_date
      ticket.due_date = due_date <= ticket.start_date ? ticket.start_date : due_date - 1
    end

    # done_ratioが100%になったらステータスをクローズに変更
    if ticket.done_ratio == 100
      ticket.status_id = IssueStatus.find_by(name: 'Closed').id
    end

    if ticket.save
      render json: { message: 'Ticket updated successfully', ticket: ticket }, status: :ok
    else
      render json: { message: 'Failed to update ticket', errors: ticket.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def delete_ticket
    ticket = Issue.find(params[:id])
    if ticket.destroy
      render json: { message: 'ticket deleted successfully' }, status: :ok
    else
      render json: { message: 'Failed to delete ticket', errors: ticket.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { message: 'ticket not found' }, status: :not_found
  end

  def add_relation
    relation = IssueRelation.new(
        issue_from_id: relation_params[:source],
        issue_to_id: relation_params[:target],
        relation_type: "relates"#map_gantt_type_to_redmine(relation_params[:type])
    )
    if relation.save
        render json: { success: true, relation: format_relations([relation]).first }
    else
        render json: { success: false, errors: relation.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update_relation
    relation = IssueRelation.find(relation_params[:id])
    relation.issue_from_id =  relation_params[:source]
    relation.issue_to_id =  relation_params[:target]
    relation.relation_type = map_gantt_type_to_redmine(relation_params[:type])
    if relation.save
        render json: { success: true, relation: format_relations([relation]).first }
    else
        render json: { success: false, errors: relation.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def delete_relation
    relation = IssueRelation.find(relation_params[:id])
    if relation.destroy
      render json: { message: 'Relation deleted successfully' }, status: :ok
    else
      render json: { message: 'Failed to delete relation', errors: relation.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { message: 'Relation not found' }, status: :not_found
  end

  ##############################################
  # private
  ##############################################
  private

  def map_gantt_type_to_redmine(type)
    case type
    when "0" then "relates"
    when "1" then "follows"
    # 他のタイプに応じて追加
    end
  end

  def format_issues(issues)
    issues.map do |ticket|
      {
         id: ticket.id,
         text: ticket.subject,
         description: ticket.description,
         start_date: ticket.start_date.strftime("%d-%m-%Y"),
         duration: ticket.start_date && ticket.due_date ? (ticket.due_date - ticket.start_date).to_i + 1 : 1,
         progress: ticket.done_ratio / 100.0,
         parent: ticket.parent_id || 0
      }
    end
  end

  def format_relations(relations)
    relations.map do |relation|
      {
        id: relation.id,
        source: relation.issue_from_id,
        target: relation.issue_to_id,
        type: map_relation_type(relation.relation_type)
      }
    end
  end

  def map_relation_type(relation_type)
    # ここは適切なDHTMLX Ganttリンクタイプにマッピングする
    case relation_type
    when "relates" then "0"
    when "follows" then "1"
    when "duplicates" then "0"
    when "blocks" then "0"
    when "precedes" then "0"
    else "0"
    end
  end

  def find_project
    @project = Project.find(params[:project_id])
  end

  def find_ticket
    @ticket = @project.issues.find(params[:id])
  end

  def issue_params
    params.require(:issue).permit(:id, :subject, :description, :done_ratio, :start_date, :due_date, :parent_id, :tracker_id, :priority_id, :status_id)
  end

  def relation_params
    params.require(:relation).permit(:id, :source, :target, :type)
  end

end
