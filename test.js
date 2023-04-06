var assert = require('assert'),
    childProcess = require('child_process'),
    cleaner = require('./index.js'),
    fs = require('fs'),
    os = require('os'),
    path = require('path');

// test that text is unchanged
cleaner.clean('Foo Bar', function (html) {
    assert.equal(html, 'Foo Bar');
});

// test that extra whitespace is replaced by a single space
cleaner.clean('Foo  Bar', function (html) {
    assert.equal(html, 'Foo Bar');
});
cleaner.clean('Foo\nBar', function (html) {
    assert.equal(html, 'Foo Bar');
});
cleaner.clean('<!--\nFoo  Bar\n-->', function (html) {
    assert.equal(html, '<!-- Foo Bar -->');
});

// test that output is trimmed
cleaner.clean(' foo\n', function (html) {
    assert.equal(html, 'foo');
});

// test that directive is unchanged
cleaner.clean('<!DOCTYPE html>', function (html) {
    assert.equal(html, '<!DOCTYPE html>')
});

// test that attribute gets empty value when allow-attributes-without-values is false
cleaner.clean('<input name="foo" disabled>', {'allow-attributes-without-values': false}, function (html) {
  assert.equal(html, '<input name="foo" disabled="">');
});
// test that attribute doesn't get empty value when allow-attributes-without-values is true
cleaner.clean('<input name="foo" disabled>', {'allow-attributes-without-values': true}, function (html) {
  assert.equal(html, '<input name="foo" disabled>');
});

// test that line breaks are not added around comments when break-around-comments is false
cleaner.clean('foo<!-- bar -->qux', {'break-around-comments': false}, function (html) {
    assert.equal(html, 'foo<!-- bar -->qux');
});
// test that line breaks are added around comments when break-around-comments is true
cleaner.clean('foo<!-- bar -->qux', {'break-around-comments': true}, function (html) {
    assert.equal(html, 'foo\n<!-- bar -->\nqux');
});

// test that line breaks are not added around tags when not included in break-around-tags
cleaner.clean('foo<div></div>bar', {'break-around-tags': []}, function (html) {
    assert.equal(html, 'foo<div></div>bar');
});
// test that line breaks are added around tags when included in break-around-tags
cleaner.clean('foo<div></div>bar', {'break-around-tags': ['div']}, function (html) {
    assert.equal(html, 'foo\n<div></div>\nbar');
});

// test that tag is lowercased when lower-case-tags is true
cleaner.clean('<A href="http://foo">bar</A>', {'lower-case-tags': true}, function (html) {
    assert.equal(html, '<a href="http://foo">bar</a>');
});
// test that tag is not lowercased when lower-case-tags is false
cleaner.clean('<A href="http://foo">bar</A>', {'lower-case-tags': false}, function (html) {
    assert.equal(html, '<A href="http://foo">bar</A>');
});

// test that attribute name is lowercased when lower-case-attribute-names is true
cleaner.clean('<a HREF="http://foo">bar</a>', {'lower-case-attribute-names': true}, function (html) {
    assert.equal(html, '<a href="http://foo">bar</a>');
});
// test that attribute name is not lowercased when lower-case-attribute-names is false
cleaner.clean('<a HREF="http://foo">bar</a>', {'lower-case-attribute-names': false}, function (html) {
    assert.equal(html, '<a HREF="http://foo">bar</a>');
});

// test that attribute is not removed when not included in remove-attributes
cleaner.clean('<span color="red">foo</span>', {'remove-attributes': []}, function (html) {
    assert.equal(html, '<span color="red">foo</span>');
});
// test that attribute is removed when included in remove-attributes
cleaner.clean('<span color="red">foo</span>', {'remove-attributes': ['color']}, function (html) {
    assert.equal(html, '<span>foo</span>');
});
// test that attribute is removed when it matches at least one pattern included in remove-attributes
cleaner.clean('<span _test-color="red">foo</span>', {'remove-attributes': [/_test-[a-z0-9-]+/i]}, function (html) {
    assert.equal(html, '<span>foo</span>');
});

// test that comment is not removed when remove-comments is false
cleaner.clean('<!-- foo -->', {'remove-comments': false}, function (html) {
    assert.equal(html, '<!-- foo -->');
});
// test that comment is removed when remove-comments is true
cleaner.clean('<!-- foo -->', {'remove-comments': true}, function (html) {
    assert.equal(html, '');
});

