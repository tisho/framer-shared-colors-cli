#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const color = require('color');
const chalk = require('chalk');
const uuid = require('uuid');
const argv = require('minimist')(process.argv.slice(2));

// Utility
// -------

function readInputColorTokens(path) {
    const json = JSON.parse(fs.readFileSync(path));
    return Object.keys(json).map(key =>
        asToken({
            name: key,
            value: json[key],
        }),
    );
}

function readFramerDocument(path) {
    const doc = JSON.parse(fs.readFileSync(path));
    if (!isFramerDocument(doc)) {
        console.error(
            chalk`{red Error:} Target document.json doesn’t appear to be a Framer document.`,
        );
        process.exit(1);
    }

    return doc;
}

function writeFramerDocument(doc, path) {
    return fs.writeFileSync(path, JSON.stringify(doc, null, 2));
}

function isFramerDocument(json) {
    return (
        'root' in json &&
        'version' in json &&
        typeof json.root === 'object' &&
        '__class' in json.root &&
        json.root.__class === 'RootNode'
    );
}

function asToken(token) {
    return {
        id: token.id || uuid.v4(),
        name: token.name,
        value: color(token.value),
    };
}

function asTokenJson({ id, name, value }) {
    return {
        __class: 'ColorTokenNode',
        id,
        name,
        value: value.rgb().string(),
    };
}

function readColorTokens(doc) {
    return Object.values(doc.root.tokens)
        .filter(t => t.__class === 'ColorTokenNode')
        .map(asToken);
}

function mergeColorTokens(doc, tokens) {
    const existingTokens = readColorTokens(doc);

    // go through existing tokens and update ones that need to be updated
    const processedNames = [];
    const replacedTokens = [];
    const updatedExisting = existingTokens.map(token => {
        const newer = tokens.find(t => t.name === token.name);
        if (newer) {
            processedNames.push(newer.name);

            const updatedToken = {
                ...token,
                value: newer.value,
            };
            replacedTokens.push(updatedToken);
            return updatedToken;
        }
        return token;
    });

    // take out already-processed tokens and keep only the ones to add
    const newTokens = tokens.filter(t => !processedNames.includes(t.name));

    const outputTokens = [...updatedExisting, ...newTokens];
    console.log(chalk`\n
{bold Summary of updates:}

- ${replacedTokens.length}/${updatedExisting.length} tokens will be updated
- ${newTokens.length} new tokens will be added
    `);

    return replaceColorTokens(doc, outputTokens);
}

function replaceColorTokens(doc, tokens) {
    const tokensJson = tokens.reduce((res, token) => {
        res[token.id] = asTokenJson(token);
        return res;
    }, {});

    const tokensIndexJson = Object.keys(tokensJson);

    return {
        ...doc,
        root: {
            ...doc.root,
            tokens: tokensJson,
            tokensIndex: tokensIndexJson,
        },
    };
}

// Commands
// --------

function help() {
    console.log(chalk`\n{greenBright Usage:}
        {bold replace} <colors.json> <document.json>

            Will replace all color tokens in document.json with the ones from colors.json.

        {bold merge} <colors.json> <document.json>
        
            Will merge all color tokens in document.json with the ones from colors.json.
            New tokens will be appended, and tokens with matching names will be updated
            to their new values defined in colors.json with their original IDs kept intact.
            No tokens will be deleted.

{greenBright Color Tokens Format:}

    <colors.json> is a simple map of key => value pairs:

    \{
        "primary": "rgb(0, 0, 0)",
        "accent": "rgb(255, 0, 0)",
        ...
    \}
    `);
}

function merge(argv) {
    const colorsPath = argv._[1];
    const documentPath = argv._[2];

    if (!colorsPath) {
        console.error(chalk`{red Error:} Missing input colors.json path.`);
        process.exit(1);
    }

    if (!documentPath) {
        console.error(chalk`{red Error:} Missing target document.json path.`);
        process.exit(1);
    }

    const tokens = readInputColorTokens(colorsPath);
    const doc = readFramerDocument(documentPath);
    const updatedDoc = mergeColorTokens(doc, tokens);
    writeFramerDocument(updatedDoc, documentPath);
}

function replace(argv) {
    const colorsPath = argv._[1];
    const documentPath = argv._[2];

    if (!colorsPath) {
        console.error(chalk`{red Error:} Missing input colors.json path.`);
        process.exit(1);
    }

    if (!documentPath) {
        console.error(chalk`{red Error:} Missing target document.json path.`);
        process.exit(1);
    }

    const tokens = readInputColorTokens(colorsPath);
    const doc = readFramerDocument(documentPath);

    console.log(chalk`\n
{bold Summary of updates:}

- ${doc.root.tokensIndex.length} tokens will be deleted
- ${tokens.length} tokens will be added

    `);
    const updatedDoc = replaceColorTokens(doc, tokens);
    writeFramerDocument(updatedDoc, documentPath);
}

const commands = {
    help,
    merge,
    replace,
};

// Main
// ----

async function main() {
    const command = argv._[0];
    if (!command || !commands[command]) {
        commands.help();
        process.exit(1);
    }

    commands[command](argv);
}

main();
