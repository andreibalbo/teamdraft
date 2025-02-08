# Use Ruby 3.2 as the base image
FROM ruby:3.2.7

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update -qq && \
    apt-get install -y \
    build-essential \
    libpq-dev \
    nodejs \
    bash \
    bash-completion \
    curl \
    wget \
    vim \
    git

# Copy Gemfile and install dependencies
COPY Gemfile* ./
RUN bundle install

# Copy the rest of the application code
COPY . /app

# Grant permissions to avoid issues on WSL
RUN useradd -ms /bin/bash admin
RUN chown -R admin:admin /app
RUN chown -R admin:admin /usr/local
RUN chmod 755 /app
RUN chmod 755 /usr/local
USER admin

CMD ["bin/rails", "s", "-b", "0.0.0.0"]
