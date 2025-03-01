module ApplicationHelper
  def primary_button_tag(content, options = {})
    options[:class] = "btn btn-primary #{options[:class]}"
    button_tag(content, options)
  end

  def styled_form_for(record, options = {}, &block)
    options[:builder] = StyledFormBuilder
    form_for(record, options, &block)
  end
end
