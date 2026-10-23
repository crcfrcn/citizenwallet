import {fileURLToPath} from 'node:url';
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
      }
    ]
  }
});
export function describeConfiguration(){return JSON.parse(JSON.stringify(manifest));}

// 只有产品、工具和入口声明；所有执行函数归build.mjs。
export const repository="crcfrcn/citizenwallet";
export const tools=Object.freeze({"node": "25.2.1", "rust": "1.97.1", "flutter": "3.47.2", "buildTools": "36.0.0", "ndk": "28.2.13676358", "gradle": "9.1.0", "agp": "9.0.1", "kotlin": "2.2.20", "cocoapods": "1.17.0"});
export const platforms=Object.freeze({"ios": "iOS", "android": "Android"});
export const initialVersion="1.0.0";

// 本产品Workflow坐标声明。
export const workflows=Object.freeze({"ios":"ios.yml","android":"android.yml"});

// 只返回声明数据；派发与观察归通用调用方，版本及交付归本仓YAML。
export function describeAction({flow,platform,inputs={}}){
 const workflow=workflows[platform];
 if(flow==='release'&&workflow)return {repository:"crcfrcn/citizenwallet",workflow,ref:'main',inputs};
 if(flow==='test'&&workflow)return {command:process.execPath,args:[fileURLToPath(new URL('build.mjs',import.meta.url)),flow,platform],cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,...inputs.environment}};
 throw Error('本产品未声明该流程：'+flow+'·'+platform);
}
