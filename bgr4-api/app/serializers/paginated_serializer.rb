class PaginatedSerializer < ActiveModel::Serializer::CollectionSerializer
  def as_json
    {
      items: super,
      total_pages: object.total_pages,
      current_page: object.current_page,
      total_count: object.total_count
    }
  end
end 