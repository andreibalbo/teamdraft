## TeamDraft

TeamDraft is a web application that allows you to create and draft your soccer matches.

It consists of two applications:

- [**TeamDraft APP**](./teamdraft_app): Rails Web application to create and draft your soccer matches.
- [**TeamDraft ENGINE**](./teamdraft_engine): Python application to handle draft logic.

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
