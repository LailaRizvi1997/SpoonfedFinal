import { JSX as JSXNamespace } from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements extends JSXNamespace.IntrinsicElements {}
  }
} 