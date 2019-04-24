import { Component } from "@angular/core";
import {
  AlertController,
  NavController,
  NavParams,
  ActionSheetController,
  Platform,
  MenuController,
  IonicPage,
  ViewController,
  Events,
  App
} from "ionic-angular";
import _ from "underscore"; // 工具类
import { GlobalService } from "../../common/service/GlobalService";
import { JsUtilsService } from "../../common/service/JsUtils.Service";
import { HttpReqService } from "../../common/service/HttpUtils.Service";
import { loginInfo } from "../../common/config/BaseConfig";
import { NFC } from "@ionic-native/nfc";
import { UpperCasePipe } from "@angular/common";
// import { ParamService } from "../../common/service/Param.Service";
// import { Storage } from "@ionic/storage";
// import { FormGroup, FormBuilder, Validators } from "@angular/forms";
// import { FormValidService } from "../../common/service/FormValid.Service";
// import { GlobalMethod } from "../../common/service/GlobalMethod";

@IonicPage()
@Component({
  selector: "page-add-mac",
  templateUrl: "add-mac.html"
})
export class AddMacPage {
  public paramId: string = null; // 传递过来的参数ID
  public formInfo: any = null; // 数据对象
  public formData: any = {}; // 定义表单对象
  public imgArr: Array<string> = null;

  constructor(
    // private ionicStorage: Storage, // IonicStorage
    // private fb: FormBuilder, // 响应式表单
    public app: App,
    public navCtrl: NavController, // 导航控制器
    public viewCtrl: ViewController, // 视图控制器
    public navParams: NavParams, // 导航参数传递控制
    public nfc: NFC, // NFC
    public menuCtrl: MenuController, // 侧边栏控制
    private jsUtil: JsUtilsService, // 自定义JS工具类
    private httpReq: HttpReqService, // Http请求服务
    public gloService: GlobalService, // 全局自定义服务
    public actionSheetCtrl: ActionSheetController, // 操作表控制器
    public platform: Platform, // 获取平台信息
    public events: Events, // 事件发布与订阅
    public alertCtrl: AlertController // Alert消息弹出框
  ) {
    if (this.navParams.get("id")) {
      this.paramId = this.navParams.get("id").replace(/^\s+|\s+$/g, ""); // 修改数据时获取到的ID
      this.formData.id = this.paramId;
    }
  }

  ionViewDidLoad() {
    console.log("ionViewDidLoad RetenSampDetailPage");
  }

  ionViewWillEnter() {
    if (_.isString(this.paramId) && this.paramId.length > 0) {
      console.error("this.paramId", this.paramId);
      const sendObj = {
        id: this.paramId
      };
      this.httpReq.get(
        "home/a/oldfolksinfo/homeOldFolksInfo/oldForm",
        sendObj,
        (data: any) => {
          if (data && !_.isEmpty(data)) {
            if (_.isObject(data["data"]) && !_.isEmpty(data["data"])) {
              this.formInfo = data["data"]["homeOldFolksInfo"];
              // if (
              //   _.isString(data["data"]["reservedImg"]) &&
              //   data["data"]["reservedImg"].length > 0
              // ) {
              //   this.imgArr = data["data"]["reservedImg"].split(",");
              // }
            }
          } else {
            this.gloService.showMsg(data["message"], null, 2000);
          }
        }
      );
    } else {
      this.gloService.showMsg("未获取到ID", null, 2000);
      if (this.navCtrl.canGoBack()) {
        this.navCtrl.pop();
      }
    }
  }

