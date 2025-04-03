# app/services/draft_service/algorithm_factory.rb
module DraftService
  class AlgorithmFactory
    ALGORITHMS = {
      "genetic" => Algorithms::Genetic,
      "random" => Algorithms::Random
    }.freeze

    def self.for(algorithm_type, match, weights = {})
      algorithm_class = ALGORITHMS.with_indifferent_access[algorithm_type] || ALGORITHMS["random"]
      algorithm_class.new(match, weights)
    end
  end
end
