class Review < ApplicationRecord
  belongs_to :user
  belongs_to :game

  validates :user_id, presence: true
  validates :game_id, presence: true
  validates :overall_score, presence: true, 
            numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 10 }
  validates :play_time, presence: true,
            numericality: { only_integer: true, greater_than: 0 }
  validates :rule_complexity, presence: true,
            numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 5 },
            allow_nil: true
  validates :luck_factor, presence: true,
            numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 5 },
            allow_nil: true
  validates :interaction, presence: true,
            numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 5 },
            allow_nil: true
  validates :downtime, presence: true,
            numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 5 },
            allow_nil: true
  validates :short_comment, presence: true
end
