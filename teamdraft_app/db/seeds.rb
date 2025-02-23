# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end
admin = User.create!(
  email: "admin@admin.com",
  password: "123123",
  password_confirmation: "123123"
)

group = Group.create!(
  name: "Fut Society segunda 18h30",
  category: :society
)

Membership.create!(
  user: admin,
  group: group,
  role: :admin
)

Player.create!(name: "And", group: group, positioning: 50, attack: 50, defense: 50, stamina: 50)
Player.create!(name: "Iur", group: group, positioning: 60, attack: 40, defense: 60, stamina: 60)
Player.create!(name: "Yag", group: group, positioning: 30, attack: 20, defense: 60, stamina: 40)
Player.create!(name: "Bil", group: group, positioning: 100, attack: 70, defense: 10, stamina: 30)
Player.create!(name: "Dem", group: group, positioning: 50, attack: 70, defense: 30, stamina: 30)
Player.create!(name: "Fagn", group: group, positioning: 0, attack: 30, defense: 90, stamina: 50)
Player.create!(name: "Franc", group: group, positioning: 0, attack: 20, defense: 90, stamina: 60)
Player.create!(name: "Danil", group: group, positioning: 20, attack: 30, defense: 50, stamina: 50)
Player.create!(name: "Facun", group: group, positioning: 100, attack: 50, defense: 0, stamina: 70)
Player.create!(name: "Mati", group: group, positioning: 50, attack: 70, defense: 60, stamina: 70)
Player.create!(name: "Raph", group: group, positioning: 30, attack: 40, defense: 40, stamina: 30)
Player.create!(name: "LucP", group: group, positioning: 90, attack: 80, defense: 20, stamina: 40)
Player.create!(name: "Dal", group: group, positioning: 40, attack: 50, defense: 40, stamina: 40)
Player.create!(name: "Ramo", group: group, positioning: 20, attack: 30, defense: 70, stamina: 50)
Player.create!(name: "JonathM", group: group, positioning: 20, attack: 30, defense: 60, stamina: 40)
Player.create!(name: "Kelv", group: group, positioning: 70, attack: 40, defense: 30, stamina: 30)
Player.create!(name: "Guil", group: group, positioning: 90, attack: 80, defense: 10, stamina: 50)
Player.create!(name: "Vanil", group: group, positioning: 60, attack: 60, defense: 60, stamina: 60)
