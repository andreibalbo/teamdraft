module DraftService
  module Algorithms
    class Base
      def initialize(match, weights = {})
        @match = match
        @weights = weights
      end

      def generate
        raise NotImplementedError, "#{self.class} must implement generate method"
      end

      protected

        attr_reader :match, :weights
    end
  end
end
