#!/usr/bin/env ruby
require "fileutils"
file_path = "lib/tasks/create_bgg_reviews.rake"
content = File.read(file_path)
modified_content = content.gsub("tags: tags,", "custom_tags: tags,")
File.write(file_path, modified_content)
puts "ファイルを修正しました。"
