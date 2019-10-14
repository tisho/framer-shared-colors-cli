# framer-shared-colors

A simple utility that lets you merge or replace color tokens in a Framer project with ones that you define in your own JSON file.

## Usage

#### Replacing Color Tokens

```
$ framer-shared-colors replace <colors.json> <document.json>
```

Will replace all color tokens in `document.json` with the ones from `colors.json`.

#### Merging Color Tokens

```
$ framer-shared-colors merge <colors.json> <document.json>
```

Will merge all color tokens in `document.json` with the ones from `colors.json`.
New tokens will be appended, and tokens with matching names will be updated
to their new values defined in `colors.json` with their original IDs kept intact.
No tokens will be deleted.

## Color Token Format

The input file (`colors.json`) is a simple map of key => value pairs:

```json
{
    "primary": "rgb(0, 0, 0)",
    "accent": "rgb(255, 0, 0)",
    ...
}
```

## Where do I find my `document.json`?

In a folder-backed project (with the `.framerfx` extension), the `document.json` is inside a the `design/` folder.
