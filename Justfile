ci: check lint test

check:
  flow

test:
  jest

lint:
  eslint src/*.jsx

lint-fix:
  eslint src/*.jsx --fix
