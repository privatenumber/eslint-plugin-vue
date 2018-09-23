/**
 * @fileoverview require the component to be directly exported
 * @author Hiroki Osame <hiroki.osame@gmail.com>
 */
'use strict'

const utils = require('../utils')

// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------

module.exports = {
  meta: {
    docs: {
      description: 'require the component to be directly exported',
      category: 'essential',
      recommended: false,
      url: 'https://github.com/vuejs/eslint-plugin-vue/blob/v5.0.0-beta.3/docs/rules/require-direct-export.md'
    },
    fixable: "code",
    schema: []
  },

  create (context) {
    const filePath = context.getFilename()
    const sourceCode = context.getSourceCode()

    return {
      'ExportDefaultDeclaration:exit' (node) {
        const isVueFile = utils.isVueFile(filePath)
        if (!isVueFile) { return }

        const isObjectExpression = (
          node.type === 'ExportDefaultDeclaration' &&
                    node.declaration.type === 'ObjectExpression'
        )

        if (!isObjectExpression) {
          context.report({
            node,
            message: `Expected the component literal to be directly exported.`,
            fix(fixer) {
              const identifier = node.declaration
              const scope = context.getScope()
              const variable = scope.set.get(identifier.name)

              // references are just the declaration and export
              if (variable && variable.defs.length === 1 && variable.references.length === 2) {
                const { defs } = variable
                const def = defs[0]
                const ObjectExp = def.node.init

                if (ObjectExp && ObjectExp.type === 'ObjectExpression') {
                  return [
                    fixer.remove(def.parent),
                    fixer.replaceText(node.declaration, sourceCode.getText(ObjectExp))
                  ];
                }
              }
            }
          })
        }
      }
    }
  }
}
