## TeamDraft

TeamDraft is a web application that allows you to create and draft your soccer matches.

It consists of two applications:

- [**TeamDraft APP**](./teamdraft_app): Rails Web application to create and draft your soccer matches.
- [**TeamDraft ENGINE**](./teamdraft_engine): Python application to handle draft logic.

### Setup 

Setup the container in sleep mode:
```bash
docker-compose up -d
```

Enter the container:
```bash
docker-compose exec -it app bash
```

Setup the database:
```bash
rails db:setup
```

Run the application in dev mode:
```bash
bin/dev
```

### Running tests

```bash
rspec
```

### Backlog

https://trello.com/b/TT2WWhqZ/teamdraft
