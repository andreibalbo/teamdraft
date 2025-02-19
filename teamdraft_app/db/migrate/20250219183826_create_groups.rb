class CreateGroups < ActiveRecord::Migration[8.0]
  def change
    create_table :groups do |t|
      t.string :name, null: false
      t.text :description
      t.string :category

      t.timestamps
    end
  end
end
