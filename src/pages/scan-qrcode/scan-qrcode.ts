import { Component, ViewChild } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  Content,
  ActionSheetController,
  Platform,
  AlertController,
  ModalController,
  App
  // Slides,
  // InfiniteScroll,
  // Refresher,
} from "ionic-angular";
// import Swiper from "swiper"; // 滑动js库
import { Storage } from "@ionic/storage";
// import { Geolocation } from "@ionic-native/geolocation"; // GPS定位
// import { AndroidPermissions } from "@ionic-native/android-permissions"; // Android权限控制
// import { OpenNativeSettings } from "@ionic-native/open-native-settings"; // 系统设置
import { QRScanner, QRScannerStatus } from "@ionic-native/qr-scanner"; // 条码、二维码扫描
import _ from "underscore"; // 工具类
import { GlobalService } from "../../common/service/GlobalService";
// import { GlobalMethod } from "../../common/service/GlobalMethod";
import { HttpReqService } from "../../common/service/HttpUtils.Service";
// import { pageObj } from "../../common/config/BaseConfig";
// import { ParamService } from "../../common/service/Param.Service";
// import { JsUtilsService } from "../../common/service/JsUtils.Service";
// import { ParamService } from "../../common/service/Param.Service";

@IonicPage()
@Component({
  selector: "page-scan-qrcode",
  templateUrl: "scan-qrcode.html"
})
export class ScanQrcodePage {
  @ViewChild(Content)
  content: Content;

  public isOpenLight: boolean; // 判断是否开启闪光灯
  public isFrontCamera: boolean; // 判断是否开启前置摄像头
  public isShow: boolean = false; // 控制显示背景，避免切换页面卡顿
  public isContinuity: boolean = false; // 是否开启连续扫描
  public scanResult: any = []; // 扫描结果
  public isShowSeeBtn: boolean = false; // 是否显示查看结果按钮
  public isShowConfirmBtn: boolean = false; // 是否显示确定按钮
  public isScanLine: boolean = false; // 是否显示扫描线

  constructor(
    // private jsUtil: JsUtilsService, // 自定义JS工具类
    // private geolocation: Geolocation, // GPS定位
    // private androidPermissions: AndroidPermissions, // Android权限控制
    // private openNativeSettings: OpenNativeSettings, // 系统设置
    public app: App,
    public navCtrl: NavController, // 导航控制器
    public navParams: NavParams, // 导航参数传递控制
    public httpReq: HttpReqService, // Http请求服务
    public ionicStorage: Storage, // IonicStorage
    public gloService: GlobalService, // 全局自定义服务
    public actionSheetCtrl: ActionSheetController, // 操作表控制器
    public platform: Platform, // 获取平台信息
    public alertCtrl: AlertController, // Alert消息弹出框
    public modalCtrl: ModalController, // Modal弹出页控制器
    public qrScanner: QRScanner // 条码、二维码扫描
  ) {
    this.isOpenLight = false; // 判断是否开启闪光灯，默认为false
    this.isFrontCamera = false; // 判断是否开启前置摄像头，默认为false
  }

  ionViewDidLoad() {
    console.log("ionViewDidLoad ScanQrcodePage");
  }

  ionViewDidEnter() {
    // 页面可见时才执行
    this.openScan(); // 开启相机扫描
    this.isShow = true; // 显示背景
  }

  /**
   * 打开新页面
   * @param {*} pageName 页面组件类名称
   * @param {*} obj 页面组件类名称
   * @param {*} opts 转场动画
   * @memberof UserListPage
   */
  public jumpPage(pageName: any, obj?: any, opts?: any): void {
    if (_.isObject(obj) && !_.isEmpty(obj)) {
      this.navCtrl.push(pageName, obj);
    } else {
      if (pageName == "ScanPage") {
        this.navCtrl.push(pageName, null, opts);
      } else {
        this.navCtrl.push(pageName);
      }
    }
  }