// test that empty tag is not removed when not included in remove-empty-tags
cleaner.clean('<p></p>', {'remove-empty-tags': []}, function (html) {
    assert.equal(html, '<p></p>');
});
// test that empty tag is removed when included in remove-empty-tags
cleaner.clean('<p></p>', {'remove-empty-tags': ['p']}, function (html) {
    assert.equal(html, '');
});
// test that empty tag is removed when it matches at least one pattern included in remove-empty-tags
cleaner.clean('<app-pam-pam-pam></app-pam-pam-pam>', {'remove-empty-tags': [/^app-.*/i]}, function (html) {
    assert.equal(html, '');
});

// test that tag is not removed when not included in remove-tags
cleaner.clean('<font face="arial">foo</font>', {'remove-tags': []}, function (html) {
    assert.equal(html, '<font face="arial">foo</font>');
});
// test that tag is removed and child is preserved when included in remove-tags
cleaner.clean('<font face="arial">foo</font>', {'remove-tags': ['font']}, function (html) {
    assert.equal(html, 'foo');
});
// test that tag is removed and child is preserved when it matches at least one pattern included in remove-tags
cleaner.clean('<app-test>foo</app-test>', {'remove-tags': [/app-.+/]}, function (html) {
    assert.equal(html, 'foo');
});

// test that unsupported tags are removed
cleaner.clean('<script>foo</script>\n<style>bar</style>', function (html) {
    assert.equal(html, '');
});

// test that non-breaking space is not replaced by a single space when replace-nbsp is false
cleaner.clean('Foo&nbsp;Bar', {'replace-nbsp': false}, function (html) {
    assert.equal(html, 'Foo&nbsp;Bar');
});
// test that non-breaking space is replaced by a single space when replace-nbsp is true
cleaner.clean('Foo&nbsp;Bar', {'replace-nbsp': true}, function (html) {
    assert.equal(html, 'Foo Bar');
});

// indent tests

// test that indent is not added when child is text
cleaner.clean('foo<span>bar</span>qux', {'indent': '  '}, function (html) {
    assert.equal(html, 'foo<span>bar</span>qux');
});

// test that indent is not added when child is comment and break-around-comments is false
cleaner.clean('foo<span><!-- bar --></span>qux', {'break-around-comments': false, 'indent': '  '}, function (html) {
    assert.equal(html, 'foo<span><!-- bar --></span>qux');
});

// test that indent is added when child is comment and break-around-comments is true
cleaner.clean('foo<span><!-- bar --></span>qux', {'break-around-comments': true, 'indent': '  '}, function (html) {
    assert.equal(html, 'foo\n<span>\n  <!-- bar -->\n</span>\nqux');
});

// test that indent is not added when child tag is not included in break-around-tags
cleaner.clean('foo<span><div>bar</div></span>qux', {'break-around-tags': [], 'indent': '  '}, function (html) {
    assert.equal(html, 'foo<span><div>bar</div></span>qux');
});

// test that indent is added when child tag is included in break-around-tags
cleaner.clean('foo<span><div>bar</div></span>qux', {'break-around-tags': ['div'], 'indent': '  '}, function (html) {
    assert.equal(html, 'foo\n<span>\n  <div>bar</div>\n</span>\nqux');
});

// test that indent is added when child tag is not included in break-around-tags but descendant is
cleaner.clean('foo<span><span><div>bar</div></span></span>qux', {'break-around-tags': ['div'], 'indent': '  '}, function (html) {
    assert.equal(html, 'foo\n<span>\n  <span>\n    <div>bar</div>\n  </span>\n</span>\nqux');
});

// test that indent is not added inside comment
cleaner.clean('<!-- foo<span><div>bar</div></span>qux -->', {'break-around-tags': ['div'], 'indent': '  '}, function (html) {
    assert.equal(html, '<!-- foo<span><div>bar</div></span>qux -->');
});

// test that indent is not added after comment
cleaner.clean('<!--[if IE 7]><div><![endif]--><div>foo</div>', {'break-around-tags': ['div'], 'indent': '  '}, function (html) {
    assert.equal(html, '<!--[if IE 7]><div><![endif]-->\n<div>foo</div>');
});

// wrap tests

// test that long line is wrapped with hanging indent
cleaner.clean('<div>I prefer the concrete, the graspable, the proveable.</div>', {'wrap': 40}, function (html) {
    assert.equal(html, '<div>I prefer the concrete, the\n    graspable, the proveable.</div>');
});

