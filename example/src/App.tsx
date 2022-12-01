import * as React from 'react';

import { StyleSheet, View, Dimensions } from 'react-native';
import TextContextmenu from 'react-native-text-contextmenu';
import html from './html';

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
  .selection-menu {
    font: 12px/100% Roboto, sans-serif;
  }

  .mobile {
    font-size: 20px !important;
    min-height: 30px !important;
    font-weight: bold;
    padding: 14px !important;
    padding-top: 21px !important;   
  }
  `

  return (
    <View style={styles.container}>
      <TextContextmenu minlength={3} value={html} menus={[{
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
      }]} maxItems={2} scrollTop={500} selections={[{ text: "the ", color: "red" }]} onSelect={(data, text) => {
        console.log(data, text);
      }} width={Dimensions.get("window").width} height={Dimensions.get("window").height} css={css} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
