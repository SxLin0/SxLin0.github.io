# 宵宵

Personal homepage and writing library built with Jekyll and the Minimal Mistakes theme.

## Local Build

Install Ruby with Homebrew if needed:

```sh
brew install ruby
```

Install dependencies:

```sh
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
bundle config set path vendor/bundle
bundle install
```

Build the site:

```sh
bin/build
```

Regenerate article HTML from the docx sources:

```sh
/Users/lin/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/convert_articles.py
```
