require "test_helper"

class Admin::MappingsControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get admin_mappings_index_url
    assert_response :success
  end

  test "should get update" do
    get admin_mappings_update_url
    assert_response :success
  end
end
