import React, { useImperativeHandle, useRef } from 'react';
import { Platform, ColorValue, } from 'react-native';
import WebView, { WebViewProps } from 'react-native-webview';
const isAndroid = Platform.OS === 'android'

export type Menu = {
  text: string;
  icon: string;
  id: string;
}

export type Selection = {
  start?: number,
  end?: number,
  color?: ColorValue,
  text?: string;
}

export type IWebViewProps = {
  width: number;
  height: number;
  menus: Menu[];
  value: string;
  maxItems?: number;
  minlength?: number;
  selections?: Selection[];
  onScroll?: (value: number) => void;
  css?: string;
  onSelect: (menu: Menu, selectedText: string) => void | Promise<void>;
  injectedJavaScriptBefore?: string;
  injectedJavaScriptAfter?: string;
} & Omit<WebViewProps, "injectedJavaScript">;


export type TextContextmenuRef = {
  webView?: WebView;
}

const TextContextmenu = React.forwardRef<TextContextmenuRef, IWebViewProps>((props, ref) => {
  const webRef = useRef<WebView>()
  const onMessage = (event: any) => {
    const data = JSON.parse(event.nativeEvent.data) as any;
    if (__DEV__) {
      console.log({ ...data, selectedText: data.selectedText?.length ?? undefined });
    }
    if (data.type == "menuClick") {
      const menu = props.menus.find(x => x.id === data.id) as Menu;
      props.onSelect(menu, data.selectedText);
    } else if (data.type == "error") {
      console.error(data);
    } else if (data.type == "scroll" && props.onScroll)
      props.onScroll(data.message);
    if (props.onMessage) {
      props.onMessage(event);
    }
  }

  useImperativeHandle(ref, () => {
    return {
      webView: webRef.current
    }
  }, []);

  const p = { ...props } as any;
  p.javaScriptEnabled = true;
  delete p.width;
  delete p.height;
  delete p.menus;
  delete p.onSelect;
  delete p.contextMenuCssStyle;
  delete p.selections;
  delete p.maxItems;
  delete p.injectedJavaScriptBefore;
  delete p.injectedJavaScriptAfter;
  delete p.minlength;
  p.onMessage = onMessage;
  p.originWhitelist = ['*'];
  let style = { width: props.width, height: props.height };
  if (props.style) {
    style = Array.isArray(props.style) ? [...props.style, style] : { ...(props.style as any), ...style };
  }
  p.style = style;
  p.source = { uri: isAndroid ? "file:///android_asset/index.html" : "./asset/index.html" }
  p.injectedJavaScript = `
      bindContextMenu(${JSON.stringify(props.menus)},${props.selections ? JSON.stringify(props.selections) : "undefined"}, ${props.maxItems ? props.maxItems : "undefined"}, ${"`" + props.value + "`"}, ${props.css ? "`" + props.css + "`" : "undefined"}, ${props.minlength ? props.minlength : "undefined"} )
  `


  if (props.injectedJavaScriptBefore)
    p.injectedJavaScript = props.injectedJavaScriptBefore + "\n" + p.injectedJavaScript;

  if (props.injectedJavaScriptAfter)
    p.injectedJavaScript = + p.injectedJavaScript + "\n" + props.injectedJavaScriptAfter;
  return (
    <WebView {...p} ref={webRef} />
  )
});


export default TextContextmenu;