// test that long line without whitespace is not wrapped
cleaner.clean('<div>Iprefertheconcrete,thegraspable,theproveable.</div>', {'wrap': 40}, function (html) {
    assert.equal(html, '<div>Iprefertheconcrete,thegraspable,theproveable.</div>');
});

// test that long line inside nested tag is wrapped with hanging indent
cleaner.clean('<div><div>I prefer the concrete, the graspable, the proveable.</div></div>', {'wrap': 40}, function (html) {
    assert.equal(html, '<div>\n  <div>I prefer the concrete, the\n      graspable, the proveable.</div>\n</div>');
});

// test that long line without whitespace inside nested tag is not wrapped
cleaner.clean('<div><div>Iprefertheconcrete,thegraspable,theproveable.</div></div>', {'wrap': 40}, function (html) {
    assert.equal(html, '<div>\n  <div>Iprefertheconcrete,thegraspable,theproveable.</div>\n</div>');
});

// test that long comment is wrapped and indented
cleaner.clean('<!-- I prefer the concrete, the graspable, the proveable. -->', {'wrap': 40}, function (html) {
    assert.equal(html, '<!-- I prefer the concrete, the\n    graspable, the proveable. -->');
});

// command line tests

// test command line read from stdin and write to stdout
(function () {
    var input = fs.readFileSync('test.html', 'utf8');

    var expected = `<table>
  <tr>
    <td>
      <b>Currently we have these articles available:</b>
      <blockquote>
        <p>
          <a href="foo.html">The History of Foo</a>
          <br>
          An <span>informative</span> piece of information.
        </p>
        <p>
          <a href="bar.html">A Horse Walked Into a Bar</a>
          <br>
          The bartender said "Why the long face?"
        </p>
      </blockquote>
    </td>
  </tr>
</table>\n`;

    var actual = childProcess.execFileSync('node', ['cmd.js'], {encoding: 'utf8', input: input});
    assert.equal(actual, expected);
}());

// test command line read from file and write to stdout
(function () {
    var expected = `<table>
  <tr>
    <td>
      <b>Currently we have these articles available:</b>
      <blockquote>
        <p>
          <a href="foo.html">The History of Foo</a>
          <br>
          An <span>informative</span> piece of information.
        </p>
        <p>
          <a href="bar.html">A Horse Walked Into a Bar</a>
          <br>
          The bartender said "Why the long face?"
        </p>
      </blockquote>
    </td>
  </tr>
</table>\n`;

    var actual = childProcess.execFileSync('node', ['cmd.js', 'test.html'], {encoding: 'utf8'});
    assert.equal(actual, expected);
}());

// test command line read from file and write to stdout with options
(function () {
    var expected = `<b>Currently we have these articles available:</b>
<p>
  <a href="foo.html">The History of Foo</a>
  <br>
  An <span>informative</span> piece of information.
</p>
<p>
  <a href="bar.html">A Horse Walked Into a Bar</a>
  <br>
  The bartender said "Why the long face?"
</p>\n`;

    var actual = childProcess.execFileSync(
        'node',
        ['cmd.js', 'test.html', '--add-remove-tags', 'table,tr,td,blockquote'],
        {encoding: 'utf8'}
    );

    assert.equal(actual, expected);
}());

// test command line read from file and write to file in place
(function () {
    var expected = `<table>
  <tr>
    <td>
      <b>Currently we have these articles available:</b>
      <blockquote>
        <p>
          <a href="foo.html">The History of Foo</a>
          <br>
          An <span>informative</span> piece of information.
        </p>
        <p>
          <a href="bar.html">A Horse Walked Into a Bar</a>
          <br>
          The bartender said "Why the long face?"
        </p>
      </blockquote>
    </td>
  </tr>
</table>\n`;

    try {
        var tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clean-html-'));
        var tempFile = path.join(tempDir, 'test.html');
        fs.copyFileSync('test.html', tempFile, fs.constants.COPYFILE_EXCL);

        childProcess.execFileSync('node', ['cmd.js', tempFile, '--in-place']);

        var actual = fs.readFileSync(tempFile, 'utf8');
        assert.equal(actual, expected);
    } finally {
        fs.rmSync(tempDir, {recursive: true});
    }
}());

console.log('all tests passed');
