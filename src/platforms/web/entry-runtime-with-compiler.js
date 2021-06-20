/* @flow */

import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

import Vue from './runtime/index'
import { query } from './util/index'
import { compileToFunctions } from './compiler/index'
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from './util/compat'

const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})

const mount = Vue.prototype.$mount // 缓存了runtime/index.js中的Vue.prototype.$mount方法
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el) // document.querySelector 只是兼容了选择器和dom元素

  // 不能直接挂载到body和html下
  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  // 获取到$options, $options是在_init()方法中添加上去的
  const options = this.$options
  // resolve template/el and convert to render function
  if (!options.render) { // 如果没有render这个属性
    let template = options.template // 则去获取template这个属性
    if (template) {
      if (typeof template === 'string') { // 如果template是字符串
        if (template.charAt(0) === '#') { // 如果template的第一个字母是#, 则会认为template是一个id选择器
          template = idToTemplate(template) // 获取dom并返回其innerHTML
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) { // 没有获取到template则报警告
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) { // 如果template不是字符串, 则再去通过nodeType判断是否是一个dom对象
        template = template.innerHTML  // 如果是, 则直接返回innerHTML
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) { // 如果没有template属性, 则直接获取el
      template = getOuterHTML(el) // 获取到el的OuterHtml
    }
    if (template) { // 经过上面一系列的处理, 再判断是否有了template
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }

      const { render, staticRenderFns } = compileToFunctions(template, {
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  return mount.call(this, el, hydrating)
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML (el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions

export default Vue
