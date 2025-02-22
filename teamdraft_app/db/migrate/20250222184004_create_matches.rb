class CreateMatches < ActiveRecord::Migration[8.0]
  def change
    create_table :matches do |t|
      t.datetime :datetime, null: false
      t.references :group, null: false, foreign_key: true

      t.timestamps
    end
  end
end
