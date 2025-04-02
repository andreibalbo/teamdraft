class AddWeightsToDraft < ActiveRecord::Migration[8.0]
  def change
    add_column :drafts, :weights, :jsonb, default: {}
  end
end
