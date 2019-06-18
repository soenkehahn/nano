ci: check lint test

check:
  flow

test:
  jest

lint:
  prettier --check $(fd jsx src)
  eslint $(fd jsx src)

lint-fix:
  prettier --write $(fd jsx src)
  eslint $(fd jsx src) --fix
