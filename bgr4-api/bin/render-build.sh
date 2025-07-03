#!/usr/bin/env bash
# exit on error
set -o errexit

# Install gems
bundle install

# Run database migrations
bundle exec rails db:migrate

# Create system user if not exists
bundle exec rails db:seed

echo "✅ Render build completed successfully!" 