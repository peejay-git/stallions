declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module 'tailwindcss/tailwind.css';

// Allow Tailwind directives in CSS
interface CSSRule {
  selectorText: string;
  style: CSSStyleDeclaration;
}

interface CSSStyleDeclaration {
  [key: string]: string;
} 