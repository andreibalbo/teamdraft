## TeamDraft Engine

Application to handle all the logic included on balancing and separating teams.

### Implementation Details

The engine uses the following technologies:
- Flask for the REST API
- DEAP for genetic algorithm implementation
- Docker for containerization

### Genetic Algorithm

The genetic algorithm approach uses a Python library called DEAP and it is structured as follows:

- Chromosome example: [1,0,1,0,1,0] where 1 = team A, 0 = team B
- Population would be multiple such combinations
- Crossover would swap segments between two good solutions
- Mutation would randomly flip team assignments
- A heavy penalty is added if one team has 2 or more players than the other
- Fitness goal is to calculate both team stats based on the assignmens, and minimize the difference between them.

### Player Attributes

Each player has the following attributes:
- `id`: Unique identifier
- `attack`: Attack skill (0-100)
- `defense`: Defense skill (0-100)
- `stamina`: Stamina level (0-100)
- `positioning`: Player's average positioning (0-100, 0: defensive, 100: offensive)

### API Endpoints

1. POST /generate_teams

Request body example:
```json
{
  "players": [
    {
      "id": 1,
      "attack": 80,
      "defense": 70,
      "stamina": 90,
      "positioning": 85
    },
    {
      "id": 2,
      "attack": 75,
      "defense": 85,
      "stamina": 80,
      "positioning": 25
    }
  ]
}
```

Response example:
```json
{
  "success": true,
  "team_a": [...], // list of players
  "team_b": [...], // list of players
  "balance_score": 0.92123 
}
```


