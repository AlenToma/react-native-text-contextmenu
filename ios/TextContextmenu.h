
#ifdef RCT_NEW_ARCH_ENABLED
#import "RNTextContextmenuSpec.h"

@interface TextContextmenu : NSObject <NativeTextContextmenuSpec>
#else
#import <React/RCTBridgeModule.h>

@interface TextContextmenu : NSObject <RCTBridgeModule>
#endif

@end
