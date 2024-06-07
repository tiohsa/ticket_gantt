Redmine::Plugin.register :ticket_gantt do
  name 'Ticket Gantt plugin'
  author 'tiohsa'
  description 'This is a plugin for Redmine'
  version '0.0.1'
  url 'https://github.com/tiohsa/ticket_gantt'
  author_url 'https://github.com/tiohsa'

  project_module :ticket_gantt do
    permission :view_ticket_gantt, {
      ticket_gantts: [
        :index,
        :add_ticket,
        :update_ticket,
        :delete_ticket,
        :statuses,
        :trackers,
        :priorities,
        :categories,
        :add_relation,
        :update_relation,
        :delete_relation
      ]
    }, public: true
  end

  # メニューに項目を追加
  menu :project_menu, :ticket_gantts, { controller: 'ticket_gantts', action: 'index' }, caption: 'Gantt Chart', after: :activity, param: :project_id
end
