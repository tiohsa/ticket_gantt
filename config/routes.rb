# Plugin's routes
# See: http://guides.rubyonrails.org/routing.html
# plugins/ticket_gantt/config/routes.rb
Rails.application.routes.draw do
  resources :projects do
    resources :ticket_gantts, only: [:index] do
      collection do
        post :add_ticket
        post :add_relation
        get :statuses
        get :trackers
        get :priorities
        get :categories
      end
      member do
        put :update_ticket
        delete :delete_ticket
        put :update_relation
        delete :delete_relation
      end
    end
  end
end
