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

## 小说连载

《抛深历险记》位于 Article 分区，目录地址为 `/novel/paoshen/`。
章节保存在 `_novel/`，新增 Markdown 章节时沿用已有文件的 front matter，
递增 `order`，设置唯一的 `permalink`、章节标题和中文字数 `words`。
目录、章节总数和前后章导航在构建时自动更新。原稿目录不会自动同步。
