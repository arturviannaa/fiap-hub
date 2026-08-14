// Sanitizacao do HTML que vem dos notebooks de terceiros.
// Modulo separado de build-content.mjs porque aquele roda ao ser importado.
import sanitizeHtml from 'sanitize-html'

const TAGS_OK = [
  'p', 'br', 'hr', 'div', 'span', 'pre', 'code', 'blockquote',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins', 'mark', 'sub', 'sup', 'small',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  'a', 'img', 'figure', 'figcaption',
]

export function limparHtml(html) {
  return sanitizeHtml(html, {
    allowedTags: TAGS_OK,
    allowedAttributes: {
      a: ['href', 'title', 'rel', 'target'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      td: ['colspan', 'rowspan', 'align'],
      th: ['colspan', 'rowspan', 'align', 'scope'],
      col: ['span'],
      '*': ['class', 'id', 'style', 'dir', 'lang'],
    },
    // sem javascript:, sem vbscript:; data: so pra imagem (matplotlib inline)
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    allowProtocolRelative: false,
    // style inline so com propriedades visuais inofensivas
    allowedStyles: {
      '*': {
        'color': [/.*/], 'background-color': [/.*/], 'background': [/.*/],
        'text-align': [/.*/], 'vertical-align': [/.*/], 'font-weight': [/.*/],
        'font-style': [/.*/], 'font-size': [/.*/], 'font-family': [/.*/],
        'text-decoration': [/.*/], 'width': [/.*/], 'height': [/.*/],
        'max-width': [/.*/], 'margin': [/.*/], 'padding': [/.*/],
        'border': [/.*/], 'border-collapse': [/.*/], 'border-color': [/.*/],
        'white-space': [/.*/], 'display': [/.*/], 'float': [/.*/],
      },
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow', target: '_blank' }),
    },
    // <script>, <style>, <iframe>, <object>, <form> etc. saem com o conteudo junto
    nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript', 'iframe', 'object', 'embed', 'form'],
  })
}
