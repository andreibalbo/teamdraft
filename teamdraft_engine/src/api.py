from flask import Flask, request, jsonify
from genetic_algorithm import TeamBalancer

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

@app.route('/generate_teams', methods=['POST'])
def generate_teams():
    try:
        data = request.get_json()
        players = data['players']
        
        balancer = TeamBalancer(players)
        team_a, team_b = balancer.balance_teams()
        
        return jsonify({
            'success': True,
            'team_a': team_a,
            'team_b': team_b
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
    