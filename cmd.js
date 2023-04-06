#!/usr/bin/env node

var cleaner = require('./index.js'),
    fs = require('fs'),
    parseArgs = require('minimist'),
    argv = parseArgs(process.argv.slice(2)),
    filename = argv['_'][0],
    inPlace = getOptAsBool(argv['in-place']),
    options = {
        'allow-attributes-without-values': getOptAsBool(argv['allow-attributes-without-values']),
        'break-around-comments': getOptAsBool(argv['break-around-comments']),
        'break-around-tags': getOptAsArray(argv['break-around-tags']),
        'indent': argv['indent'],
        'lower-case-tags': getOptAsBool(argv['lower-case-tags']),
        'lower-case-attribute-names': getOptAsBool(argv['lower-case-attribute-names']),
        'remove-attributes': getOptAsArray(argv['remove-attributes']),
        'remove-comments': getOptAsBool(argv['remove-comments']),
        'remove-empty-tags': getOptAsArray(argv['remove-empty-tags']),
        'remove-tags': getOptAsArray(argv['remove-tags']),
        'replace-nbsp': getOptAsBool(argv['replace-nbsp']),
        'wrap': getOptAsInt(argv['wrap']),
        'add-break-around-tags': getOptAsArray(argv['add-break-around-tags']),
        'add-remove-attributes': getOptAsArray(argv['add-remove-attributes']),
        'add-remove-tags': getOptAsArray(argv['add-remove-tags'])
    };

function getOptAsArray(opt) {
    if (opt === undefined) {
        return undefined;
    }

    if (Array.isArray(opt)) {
        return opt.map(function (o) {
            return o.split(',');
        }).reduce(function (prev, curr) {
            return prev.concat(curr);
        });
    }

    return opt.split(',');
}

function getOptAsBool(opt) {
    if (opt === undefined) {
        return undefined;
    }

    return opt === true || opt === 'true';
}

function getOptAsInt(opt) {
    if (opt === undefined) {
        return undefined;
    }

    var val = parseInt(opt);

    return isNaN(val) ? undefined : val;
}

function read(filename, callback) {
    return fs.readFile(filename, 'utf8', (err, data) => {
        if (err) {
            throw err;
        }

        callback(data);
    });
}

function write(html, filename) {
    return fs.writeFile(filename, html + '\n', err => {
        if (err) {
            throw err;
        }
    });
}

read(filename || process.stdin.fd, data => {
    cleaner.clean(data, options, html => {
        if (filename && inPlace) {
            return write(html, filename);
        }

        write(html, process.stdout.fd);
    });
});
