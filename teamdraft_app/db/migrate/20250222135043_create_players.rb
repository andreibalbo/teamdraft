class CreatePlayers < ActiveRecord::Migration[8.0]
  def change
    create_table :players do |t|
      t.string :name
      t.integer :positioning  # 0 = attacking, 100 = defensive
      t.integer :defense
      t.integer :attack
      t.integer :stamina
      t.references :group, null: false, foreign_key: true

      t.timestamps
    end
  end
end
