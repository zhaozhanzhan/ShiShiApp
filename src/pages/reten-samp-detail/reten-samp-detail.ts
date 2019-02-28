import { Component } from "@angular/core";
import {
  AlertController,
  NavController,
  NavParams,
  ActionSheetController,
  Platform,
  MenuController,
  IonicPage,
  ViewController
} from "ionic-angular";
import _ from "underscore"; // 工具类
import { GlobalService } from "../../common/service/GlobalService";
import { JsUtilsService } from "../../common/service/JsUtils.Service";
import { HttpReqService } from "../../common/service/HttpUtils.Service";
import { ParamService } from "../../common/service/Param.Service";
import { loginInfo } from "../../common/config/BaseConfig";
// import { Storage } from "@ionic/storage";
// import { FormGroup, FormBuilder, Validators } from "@angular/forms";
// import { FormValidService } from "../../common/service/FormValid.Service";
// import { GlobalMethod } from "../../common/service/GlobalMethod";

@IonicPage()
@Component({
  selector: "page-reten-samp-detail",
  templateUrl: "reten-samp-detail.html"
})
export class RetenSampDetailPage {
  public paramId: string = null; // 传递过来的参数ID
  public formInfo: any = null; // 数据对象
  public imgArr: Array<string> = null;

  constructor(
    // private ionicStorage: Storage, // IonicStorage
    // private fb: FormBuilder, // 响应式表单
    public navCtrl: NavController, // 导航控制器
    public viewCtrl: ViewController, // 视图控制器
    public navParams: NavParams, // 导航参数传递控制
    public menuCtrl: MenuController, // 侧边栏控制
    private jsUtil: JsUtilsService, // 自定义JS工具类
    private httpReq: HttpReqService, // Http请求服务
    public gloService: GlobalService, // 全局自定义服务
    public actionSheetCtrl: ActionSheetController, // 操作表控制器
    public platform: Platform, // 获取平台信息
    public alertCtrl: AlertController // Alert消息弹出框
  ) {
    this.paramId = this.navParams.get("id").replace(/^\s+|\s+$/g, ""); // 修改数据时获取到的ID
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
      this.httpReq.post(
        "foodRetention/findById",
        null,
        sendObj,
        (data: any) => {
          if (data["status"] == 200) {
            if (data["code"] == 0) {
              if (_.isObject(data["data"]) && !_.isEmpty(data["data"])) {
                this.formInfo = data["data"];
                if (
                  _.isString(data["data"]["reservedImg"]) &&
                  data["data"]["reservedImg"].length > 0
                ) {
                  this.imgArr = data["data"]["reservedImg"].split(",");
                }
              }
            } else {
              this.gloService.showMsg(data["message"], null, 2000);
            }
          } else {
            this.gloService.showMsg("请求服务器出错", null, 2000);
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
   * 销样
   * @memberof RetenSampDetailPage
   */
  public pinSample() {
    const backRefreshObj = ParamService.getParamObj();
    let alert = this.alertCtrl.create({
      title: "提示",
      message: "确定销样该食品吗？",
      buttons: [
        {
          text: "取消",
          role: "cancel",
          handler: () => {}
        },
        {
          text: "确定",
          handler: () => {
            const sendObj: any = {};
            sendObj.id = this.paramId;
            sendObj.pinPeople = loginInfo.UserName;
            sendObj.pinTime = this.jsUtil.dateFormat(
              new Date(),
              "YYYY-MM-DD HH:mm:ss"
            );

            this.httpReq.post(
              "foodRetention/doPin",
              null,
              sendObj,
              (data: any) => {
                if (data["status"] == 200) {
                  if (data["code"] == 0) {
                    if (_.isObject(data["data"]) && !_.isEmpty(data["data"])) {
                      this.gloService.showMsg("销样成功", null, 2000);
                      console.error(backRefreshObj.backRefEvent);
                      if (_.isFunction(backRefreshObj.backRefEvent)) {
                        console.error("执行返回刷新事件");
                        backRefreshObj.backRefEvent(backRefreshObj.that); // 执行返回刷新事件
                      }

                      this.navCtrl.pop();
                      // this.formInfo = data["data"];
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
                } else {
                  this.gloService.showMsg("请求服务器出错", null, 2000);
                }
              }
            );
          }
        }
      ]
    });
    alert.present();
  }
}
