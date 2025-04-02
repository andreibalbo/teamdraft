from flask import Flask, request, jsonify
from genetic_algorithm import GeneticAlgorithm

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

@app.route('/genetic_draft', methods=['POST'])
def genetic_draft():
    try:
        data = request.get_json()
        players = data['players']
        weights = data['weights']
        
        # We can add other algorithms here and select which one to use
        balancer = GeneticAlgorithm(players, weights)

        team_a, team_b, score = balancer.balance_teams()
        
        return jsonify({
            'success': True,
            'team_a': team_a,
            'team_b': team_b,
            'balance_score': score
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
    