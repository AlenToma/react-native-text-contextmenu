# react-native-text-contextmenu

Custom text contextmenu for react-native using webview
in this you could customize everything about your contextmenu without using any native code

## Installation

```sh

npm install react-native-webview react-native-text-contextmenu
```

## Usage

```js
import * as React from 'react';

import { StyleSheet, View, Dimensions } from 'react-native';
import TextContextmenu from 'react-native-text-contextmenu';

const html = `
<div class="main-content">
<p> Chapter 551: A wave of changes.</p>
<p> Leaving the bathroom after finishing the bath, the group of mothers, daughters, and a goddess went to
    Victor’s personal room, a room that was big enough to fit several people.</p>
</div>
`

export default function App() {
  const css = `
  .main-content p {
    font-size: 26px;
    line-height: 160%;
    margin-left: 52px;
    margin-right: 42px;
    font-family: Arial, sans-serif, serif;
    background-color: inherit;
    z-index: -9999999999999999999999999;
}
  `

  return (
    <View style={styles.container}>
      <TextContextmenu value={html} menus={[{
        text: "Copy",
        icon: `<i class="fa fa-eye"></i>`,
        id: "copy"
      },
      {
        text: "Delete",
        icon: `<i class="fa fa-times"></i>`,
        id: "delete"
      },
      {
        text: "Translate",
        icon: `<i class="fa fa-times"></i>`,
        id: "translate"
      }]} maxItems={2} onSelect={(menu, selectedText) => {
        console.log(menu, selectedText);
      }} width={Dimensions.get("window").width} height={Dimensions.get("window").height} css={css} />
    </View>
  );
}
```
## Propeties 
### width*
the width of the webview

### height*
the height of the webview

### menus*
the contextmenu when the text gets selected

### value*
text or html

### onSelect*
when a contextmenu gets selected, it include the menu and the selected text

### maxItems(optional)
how many items get display in contextmenu and the rest will be included under a collabs button

### selections(optional)
select text with its properties eg `[{text: "the", color: red}]`

### onScroll(optional)
when the window gets scrolled, it return scrolltop

### css(optional)
style of the page. here you can customize even the `selection-menu` [see the css file for more info](https://github.com/AlenToma/react-native-text-contextmenu/blob/master/android/src/main/assets/style.css) 

### injectedJavaScriptBefore(optional)
inject javascript before the contextmenu gets bind

### injectedJavaScriptAfter(optional)
inject javascript after the contextmenu gets bind

### minlength(optional)
how much text has to get selected before contextmenu gets displayed default is 1
## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
