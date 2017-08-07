# enforce consistent indentation in `<template>` (vue/html-indent)

## :book: Rule Details

This rule enforces a consistent indentation style. The default style is 4 spaces as same as [the core indent rule](http://eslint.org/docs/rules/indent).

:-1: Examples of **incorrect** code for this rule:

```html
<template>
 <div class="foo">
   Hello.
    </div>
</template>
```

:+1: Examples of **correct** code for this rule:

```html
<template>
    <div class="foo">
        Hello.
    </div>
    <div
        id="a"
        class="b"
        other-attr=
            "{longname: longvalue}"
        other-attr2
            ="{longname: longvalue}"
    >
        Text
    </div>
</template>
```

## :wrench: Options

```json
{
    "vue/html-indent": ["error", kind, {
        "attribute": 1,
        "closeBracket": 0
    }]
}
```

- `kind` (`number | "tab"`) ... The kind of indentation. Default is `4`. If this is a number, it's the number of spaces for one indent. If this is `"tab"`, it uses one tab for one indent.
- `attribute` (`integer`) ... The multiplier of indentation for attributes. Default is `1`.
- `closeBracket` (`integer`) ... The multiplier of indentation for right brackets. Default is `0`.

:+1: Examples of **correct** code for `{attribute: 1, closeBracket: 1}`:

```html
<template>
    <div
        id="a"
        class="b"
        other-attr=
            "{longname: longvalue}"
        other-attr2
            ="{longname: longvalue}"
        >
        Text
    </div>
</template>
```

:+1: Examples of **correct** code for `{attribute: 2, closeBracket: 1}`:

```html
<template>
    <div
            id="a"
            class="b"
            other-attr=
                "{longname: longvalue}"
            other-attr2
                ="{longname: longvalue}"
        >
        Text
    </div>
</template>
```
