ci: check lint test

check:
  flow

test:
  jest

lint:
  eslint $(fd jsx src)
  prettier --check $(fd jsx src)

lint-fix:
  eslint $(fd jsx src) --fix
  prettier --write $(fd jsx src)
