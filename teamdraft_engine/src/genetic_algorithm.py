import random
from deap import base, creator, tools, algorithms
import numpy as np

class PlayerNormalizer:
    def normalize(self, players):
        return [{
            'id': int(player['id']),
            'attack': int(player['attack']),
            'defense': int(player['defense']),
            'stamina': int(player['stamina']),
            'positioning': int(player['positioning'])
        } for player in players]

class TeamStatsCalculator:
    def calculate(self, team):
        if not team:
            return {'positioning': 0, 'attack': 0, 'defense': 0, 'stamina': 0}
        
        return {
            'positioning': sum(player['positioning'] for player in team),
            'attack': sum(player['attack'] for player in team),
            'defense': sum(player['defense'] for player in team),
            'stamina': sum(player['stamina'] for player in team)
        }

class TeamBalanceScoreCalculator:
    def __init__(self, weights):
        self.weights = weights

    def calculate_score(self, stats_a, stats_b):
        weighted_sum = 0
        total_weight = sum(self.weights.values())
        
        for stat, weight in self.weights.items():
            max_stat = max(stats_a[stat], stats_b[stat]) or 1
            diff = abs(stats_a[stat] - stats_b[stat]) / max_stat
            weighted_sum += diff * weight
        
        return 1 - (weighted_sum / total_weight)

class GeneticAlgorithm:
    def __init__(self, 
                 normalizer: PlayerNormalizer,
                 stats_calculator: TeamStatsCalculator,
                 balance_score_calculator: TeamBalanceScoreCalculator,
                 population_size=200, 
                 generations=100):
        self.normalizer = normalizer
        self.stats_calculator = stats_calculator
        self.balance_score_calculator = balance_score_calculator
        self.population_size = population_size
        self.generations = generations
        self.setup_genetic_algorithm()
    
    def setup_genetic_algorithm(self):
        # Create fitness and individual classes
        creator.create("FitnessMax", base.Fitness, weights=(1.0,))
        creator.create("Individual", list, fitness=creator.FitnessMax)

        self.toolbox = base.Toolbox()
        
        # Attribute generator
        self.toolbox.register("attr_bool", random.randint, 0, 1)
        
        # Structure initializers
        self.toolbox.register("individual", tools.initRepeat, creator.Individual, 
                            self.toolbox.attr_bool, n=len(self.players))
        self.toolbox.register("population", tools.initRepeat, list, 
                            self.toolbox.individual)

        # Genetic operators
        self.toolbox.register("evaluate", self.evaluate_teams)
        self.toolbox.register("mate", tools.cxTwoPoint)
        self.toolbox.register("mutate", tools.mutFlipBit, indpb=0.05)
        self.toolbox.register("select", tools.selTournament, tournsize=3)

    def evaluate_teams(self, individual):
        team_a = [p for i, p in enumerate(self.players) if individual[i] == 1]
        team_b = [p for i, p in enumerate(self.players) if individual[i] == 0]
        
        # If teams are too unbalanced in size, penalize heavily
        if abs(len(team_a) - len(team_b)) > 1:
            return 0,
        
        a_stats = self.stats_calculator.calculate(team_a)
        b_stats = self.stats_calculator.calculate(team_b)
        
        # Calculate balance score
        score = self.balance_score_calculator.calculate_score(a_stats, b_stats)
        return score,

    def balance_teams(self, players):
        normalized_players = self.normalizer.normalize(players)
        pop = self.toolbox.population(n=self.population_size)
        result, _ = algorithms.eaSimple(pop, self.toolbox, 
                                      cxpb=0.7, mutpb=0.2, 
                                      ngen=self.generations,
                                      verbose=False)
        
        best_solution = tools.selBest(result, 1)[0]
        
        team_a = [p for i, p in enumerate(normalized_players) if best_solution[i] == 1]
        team_b = [p for i, p in enumerate(normalized_players) if best_solution[i] == 0]

        a_stats = self.stats_calculator.calculate(team_a)
        b_stats = self.stats_calculator.calculate(team_b)
        score = self.balance_score_calculator.calculate_score(a_stats, b_stats)
        
        return team_a, team_b, score
