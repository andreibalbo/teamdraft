# Use Ruby 3.2 as the base image
FROM ruby:3.2

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

# Copy the rest of the application code\

# Change ownership of /app to nobody:nobody
COPY . /app
RUN useradd -ms /bin/bash admin
RUN chown -R admin:admin /app
RUN chmod 755 /app
USER admin

# CMD ["sleep", "infinity"]
