import React, { LegacyRef, useImperativeHandle, useRef } from 'react';
import { NativeModules, Platform, ColorValue, } from 'react-native';
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

type IWebViewProps = {
  width: number;
  height: number;
  menus: Menu[];
  value: string;
  maxItems?: number;
  selections?: Selection[],
  contextMenuCssStyle?: string;
  onSelect: (menu: Menu, selectedText: string) => void | Promise<void>;
} & WebViewProps;


type IRef = {
  webView?: WebView;
}

export const TextContextmenu = React.forwardRef<IRef, IWebViewProps>((props, ref) => {
  const webRef = useRef<WebView>()
  const onMessage = (event: any) => {
    const data = JSON.parse(event.nativeEvent.data) as any;
    if (__DEV__) {
      console.log({ ...data, selectedText: data.selectedText?.length ?? undefined });
    }
    if (data.type == "menuClick") {
      const menu = props.menus.find(x => x.id === data.id) as Menu;
      props.onSelect(menu, data.selectedText);
    }
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
  p.onMessage = onMessage;
  p.originWhitelist = ['*'];
  let style = { width: props.width, height: props.height };
  if (props.style) {
    style = Array.isArray(props.style) ? [...props.style, style] : { ...(props.style as any), ...style };
  }
  p.style = style;
  p.source = { uri: isAndroid ? "file:///android_asset/index.html" : "./asset/index.html" }
  p.injectedJavaScript = `
      bindContextMenu(${JSON.stringify(props.menuItems)},${props.selections ? JSON.stringify(props.selections) : "undefined"}, ${props.maxItems ? props.maxItems : "undefined"}, "${props.value}" )
  `

  if (props.injectedJavaScript)
    p.injectedJavaScript = props.injectedJavaScript + "\n" + p.injectedJavaScript;
  return (
    <WebView ref={webRef} {...p} />
  )
});
