/// <reference types="react" />
/// <reference types="react-dom" />

declare namespace JSX {
  interface Element extends React.ReactElement<any, any> { }
  interface IntrinsicElements {
    [elemName: string]: any;
  }
} 