  ionViewDidEnter() {
    this.initNfcListener(); // 初始化NFC监听

    //=================订阅NFC扫描成功事件 Begin=================//
    this.events.subscribe("nfcScanSuc", (nfcId: any) => {
      if (nfcId) {
        // 已经服务标签与扫描标签相同
        setTimeout(() => {
          let rootNav = this.app.getRootNavs()[0]; // 获取根导航
          let ionicApp = rootNav._app._appRoot;
          let activePortal = ionicApp._toastPortal.getActive();
          if (activePortal) {
          } else {
            this.gloService.showMsg("读取成功：" + nfcId, "top", 3000);
          }
        }, 300);

        this.formInfo.homeOldFolksAddressList[0].nfcNo = nfcId;
        // this.events.unsubscribe("nfcScanSuc");
      } else {
        // setTimeout(() => {
        //   let rootNav = this.app.getRootNavs()[0]; // 获取根导航
        //   let ionicApp = rootNav._app._appRoot;
        //   let activePortal = ionicApp._toastPortal.getActive();
        //   if (activePortal) {
        //   } else {
        //     this.gloService.showMsg("扫描标签与已开服务标签不一致！");
        //   }
        // }, 300);
      }
    });
    //=================订阅NFC扫描成功事件 End=================//
  }

  ionViewWillLeave() {
    this.events.unsubscribe("nfcScanSuc"); // 取消NFC扫描成功事件
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
   * 保存表单数据
   * @memberof RetenSampAddPage
   */
  public saveForm() {
    this.formData.nfcNo = this.formInfo.homeOldFolksAddressList[0].nfcNo;
    const sendObj: any = this.jsUtil.deepClone(this.formData);
    this.httpReq.get(
      "home/a/oldfolksinfo/homeOldFolksInfo/saveNfcNo",
      sendObj,
      (data: any) => {
        if (data && !_.isEmpty(data)) {
          if (data["data"]["result"] == 0) {
            this.gloService.showMsg("保存成功", null, 2000);
            if (this.navCtrl.canGoBack()) {
              this.navCtrl.pop();
            }
          } else {
            this.gloService.showMsg(data["data"]["message"], null, 2000);
          }
        } else {
          this.gloService.showMsg(data["message"], null, 2000);
        }
      }
    );
  }

  /**
   * 初始化NFC监听
   * @memberof MyApp
   */
  public initNfcListener() {
    let that = this;
    if (this.platform.is("android") && !this.platform.is("mobileweb")) {
      this.nfc
        .enabled()
        .then(enabled => {
          that.nfc
            .addNdefListener(() => {}, err => {})
            .subscribe(event => {
              let rfid = that.nfc.bytesToHexString(event.tag.id);
              let nfcId = rfid.replace(/(.{2})/g, "$1:").replace(/(:)$/, "");
              const upperTrans = new UpperCasePipe().transform(nfcId);
              if (loginInfo.LoginState == "success") {
                // const nfcId = event.tag.id.join(":");
                // this.gloService.showMsg(upperTrans, null, 3000);
                this.events.publish("nfcScanSuc", upperTrans);
                // this.jumpPage("CardReadPage");
              } else {
                this.gloService.showMsg("用户未登录！");
              }
              // that.events.publish(EventTag.NFCScanned, rfid);
            });
          that.nfc
            .addNdefFormatableListener(() => {}, err => {})
            .subscribe(event => {
              let rfid = that.nfc.bytesToHexString(event.tag.id);
              let nfcId = rfid.replace(/(.{2})/g, "$1:").replace(/(:)$/, "");
              const upperTrans = new UpperCasePipe().transform(nfcId);
              if (loginInfo.LoginState == "success") {
                // const nfcId = event.tag.id.join(":");
                // this.gloService.showMsg(upperTrans, null, 3000);
                this.events.publish("nfcScanSuc", upperTrans);
                // this.jumpPage("CardReadPage");
              } else {
                this.gloService.showMsg("用户未登录！");
              }
              // that.events.publish(EventTag.NFCScanned, rfid);
            });
        })
        .catch(() => {
          that.showNfcOpenConfirm();
        });
    }
  }

  /**
   * 显示去开启NFC确认提示功能
   * @memberof MyApp
   */
  public showNfcOpenConfirm() {
    const confirm = this.alertCtrl.create({
      title: "提示",
      message: "NFC功能未开启，请前往设置页面开启！",
      buttons: [
        {
          text: "不开启",
          handler: () => {}
        },
        {
          text: "前往设置",
          handler: () => {
            this.nfc.showSettings();
          }
        }
      ]
    });
    confirm.present();
  }
}
