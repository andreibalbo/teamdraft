## TeamDraft

### Setup 

```bash
docker-compose up -d
docker-compose exec -it app bash
rails db:setup
rails s
```

### Running tests

```bash
bundle exec rspec
```

