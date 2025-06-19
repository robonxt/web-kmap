# Complex Markdown Test

Here's a test with **bold** and *italic* and some \*escaped\* characters.

## Code Blocks
Here's some inline `code with *stars* in it` and a block:

```javascript
function test() {
    // Comment with * and **
    return "Hello *world*";
}
```

## Lists
1. First item
  * Nested unordered
  * With **bold** text
2. Second item
  1. Nested ordered
  2. With `inline code`
3. Third item with \* escaped

## Blockquotes
Regular text here

> A quote with **bold** and `code`
> * List inside quote
> * Another item

## Complex Combinations
1. Item with [link](https://example.com)
   > Quote inside list
   > With *italic* text
2. Item with ```inline ` backtick```
   ```python
   def test():
       # Nested code block
       print("Hello")
   ```
3. Item with ![image](test.png)

## Escaping Test
\*\*Not Bold\*\*
\`Not Code\`
\[Not Link\]()
