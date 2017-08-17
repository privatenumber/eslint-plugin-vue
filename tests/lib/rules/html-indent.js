/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
'use strict'

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

const rule = require('../../../lib/rules/html-indent')
const RuleTester = require('eslint').RuleTester

// ------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------

/**
* Prevents leading spaces in a multiline template literal from appearing in the resulting string
* @param {string[]} strings The strings in the template literal
* @returns {string} The template literal, with spaces removed from all lines
*/
function unIndent (strings) {
  const templateValue = strings[0]
  const lines = templateValue.replace(/^\n/, '').replace(/\n\s*$/, '').split('\n')
  const lineIndents = lines.filter(line => line.trim()).map(line => line.match(/ */)[0].length)
  const minLineIndent = Math.min.apply(null, lineIndents)

  return lines.map(line => line.slice(minLineIndent)).join('\n')
}

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

const tester = new RuleTester({
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 2017,
    ecmaFeatures: {
      globalReturn: true
    }
  }
})

tester.run('html-indent', rule, {
  valid: [
    // VAttribute
    unIndent`
      <template>
          <div
              a="a"
              b="b"
              c=
                  "c"
              d
                  ="d"
              e
              f
                  =
          ></div>
      </template>
    `,
    unIndent`
      <template>
          <div a="a"
               b="b"
               c=
                   "c"
               d
                   ="d"
               e
               f
                   =
          ></div>
      </template>
    `,
    unIndent`
      <template>
          <div a="
          a" b="b"></div>
      </template>
    `,

    // VExpressionContainer
    unIndent`
      <template>
          <div
              :foo="
                  value
              "
          ></div>
      </template>
    `,

    // VForExpression
    unIndent`
      <template>
          <div
              v-for="
                  x
                      in
                          xs
              "
          ></div>
          <div
              v-for="
                  (
                      x
                      ,
                      y
                      ,
                      z
                  )
                      of
                          xs
              "
          ></div>
      </template>
    `,

    // VOnExpression
    unIndent`
      <template>
          <div
              v-on:a="
                  foo(); bar();
              "
              v-on:b="
                  foo()
                  bar()
              "
              v-on:c="foo()
                      bar()"
          ></div>
      </template>
    `,

    // VStartTag
    unIndent`
      <template>
          <div
              aaa
              bbb
    `,

    // VText
    unIndent`
      <template>
          aaa
          bbb
          ccc
      </template>
    `,

    // ArrayExpression
    unIndent`
      <template>
          <div v-on:a="
              [
                  1
                  ,
                  2
                  ,
                  [
                      3
                  ],
                  [ 4,
                    5 ]
              ]
          "></div>
      </template>
    `,

    // ArrowFunctionExpression
    unIndent`
      <template>
          <div
              v-bind:a="
                  (
                  ) =>
                      1
              "
              v-bind:b="
                  a =>
                      1
              "
              v-bind:c="
                  (
                      a
                  ) =>
                      1
              "
              v-bind:d="
                  (
                      a
                      ,
                      b
                  ) =>
                      1
              "
              v-bind:e="
                  a =>
                  {
                      a
                  }
              "
          ></div>
      </template>
    `,

    // AssignmentExpression / BinaryExpression
    unIndent`
      <template>
          <div
              v-bind:a="
                  a
                      +
                      b
              "
              v-bind:b="
                  a
                      +
                      b
                      +
                      c
              "
              v-bind:c="
                  a
                      =
                      b
                          +
                          c
                          +
                          d
              "
          ></div>
      </template>
    `,

    // AwaitExpression
    unIndent`
      <template>
          <div
              v-bind:a="
                  async () =>
                      await
                          1
              "
          ></div>
      </template>
    `,

    // BreakStatement, LabeledStatement
    unIndent`
      <template>
          <div
              v-on:a="
                  while(1)
                      break
                      ;
              "
              v-on:b="
                  A
                      :
                      break A
                      ;
              "
          ></div>
      </template>
    `,

    // CallExpression
    unIndent`
      <template>
          <div
              v-bind:a="
                  foo(
                  )
              "
              v-bind:b="
                  foo(
                      1
                  )
              "
              v-bind:c="
                  foo(
                      1
                      ,
                      2
                      ,
                      bar(
                          3
                      )
                  )
              "
              v-bind:d="
                  f(1, 2,
                    3, 4)
              "
          ></div>
      </template>
    `,

    // ObjectExpression
    unIndent`
      <template>
          <div v-bind:a="
              {
                  a: 1
                  ,
                  b: 2
                  ,
                  c: {
                      ca: 3
                  },
                  d: { da: 4,
                       db: 5 }
              }
          "></div>
      </template>
    `,

    // RestElement / SpreadElement
    unIndent`
      <template>
          <div
              v-bind:a="
                  [
                      a,
                      ...
                          b
                  ] = [
                      a,
                      ...
                          b
                  ]
              "
          ></div>
      </template>
    `,

    // ReturnStatement
    unIndent`
      <template>
          <div
              v-on:a="
                  return
                  ;
              "
              v-on:b="
                  return a
                  ;
              "
          ></div>
      </template>
    `,

    // UnaryExpression
    unIndent`
      <template>
          <div
              v-bind:a="
                  +
                      a
              "
          ></div>
      </template>
    `,

    // UpdateExpression
    unIndent`
      <template>
          <div
              v-bind:a="
                  ++
                      a
              "
          ></div>
      </template>
    `,

    // YieldExpression
    unIndent`
      <template>
          <div
              v-bind:a="
                  function*(){
                      yield
                  }
              "
              v-bind:b="
                  function*(){
                      yield
                      a
                  }
              "
              v-bind:c="
                  function*(){
                      yield*
                          a
                  }
              "
          ></div>
      </template>
    `
  ],
  invalid: [
    // VAttribute
    {
      code: unIndent`
        <template>
            <div
              a="a"
              b="b"
              c=
                  "c"
              d
                  ="d"
              e
              f
                  =
            >
                Text
            </div>
        </template>
      `,
      output: unIndent`
        <template>
            <div
                a="a"
                b="b"
                c=
                    "c"
                d
                    ="d"
                e
                f
                    =
            >
                Text
            </div>
        </template>
      `,
      errors: [
        { message: 'Expected indentation of 8 spaces but found 6 spaces.', line: 3 },
        { message: 'Expected indentation of 8 spaces but found 6 spaces.', line: 4 },
        { message: 'Expected indentation of 8 spaces but found 6 spaces.', line: 5 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 6 },
        { message: 'Expected indentation of 8 spaces but found 6 spaces.', line: 7 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 8 },
        { message: 'Expected indentation of 8 spaces but found 6 spaces.', line: 9 },
        { message: 'Expected indentation of 8 spaces but found 6 spaces.', line: 10 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 11 }
      ]
    },

    // VEndTag
    {
      code: unIndent`
        <template>
          </template
      `,
      output: unIndent`
        <template>
        </template
      `,
      errors: [
        { message: 'Expected indentation of 0 spaces but found 2 spaces.', line: 2 }
      ]
    },

    // VExpressionContainer
    {
      code: unIndent`
        <template>
            <div
                :a="
                  value
              "
                :b=
                  value
                :c=
                  'value'
            >
                {{
                  value
              }}
            </div>
        </template>
      `,
      output: unIndent`
        <template>
            <div
                :a="
                    value
                "
                :b=
                    value
                :c=
                    'value'
            >
                {{
                    value
                }}
            </div>
        </template>
      `,
      errors: [
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 4 },
        { message: 'Expected indentation of 8 spaces but found 6 spaces.', line: 5 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 7 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 9 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 12 },
        { message: 'Expected indentation of 8 spaces but found 6 spaces.', line: 13 }
      ]
    },

    // VForExpression
    {
      code: unIndent`
        <template>
            <div
                v-for="
                  x
                  in
                  xs
                "
            ></div>
            <div
                v-for="
                  (
                  x
                  ,
                  y
                  ,
                  z
                  )
                  of
                  xs
                "
            ></div>
        </template>
      `,
      output: unIndent`
        <template>
            <div
                v-for="
                    x
                        in
                            xs
                "
            ></div>
            <div
                v-for="
                    (
                        x
                        ,
                        y
                        ,
                        z
                    )
                        of
                            xs
                "
            ></div>
        </template>
      `,
      errors: [
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 4 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 5 },
        { message: 'Expected indentation of 20 spaces but found 10 spaces.', line: 6 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 11 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 12 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 13 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 14 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 15 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 16 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 17 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 18 },
        { message: 'Expected indentation of 20 spaces but found 10 spaces.', line: 19 }
      ]
    },

    // VOnExpression
    {
      code: unIndent`
        <template>
            <div
                v-on:a="
                  foo(); bar();
                "
                v-on:b="
                  foo()
                  bar()
                "
                v-on:c="foo()
                  bar()"
            ></div>
        </template>
      `,
      output: unIndent`
        <template>
            <div
                v-on:a="
                    foo(); bar();
                "
                v-on:b="
                    foo()
                    bar()
                "
                v-on:c="foo()
                        bar()"
            ></div>
        </template>
      `,
      errors: [
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 4 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 7 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 8 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 11 }
      ]
    },

    // VText
    {
      code: unIndent`
        <template>
          aaa
          bbb
            ccc
        </template>
      `,
      output: unIndent`
        <template>
            aaa
            bbb
            ccc
        </template>
      `,
      errors: [
        { message: 'Expected indentation of 4 spaces but found 2 spaces.', line: 2 },
        { message: 'Expected indentation of 4 spaces but found 2 spaces.', line: 3 }
      ]
    },

    // ArrayExpression
    {
      code: unIndent`
        <template>
            <div v-on:a="
              [
              1
              ,
              2
              ,
              [
              3
              ],
              [ 4,
              5 ]
              ]
            "></div>
        </template>
      `,
      output: unIndent`
        <template>
            <div v-on:a="
                [
                    1
                    ,
                    2
                    ,
                    [
                        3
                    ],
                    [ 4,
                      5 ]
                ]
            "></div>
        </template>
      `,
      errors: [
        { message: 'Expected indentation of 8 spaces but found 6 spaces.', line: 3 },
        { message: 'Expected indentation of 12 spaces but found 6 spaces.', line: 4 },
        { message: 'Expected indentation of 12 spaces but found 6 spaces.', line: 5 },
        { message: 'Expected indentation of 12 spaces but found 6 spaces.', line: 6 },
        { message: 'Expected indentation of 12 spaces but found 6 spaces.', line: 7 },
        { message: 'Expected indentation of 12 spaces but found 6 spaces.', line: 8 },
        { message: 'Expected indentation of 16 spaces but found 6 spaces.', line: 9 },
        { message: 'Expected indentation of 12 spaces but found 6 spaces.', line: 10 },
        { message: 'Expected indentation of 12 spaces but found 6 spaces.', line: 11 },
        { message: 'Expected indentation of 14 spaces but found 6 spaces.', line: 12 },
        { message: 'Expected indentation of 8 spaces but found 6 spaces.', line: 13 }
      ]
    },

    // ArrowFunctionExpression
    {
      code: unIndent`
        <template>
            <div
                v-bind:a="
                  (
                  ) =>
                  1
                "
                v-bind:b="
                  a =>
                  1
                "
                v-bind:c="
                  (
                  a
                  ) =>
                  1
                "
                v-bind:d="
                  (
                  a
                  ,
                  b
                  ) =>
                  1
                "
                v-bind:e="
                  a =>
                  {
                  a
                  }
                "
            ></div>
        </template>
      `,
      output: unIndent`
        <template>
            <div
                v-bind:a="
                    (
                    ) =>
                        1
                "
                v-bind:b="
                    a =>
                        1
                "
                v-bind:c="
                    (
                        a
                    ) =>
                        1
                "
                v-bind:d="
                    (
                        a
                        ,
                        b
                    ) =>
                        1
                "
                v-bind:e="
                    a =>
                    {
                        a
                    }
                "
            ></div>
        </template>
      `,
      errors: [
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 4 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 5 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 6 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 9 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 10 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 13 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 14 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 15 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 16 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 19 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 20 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 21 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 22 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 23 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 24 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 27 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 28 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 29 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 30 }
      ]
    },

    // AssignmentExpression / BinaryExpression
    {
      code: unIndent`
        <template>
            <div
                v-bind:a="
                  a
                  +
                  b
                "
                v-bind:b="
                  a
                  +
                  b
                  +
                  c
                "
                v-bind:c="
                  a
                  =
                  b
                  +
                  c
                  +
                  d
                "
            ></div>
        </template>
      `,
      output: unIndent`
        <template>
            <div
                v-bind:a="
                    a
                        +
                        b
                "
                v-bind:b="
                    a
                        +
                        b
                        +
                        c
                "
                v-bind:c="
                    a
                        =
                        b
                            +
                            c
                            +
                            d
                "
            ></div>
        </template>
      `,
      errors: [
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 4 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 5 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 6 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 9 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 10 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 11 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 12 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 13 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 16 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 17 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 18 },
        { message: 'Expected indentation of 20 spaces but found 10 spaces.', line: 19 },
        { message: 'Expected indentation of 20 spaces but found 10 spaces.', line: 20 },
        { message: 'Expected indentation of 20 spaces but found 10 spaces.', line: 21 },
        { message: 'Expected indentation of 20 spaces but found 10 spaces.', line: 22 }
      ]
    },

    // AwaitExpression
    {
      code: unIndent`
        <template>
            <div
                v-bind:a="
                    async () =>
                      await
                      1
                "
            ></div>
        </template>
      `,
      output: unIndent`
        <template>
            <div
                v-bind:a="
                    async () =>
                        await
                            1
                "
            ></div>
        </template>
      `,
      errors: [
        { message: 'Expected indentation of 16 spaces but found 14 spaces.', line: 5 },
        { message: 'Expected indentation of 20 spaces but found 14 spaces.', line: 6 }
      ]
    },

    // BreakExpression / LabeledStatement
    {
      code: unIndent`
        <template>
            <div
                v-on:a="
                    while(1)
                  break
                  ;
                "
                v-on:b="
                  A
                  :
                  break A
                  ;
                "
            ></div>
        </template>
      `,
      output: unIndent`
        <template>
            <div
                v-on:a="
                    while(1)
                        break
                        ;
                "
                v-on:b="
                    A
                        :
                        break A
                        ;
                "
            ></div>
        </template>
      `,
      errors: [
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 5 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 6 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 9 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 10 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 11 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 12 }
      ]
    },

    // CallExpression
    {
      code: unIndent`
        <template>
            <div
                v-bind:a="
                  foo(
                  )
                "
                v-bind:b="
                  foo(
                  1
                  )
                "
                v-bind:c="
                  foo(
                  1
                  ,
                  2
                  ,
                  bar(
                  3
                  )
                  )
                "
                v-bind:d="
                  f(1, 2,
                  3, 4)
                "
            ></div>
        </template>
      `,
      output: unIndent`
        <template>
            <div
                v-bind:a="
                    foo(
                    )
                "
                v-bind:b="
                    foo(
                        1
                    )
                "
                v-bind:c="
                    foo(
                        1
                        ,
                        2
                        ,
                        bar(
                            3
                        )
                    )
                "
                v-bind:d="
                    f(1, 2,
                      3, 4)
                "
            ></div>
        </template>
      `,
      errors: [
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 4 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 5 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 8 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 9 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 10 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 13 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 14 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 15 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 16 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 17 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 18 },
        { message: 'Expected indentation of 20 spaces but found 10 spaces.', line: 19 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 20 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 21 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 24 },
        { message: 'Expected indentation of 14 spaces but found 10 spaces.', line: 25 }
      ]
    },

    // ObjectExpression
    {
      code: unIndent`
        <template>
            <div v-bind:a="
              {
              a: 1
              ,
              b: 2
              ,
              c: {
              ca: 3
              },
              d: { da: 4,
              db: 5 }
              }
            "></div>
        </template>
      `,
      output: unIndent`
        <template>
            <div v-bind:a="
                {
                    a: 1
                    ,
                    b: 2
                    ,
                    c: {
                        ca: 3
                    },
                    d: { da: 4,
                         db: 5 }
                }
            "></div>
        </template>
      `,
      errors: [
        { message: 'Expected indentation of 8 spaces but found 6 spaces.', line: 3 },
        { message: 'Expected indentation of 12 spaces but found 6 spaces.', line: 4 },
        { message: 'Expected indentation of 12 spaces but found 6 spaces.', line: 5 },
        { message: 'Expected indentation of 12 spaces but found 6 spaces.', line: 6 },
        { message: 'Expected indentation of 12 spaces but found 6 spaces.', line: 7 },
        { message: 'Expected indentation of 12 spaces but found 6 spaces.', line: 8 },
        { message: 'Expected indentation of 16 spaces but found 6 spaces.', line: 9 },
        { message: 'Expected indentation of 12 spaces but found 6 spaces.', line: 10 },
        { message: 'Expected indentation of 12 spaces but found 6 spaces.', line: 11 },
        { message: 'Expected indentation of 17 spaces but found 6 spaces.', line: 12 },
        { message: 'Expected indentation of 8 spaces but found 6 spaces.', line: 13 }
      ]
    },

    // RestElement / SpreadElement
    {
      code: unIndent`
        <template>
            <div
                v-bind:a="
                    [
                        a,
                      ...
                      b
                    ] = [
                        a,
                      ...
                      b
                    ]
                "
            ></div>
        </template>
      `,
      output: unIndent`
        <template>
            <div
                v-bind:a="
                    [
                        a,
                        ...
                            b
                    ] = [
                        a,
                        ...
                            b
                    ]
                "
            ></div>
        </template>
      `,
      errors: [
        { message: 'Expected indentation of 16 spaces but found 14 spaces.', line: 6 },
        { message: 'Expected indentation of 20 spaces but found 14 spaces.', line: 7 },
        { message: 'Expected indentation of 16 spaces but found 14 spaces.', line: 10 },
        { message: 'Expected indentation of 20 spaces but found 14 spaces.', line: 11 }
      ]
    },

    // ReturnStatement
    {
      code: unIndent`
        <template>
            <div
                v-on:a="
                  return
                  ;
                "
                v-on:b="
                  return a
                  ;
                "
            ></div>
        </template>
      `,
      output: unIndent`
        <template>
            <div
                v-on:a="
                    return
                    ;
                "
                v-on:b="
                    return a
                    ;
                "
            ></div>
        </template>
      `,
      errors: [
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 4 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 5 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 8 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 9 }
      ]
    },

    // UnaryExpression
    {
      code: unIndent`
        <template>
            <div
                v-bind:a="
                  +
                  a
                "
            ></div>
        </template>
      `,
      output: unIndent`
        <template>
            <div
                v-bind:a="
                    +
                        a
                "
            ></div>
        </template>
      `,
      errors: [
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 4 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 5 }
      ]
    },

    // UpdateExpression
    {
      code: unIndent`
        <template>
            <div
                v-bind:a="
                  ++
                  a
                "
            ></div>
        </template>
      `,
      output: unIndent`
        <template>
            <div
                v-bind:a="
                    ++
                        a
                "
            ></div>
        </template>
      `,
      errors: [
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 4 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 5 }
      ]
    },

    // YieldExpression
    {
      code: unIndent`
        <template>
            <div
                v-bind:a="
                    function*(){
                      yield
                    }
                "
                v-bind:b="
                    function*(){
                      yield
                      a
                    }
                "
                v-bind:c="
                    function*(){
                      yield*
                      a
                    }
                "
            ></div>
        </template>
      `,
      output: unIndent`
        <template>
            <div
                v-bind:a="
                    function*(){
                        yield
                    }
                "
                v-bind:b="
                    function*(){
                        yield
                        a
                    }
                "
                v-bind:c="
                    function*(){
                        yield*
                            a
                    }
                "
            ></div>
        </template>
      `,
      errors: [
        { message: 'Expected indentation of 16 spaces but found 14 spaces.', line: 5 },
        { message: 'Expected indentation of 16 spaces but found 14 spaces.', line: 10 },
        { message: 'Expected indentation of 16 spaces but found 14 spaces.', line: 11 },
        { message: 'Expected indentation of 16 spaces but found 14 spaces.', line: 16 },
        { message: 'Expected indentation of 20 spaces but found 14 spaces.', line: 17 }
      ]
    }

  ]
})
