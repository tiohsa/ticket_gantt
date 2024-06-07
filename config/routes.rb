# Plugin's routes
# See: http://guides.rubyonrails.org/routing.html
Rails.application.routes.draw do
  scope '/ticket_gantts' do
    post 'add_relation', to: 'ticket_gantts#add_relation'
    put ':id/update_relation', to: 'ticket_gantts#update_relation'
    delete ':id/delete_relation', to: 'ticket_gantts#delete_relation'
  end

  resources :projects do
    resources :ticket_gantts, only: [:index] do
      collection do
        post :add_ticket
        get :statuses
        get :trackers
        get :priorities
        get :categories
      end
      member do
        put :update_ticket
        delete :delete_ticket
      end
    end
  end
end
