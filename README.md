# gameofbooks
A reading recommendation game.

Answer ten questions about the fantasy adventure you'd like to have, and the game
recommends five novels whose literary tropes best match your answers.

## How it works

- `fantasy_novels.json` holds 574 fantasy books and series (from Wikipedia's
  *List of fantasy novels*). Each book's `tags` lists its tropes; the full trope
  vocabulary is in `meta.tropes`.
- `index.html` runs the game. Each answer adds weight to some tropes
  (see `js/quiz.js`).
- After question ten the player is redirected to `results.html?a=<answers>`,
  which scores every book by the weight of its tags and shows the top five
  (at most one per author). The URL can be shared to show the same list.

## Running it

It's plain HTML, CSS and JavaScript with no build step. Publish it with
GitHub Pages (Settings → Pages → deploy from the branch, root folder).

To try it locally, serve the folder over HTTP (browsers block loading the JSON
from `file://`):

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Updating the site

`index.html` and `results.html` load the CSS and JavaScript with a version suffix such as
`?v=20261101-4`, so browsers and GitHub Pages' cache always pick up new files. The book
list (`fantasy_novels.json`) reuses the version from the `results.js` link automatically.
When you change any CSS, JavaScript or the book list, set a new version in both pages
(this works whatever the current value is):

```bash
sed -i -E 's/\?v=[0-9A-Za-z.-]+"/?v=NEW-VERSION"/g' index.html results.html
```
