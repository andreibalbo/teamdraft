class CreateMemberships < ActiveRecord::Migration[8.0]
  def change
    create_table :memberships do |t|
      t.references :user, null: false, foreign_key: true
      t.references :group, null: false, foreign_key: true
      t.string :role, null: false, default: 'member'

      t.timestamps

      t.index [ :user_id, :group_id ], unique: true
    end
  end
end
