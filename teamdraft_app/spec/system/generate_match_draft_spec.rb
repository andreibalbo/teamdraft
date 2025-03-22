require 'rails_helper'

RSpec.describe "Generate Match Draft", type: :system do
  let(:user) { create(:user) }
  let(:group) { create(:group) }
  let!(:membership) { create(:membership, user: user, group: group, role: :admin) }
  let(:match) { create(:match, group: group) }
  let!(:players) { create_list(:player, 6, group: group) }

  before do
    # Add players to match
    players.each { |player| create(:participation, match: match, player: player) }
    login_as(user)
    allow_any_instance_of(Clients::EngineApi).to receive(:generate_teams).and_return(
      {
        "team_a" =>
          players[0..2].map { |p| JSON.parse(p.to_json) },
        "team_b" =>
          players[3..5].map { |p| JSON.parse(p.to_json) },
        "balance_score" => 10
      }
    )
  end

  it "generates and shows draft details" do
    visit match_path(match)

    expect(page).to have_content("Team Drafts (0)")

    click_button "Generate New Draft"

    expect(page).to have_current_path(draft_path(Draft.last))
    expect(page).to have_content("Draft #")
    expect(page).to have_content("Balance Score:")

    # Check both teams are shown
    expect(page).to have_content("Team A")
    expect(page).to have_content("Team B")

    # Verify all players are assigned to teams
    players.each do |player|
      expect(page).to have_content(player.name)
    end

    # Check team stats are displayed
    expect(page).to have_content("ATK:")
    expect(page).to have_content("DEF:")
    expect(page).to have_content("STA:")
    expect(page).to have_content("POS:")

    # Return to match and check draft is listed
    click_link "Back to Match"
    expect(page).to have_current_path(match_path(match))
    expect(page).to have_content("Team Drafts (1)")
  end

  it "allows deleting drafts" do
    visit match_path(match)
    click_button "Generate New Draft"

    expect {
      click_button "Delete Draft"
    }.to change(Draft, :count).by(-1)

    expect(page).to have_content("Draft was successfully deleted.")
    expect(page).to have_content("Team Drafts (0)")
  end
end
