Redmine::Plugin.register :ticket_gantt do
  name 'Ticket Gantt plugin'
  author 'Author name'
  description 'This is a plugin for Redmine'
  version '0.0.1'
  url 'http://example.com/path/to/plugin'
  author_url 'http://example.com/about'

  project_module :ticket_gantt do
    permission :view_priorites, ticket_gantts: [:index], public: true
    permission :view_ticket_gantt, ticket_gantts: [:index, :add_ticket, :update_ticket, :delete_ticket, :add_relation, :update_relation, :delete_relation], public: true
    permission :view_ticket_scheduler, ticket_schedulers: [:index, :update_dates], public: true
  end


  # メニューに項目を追加
  menu :project_menu, :ticket_gantts, { controller: 'ticket_gantts', action: 'index' }, caption: 'Gantt Chart', after: :activity, param: :project_id
  menu :project_menu, :ticket_schedulers, { controller: 'ticket_schedulers', action: 'index' }, caption: 'Schedulers', after: :activity, param: :project_id
end
