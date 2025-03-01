class CreateDrafts < ActiveRecord::Migration[8.0]
  def change
    create_table :drafts do |t|
      t.references :match, null: false, foreign_key: true
      t.integer :team_a_player_ids, array: true, default: []
      t.integer :team_b_player_ids, array: true, default: []
      t.decimal :balance_score, null: false, precision: 5, scale: 2

      t.timestamps
    end
  end
end
