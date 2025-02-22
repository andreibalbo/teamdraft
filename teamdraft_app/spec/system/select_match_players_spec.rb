require 'rails_helper'

RSpec.describe "Select Match Players", type: :system do
  let(:user) { create(:user, password: "password123") }
  let(:group) { create(:group) }
  let!(:membership) { create(:membership, user: user, group: group, role: :admin) }
  let!(:match) { create(:match, group: group) }
  let!(:player1) { create(:player, group: group, name: "Player 1") }
  let!(:player2) { create(:player, group: group, name: "Player 2") }

  before do
    login_as(user)
  end

  it "allows admin to manage match players" do
    visit match_path(match)

    expect(page).to have_content("No players added to this match yet")

    click_link "Select Players"

    expect(page).to have_content("Select Players for Match")

    check "player_#{player1.id}"
    check "player_#{player2.id}"
    click_button "Update Players"

    expect(page).to have_current_path(match_path(match))
    expect(page).to have_content("Players updated successfully")
    expect(page).to have_content("Player 1")
    expect(page).to have_content("Player 2")
    expect(page).to have_content("Participating Players (2)")
  end

  it "allows admin to remove players from match" do
    match.players << [ player1, player2 ]

    visit match_path(match)
    expect(page).to have_content("Participating Players (2)")

    click_link "Select Players"

    uncheck "player_#{player2.id}"
    click_button "Update Players"

    expect(page).to have_current_path(match_path(match))
    expect(page).to have_content("Players updated successfully")
    expect(page).to have_content("Player 1")
    expect(page).not_to have_content("Player 2")
    expect(page).to have_content("Participating Players (1)")

    click_link "Select Players"
    uncheck "player_#{player1.id}"
    click_button "Update Players"

    expect(page).to have_content("No players added to this match yet")
    expect(page).to have_content("Participating Players (0)")
  end
end
