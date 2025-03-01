class StyledFormBuilder < ActionView::Helpers::FormBuilder
  def text_field(method, options = {})
    options[:class] = "form-input #{options[:class]}"
    super
  end
  
  def email_field(method, options = {})
    options[:class] = "form-input #{options[:class]}"
    super
  end
  
  def password_field(method, options = {})
    options[:class] = "form-input #{options[:class]}"
    super
  end
  
  def submit(value = nil, options = {})
    options[:class] = "btn btn-primary #{options[:class]}"
    super
  end
  
  # Add methods for other form elements as needed
  def select(method, choices = nil, options = {}, html_options = {}, &block)
    html_options[:class] = "form-select #{html_options[:class]}"
    super
  end
  
  def text_area(method, options = {})
    options[:class] = "form-input #{options[:class]}"
    super
  end
  
  def check_box(method, options = {}, checked_value = "1", unchecked_value = "0")
    options[:class] = "form-checkbox #{options[:class]}"
    super
  end
end 