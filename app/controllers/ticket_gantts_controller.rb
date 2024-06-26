require 'date'
require 'redmine'
require_dependency 'projects_helper'

class TicketGanttsController < ApplicationController
  include ProjectsHelper
  unloadable # リクエストごとにクラスをアンロードするためのマーク

  before_action :find_project, :authorize
  before_action :find_ticket, only: [:update_dates]
  skip_before_action :find_project, :authorize, only: [:add_relation, :update_relation, :delete_relation]

  def index
    selected_month_range = params[:month_range].to_i || 3
    start_date = params[:month] ? Date.strptime(params[:month], '%Y-%m') : Date.today.beginning_of_month
    end_date = start_date >> selected_month_range

    # 指定されたプロジェクトとそのサブプロジェクトのIDを取得
    project_ids = @project.self_and_descendants.pluck(:id)

    issues = Issue.where(project_id: project_ids)
                  .where("start_date >= ? AND start_date <= ? AND status_id IN (?)", start_date, end_date, params[:status_ids])
                  .order(start_date: :asc, id: :asc)

    # プロジェクト内のチケットのIDを取得
    issue_ids = issues.pluck(:id)

    # プロジェクト内のチケットに関連する関係を取得
    relations = IssueRelation.where(issue_from_id: issue_ids).or(IssueRelation.where(issue_to_id: issue_ids))

    respond_to do |format|
      format.html
      format.json do
        render json: {
          data: format_issues(issues),
          links: format_relations(relations)
        }
      end
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
    ticket.parent_id = issue_params[:parent_id] unless (issue_params[:parent_id].nil? || issue_params[:parent_id] == 0)
    ticket.author = User.current

    due_date = issue_params[:due_date] ? Date.parse(issue_params[:due_date]) : nil
    # fullcalendarから受ける日付は一日増やしたので戻す
    if due_date && ticket.start_date
      ticket.due_date = due_date <= ticket.start_date ? ticket.start_date : due_date - 1
    else
      ticket.due_date = due_date
    end

    # done_ratioが100%になったらステータスをクローズに変更
    if ticket.done_ratio == 100
      ticket.status_id = IssueStatus.where(is_closed: true).first.id
    end
    if IssueStatus.find_by(id: ticket.status_id).is_closed
      ticket.done_ratio = 100
    end

    if ticket.save
      render json: { message: 'Task added successfully', ticket: ticket }, status: :ok
    else
      render json: { message: 'Failed to add task', errors: ticket.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def get_update_ticket()
    ticket = Issue.find(issue_params[:id])
    ticket.subject = issue_params[:subject] unless issue_params[:subject].nil?
    ticket.description = issue_params[:description]
    ticket.tracker_id = issue_params[:tracker_id] unless issue_params[:tracker_id].nil?
    ticket.priority_id = issue_params[:priority_id] unless issue_params[:priority_id].nil?
    ticket.status_id = issue_params[:status_id] unless issue_params[:status_id].nil?
    ticket.done_ratio = issue_params[:done_ratio] unless issue_params[:done_ratio].nil?
    ticket.parent_id = issue_params[:parent_id] unless (issue_params[:parent_id].nil? || issue_params[:parent_id] == 0)
    ticket.start_date = Date.parse(issue_params[:start_date]) rescue nil unless issue_params[:start_date].nil?
    ticket.lock_version = issue_params[:lock_version]

    due_date = issue_params[:due_date] ? Date.parse(issue_params[:due_date]) : nil
    # fullcalendarから受ける日付は一日増やしたので戻す
    if due_date && ticket.start_date
      ticket.due_date = due_date <= ticket.start_date ? ticket.start_date : due_date - 1
    else
      ticket.due_date = due_date
    end

    # done_ratioが100%になったらステータスをクローズに変更
    if ticket.done_ratio == 100
      ticket.status_id = IssueStatus.where(is_closed: true).first.id
    end
    if IssueStatus.find_by(id: ticket.status_id).is_closed
      ticket.done_ratio = 100
    end
    return ticket
  end

  def update_ticket
    ticket = get_update_ticket()
    begin
      ticket.save!
      ticket.reload
      render json: { message: 'Ticket updated successfully', ticket: format_issue(ticket), }, status: :ok
    rescue ActiveRecord::StaleObjectError
      ticket = get_update_ticket()
      if ticket.save
        ticket.reload
        render json: { message: 'Ticket updated successfully after resolving conflict', ticket: format_issue(ticket) }, status: :ok
      else
        render json: { message: 'Failed to update ticket', errors: ticket.errors.full_messages }, status: :unprocessable_entity
      end
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
    target = Issue.find(relation_params[:target])
    source = Issue.find(relation_params[:source])
    source.due_date = source.start_date + 1 unless source.due_date?
    relation = IssueRelation.new(
        issue_from_id: relation_params[:source],
        issue_to_id: relation_params[:target],
        relation_type: map_gantt_type_to_redmine(relation_params[:type])
    )
    if source.save && relation.save
        render json: { success: true, relation: format_relation(relation) }
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
        render json: { success: true, relation: format_relation(relation) }
    else
        render json: { success: false, errors: relation.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def delete_relation
    relation = IssueRelation.find(params[:id])
    if relation.destroy
      render json: { message: 'Relation deleted successfully' }, status: :ok
    else
      render json: { message: 'Failed to delete relation', errors: relation.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { message: 'Relation not found' }, status: :not_found
  end

  def statuses
    # プロジェクトのステータス一覧を取得
    @statuses = IssueStatus.all
    render json: { statuses: @statuses }
  end

  def trackers
    @trackers = Tracker.all
    render json: { trackers: @trackers }
  end

  def priorities
    @priorities = IssuePriority.where("active = true")
    render json: { priorities: @priorities }
  end

  def categories
    @categories = Project.find(params[:project_id]).issue_categories
    render json: { categories: @categories }
  end

  ##############################################
  # private
  ##############################################
  private

  def format_issue(ticket)
    {
      id: ticket.id,
      text: ticket.subject,
      description: ticket.description,
      start_date: ticket.start_date.strftime("%d-%m-%Y"),
      duration: ticket.start_date && ticket.due_date ? (ticket.due_date - ticket.start_date).to_i + 1 : 1,
      progress: ticket.done_ratio / 100.0,
      parent: ticket.parent_id,
      priority_id: ticket.priority_id,
      tracker_id: ticket.tracker_id,
      status_id: ticket.status_id,
      is_closed: ticket.status.is_closed,
      milestone: ticket.due_date ? ["0"] : ["1"],
      lock_version: ticket.lock_version,
      project_id: ticket.project_id
  }
  end

  def format_issues(issues)
    issues.map do |ticket|
      format_issue(ticket)
    end
  end

  def format_relation(relation)
    {
      id: relation.id,
      target: relation.issue_from_id,
      source: relation.issue_to_id,
      type: map_redmine_to_gantt(relation.relation_type)
    }
  end

  def format_relations(relations)
    relations.map do |relation|
      format_relation(relation)
    end
  end

  def map_gantt_type_to_redmine(relation_type)
    'relates'
    # case relation_type
    #   when 0
    #     'precedes'
    #   when 1
    #     'relates'
    #   when 2
    #     'relates'
    #   when 3
    #     'blocks'
    #   else
    #     'relates'
    # end
  end

  def map_redmine_to_gantt(relation_type)
    0
    # ここは適切なDHTMLX Ganttリンクタイプにマッピングする
   #case relation_type
   #   when 'precedes'
   #     0 # Finish to Start (FS)
   #   when 'follows'
   #     0 # Finish to Start (FS) - 逆関係なので調整が必要
   #   when 'blocks'
   #     3 # Start to Finish (SF)
   #   when 'blocked_by'
   #     3 # Start to Finish (SF) - 逆関係なので調整が必要
   #   when 'relates'
   #     1 # Start to Start (SS) または 2 # Finish to Finish (FF)
   #   else
   #     1 # デフォルトはStart to Start (SS)とする
   #end
  end

  def find_project
    @project = Project.find(params[:project_id])
  end

  def find_ticket
    @ticket = @project.issues.find(params[:id])
  end

  def issue_params
    params.require(:issue).permit(:id, :subject, :description, :done_ratio, :start_date, :due_date, :parent_id, :tracker_id, :priority_id, :status_id, :lock_version, :project_id)
  end

  def relation_params
    params.require(:relation).permit(:id, :source, :target, :type)
  end

  def resolve_conflict(new_attributes)
    # 競合解決のためのロジックをここに追加
    # 例: 最新のデータを優先する、またはユーザーに選択肢を提供する
    self.assign_attributes(new_attributes)
  end
end
