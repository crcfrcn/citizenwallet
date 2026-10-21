// 本产品配置需求的公开入口；只登记名称、类型和规则，不保存配置值。
export const manifest=Object.freeze({
  "schema": 1,
  "product_id": "citizenwallet",
  "configuration": {
    "id": "citizenwallet",
    "kind": "mobile",
    "title": "公民钱包配置",
    "items": [
      {
        "environment": "release",
        "name": "APP_KEY",
        "title": "APP_KEY",
        "description": "Android 正式应用签名密钥的本机加密备份",
        "revealable": true,
        "accessLevel": "protected",
        "kind": "android-signing",
        "sharedId": "mobile-signing:APP_KEY"
      },
      {
        "environment": "release",
        "name": "IOS_KEY",
        "title": "IOS_KEY",
        "description": "iOS 正式签名证书的本机加密备份",
        "revealable": true,
        "accessLevel": "protected",
        "kind": "ios-signing",
        "sharedId": "mobile-signing:IOS_KEY"
      },
      {
        "environment": "release",
        "name": "WALLET_PROFILE",
        "title": "WALLET_PROFILE",
        "description": "公民钱包 iOS 正式描述文件的本机加密备份",
        "revealable": true,
        "accessLevel": "protected",
        "kind": "ios-signing"
      },
      {
        "environment": "appstore",
        "name": "PLAY_KEY",
        "title": "PLAY_KEY",
        "description": "Google Play已有服务账号，用于自动化上传正式AAB",
        "revealable": false,
        "accessLevel": "protected"
      }
    ]
  }
});
export function describeConfiguration(){return JSON.parse(JSON.stringify(manifest));}

// 只有产品、工具和入口声明；所有执行函数归build.mjs。
export const repository="crcfrcn/citizenwallet";
export const tools=Object.freeze({"node": "25.2.1", "rust": "1.97.1", "flutter": "3.47.2", "ndk": "28.2.13676358", "gradle": "9.1.0", "agp": "9.0.1", "kotlin": "2.2.20", "cocoapods": "1.17.0"});
export const platforms=Object.freeze({"ios": "iOS", "android": "Android"});
export const initialVersion="1.0.0";
export {describeAction} from './build.mjs';
