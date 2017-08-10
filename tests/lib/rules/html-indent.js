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
    ecmaVersion: 2015
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
      errors: [
        { message: 'Expected indentation of 8 spaces but found 6 spaces.', line: 3 }
      ]
    },

    // VEndTag
    {
      code: unIndent`
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
      errors: [
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 4 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 5 },
        { message: 'Expected indentation of 20 spaces but found 10 spaces.', line: 6 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 11 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 12 },
        { message: 'Expected indentation of 12 spaces but found 10 spaces.', line: 17 },
        { message: 'Expected indentation of 16 spaces but found 10 spaces.', line: 18 },
        { message: 'Expected indentation of 20 spaces but found 10 spaces.', line: 19 }
      ]
    }
  ]
})