  /**
   * 开启相机扫描
   * @memberof ScanPage
   */
  public openScan() {
    this.qrScanner.destroy(); // 销毁关闭
    // const backRefreshObj = ParamService.getParamObj();
    this.qrScanner
      .prepare()
      .then((status: QRScannerStatus) => {
        if (status.authorized) {
          this.showCamera(); // 开启相机背景透明
          setTimeout(() => {
            this.isScanLine = true; // 显示扫描线
          }, 500);
          let scanSub = this.qrScanner.scan().subscribe((text: string) => {
            if (/[0-9a-zA-Z]{32}/g.test(text)) {
              // alert(text.length);
              this.qrScanner.hide(); // 将本机webview配置为不透明
              scanSub.unsubscribe(); // 停止扫描
              this.navCtrl.pop({ animate: false }); // 返回上一页
              this.jumpPage("RetenSampDetailPage", { id: text });
            } else {
              console.error("正则匹配失败", text);
              this.gloService.showMsg("二维码不正确，请重新扫描", null, 1500);
              setTimeout(() => {
                // this.qrScanner.hide(); // 将本机webview配置为不透明
                scanSub.unsubscribe(); // 停止扫描
                setTimeout(() => {
                  this.openScan();
                }, 500);
              }, 1000);
            }
            // alert(text);
            // if (/(^[Y]\d{9}$)/gi.test(text)) {
            //   this.qrScanner.hide(); // 将本机webview配置为不透明
            //   scanSub.unsubscribe(); // 停止扫描
            //   this.navCtrl.pop({ animate: false }); // 返回上一页
            //   // const loading = this.gloService.showLoading("正在登录，请稍候...");
            //   const formData: any = {
            //     deliveryPackageNo: text
            //   };
            //   this.httpReq.post(
            //     "workerUser/scanBangWorker",
            //     null,
            //     formData,
            //     data => {
            //       if (data["status"] == 200) {
            //         if (data["code"] == 0) {
            //           this.gloService.showMsg("扫描成功", null, 1000);
            //           if (_.isFunction(backRefreshObj.backRefEvent)) {
            //             console.error("执行返回刷新事件");
            //             backRefreshObj.backRefEvent(backRefreshObj.that); // 执行返回刷新事件
            //           }
            //           // loading.dismiss();
            //           // this.app.getRootNav().push("MainPage"); // 跳转到主页
            //           // this.viewCtrl.dismiss(); // 销毁当前视图
            //         } else {
            //           // loading.dismiss();
            //           this.gloService.showMsg(data["message"], null, 3000);
            //         }
            //       } else {
            //         // loading.dismiss();
            //         this.gloService.showMsg("请求服务器出错", null, 3000);
            //       }
            //     }
            //   );
            // } else {
            //   console.error("正则匹配失败", text);
            //   this.gloService.showMsg("非法的条码，请重新扫描", null, 3000);
            //   this.qrScanner.hide(); // 将本机webview配置为不透明
            //   scanSub.unsubscribe(); // 停止扫描
            //   this.openScan();
            // }
          });
          this.qrScanner.show(); // 将本机webview配置为具有透明背景
        } else if (status.denied) {
          // 相机权限被永久拒绝，必须使用QRScanner.openSettings()方法将用户引导到设置页
          const confirm = this.alertCtrl.create({
            title: "提示",
            message: "检测到相机权限未开启，请前往开启！",
            buttons: [
              {
                text: "不开启",
                handler: () => {}
              },
              {
                text: "前往开启",
                handler: () => {
                  this.qrScanner.openSettings(); // 打开相机设置
                  // this.openNativeSettings.open("application_details");
                  // this.openNativeSettings.open("application_development");
                  // this.openNativeSettings.open("application");
                  // this.openNativeSettings.open("notification_id");
                }
              }
            ]
          });
          let rootNav = this.app.getRootNavs()[0]; // 获取根导航
          let ionicApp = rootNav._app._appRoot;
          let activePortal = ionicApp._overlayPortal.getActive();
          if (!activePortal) {
            confirm.present();
          }
        } else {
          // 权限被拒绝，但不是永久性的。你可以在以后再请求许可
        }
      })
      .catch((e: any) => {
        console.log("%c 请求相机权限失败", "color:#E85FE3", e);
        const confirm = this.alertCtrl.create({
          title: "提示",
          message: "检测到相机权限未开启，请前往开启！",
          buttons: [
            {
              text: "不开启",
              handler: () => {}
            },
            {
              text: "前往开启",
              handler: () => {
                this.qrScanner.openSettings(); // 打开相机设置
                // this.openNativeSettings.open("application_details");
                // this.openNativeSettings.open("application_development");
                // this.openNativeSettings.open("application");
                // this.openNativeSettings.open("notification_id");
              }
            }
          ]
        });
        let rootNav = this.app.getRootNavs()[0]; // 获取根导航
        let ionicApp = rootNav._app._appRoot;
        let activePortal = ionicApp._overlayPortal.getActive();
        if (!activePortal) {
          confirm.present();
        }
      });
  }

  /**
   * 闪光灯开关
   * @memberof ScanPage
   */
  public toggleLight() {
    if (this.isOpenLight) {
      this.qrScanner.disableLight(); // 关闭闪光灯
    } else {
      this.qrScanner.enableLight(); // 开启闪光灯
    }
    this.isOpenLight = !this.isOpenLight;
  }

  /**
   * 前后摄像头切换
   * @memberof ScanPage
   */
  public toggleCamera() {
    if (this.isFrontCamera) {
      this.qrScanner.useBackCamera(); // 开启后置摄像头
    } else {
      this.qrScanner.useFrontCamera(); // 开启前置摄像头
    }
    this.isFrontCamera = !this.isFrontCamera;
  }

  /**
   * 连续扫描切换
   * @memberof ScanPage
   */
  public toggleContinue() {
    if (this.isContinuity) {
      // this.qrScanner.useBackCamera(); // 开启后置摄像头
      let alert = this.alertCtrl.create({
        title: "提示",
        message: "切换扫描模式会清除已经扫描的单号",
        buttons: [
          {
            text: "取消",
            role: "cancel",
            handler: () => {}
          },
          {
            text: "确定",
            handler: () => {
              this.isContinuity = !this.isContinuity;
            }
          }
        ]
      });
      alert.present();
    } else {
      // this.qrScanner.useFrontCamera(); // 开启前置摄像头
    }
  }

  /**
   * 开启相机背景透明
   * @memberof ScanPage
   */
  public showCamera() {
    window.document.querySelector("body").classList.add("transparent-body"); // 添加透明样式
    (window.document.querySelector("ion-app") as HTMLElement).classList.add(
      "cameraView"
    );
  }

  /**
   * 关闭相机背景透明
   * @memberof ScanPage
   */
  public hideCamera() {
    window.document.querySelector("body").classList.remove("transparent-body"); // 移除透明样式
    (window.document.querySelector("ion-app") as HTMLElement).classList.remove(
      "cameraView"
    );
    this.qrScanner.hide(); // 将本机webview配置为不透明
    this.qrScanner.destroy(); // 销毁关闭
  }

  ionViewWillLeave() {
    this.hideCamera(); // 关闭相机
    this.isScanLine = false; // 显示扫描线
  }
}
