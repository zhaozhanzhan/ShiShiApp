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
  App
} from "ionic-angular";
import _ from "underscore"; // 工具类
import { GlobalService } from "../../common/service/GlobalService";
import { HttpReqService } from "../../common/service/HttpUtils.Service";
import { Local } from "../../common/service/Storage";
import { BLE } from "@ionic-native/ble"; // 蓝牙插件
import { AndroidPermissions } from "@ionic-native/android-permissions";

// import { FormBuilder } from "@angular/forms";
// import { Storage } from "@ionic/storage";
// import { JsUtilsService } from "../../common/service/JsUtils.Service";
// import { FormValidService } from "../../common/service/FormValid.Service";
// import { GlobalMethod } from "../../common/service/GlobalMethod";
// import { ParamService } from "../../common/service/Param.Service";
declare const cordova: any;

@IonicPage()
@Component({
  selector: "page-print-tag",
  templateUrl: "print-tag.html"
})
export class PrintTagPage {
  public paramId: string = null; // 传递过来的参数ID
  public formInfo: any = null; // 数据对象
  public isShowBox: boolean = false; // 是否显示弹出框
  public isScaning: boolean = false; // 是否正在扫描
  public isBleOpen: boolean = false; // 蓝牙是否开启状态
  public isConnected: boolean = false; // 打印机连接状态
  public bleDevMac: string = null; // 蓝牙设备Mac地址
  public bleDevName: string = null; // 蓝牙设备名称
  public interTimer: any = null; // 定时器
  public bleObjArr: Array<any> = []; // 蓝牙对象列表数组
  public platformStr: string = null;

  constructor(
    // private jsUtil: JsUtilsService, // 自定义JS工具类
    // private ionicStorage: Storage, // IonicStorage
    // private fb: FormBuilder, // 响应式表单
    public app: App,
    public httpReq: HttpReqService, // Http请求服务
    public navCtrl: NavController, // 导航控制器
    public viewCtrl: ViewController, // 视图控制器
    public navParams: NavParams, // 导航参数传递控制
    public andPerm: AndroidPermissions, // Android权限控制
    public menuCtrl: MenuController, // 侧边栏控制
    public gloService: GlobalService, // 全局自定义服务
    public actionSheetCtrl: ActionSheetController, // 操作表控制器
    public platform: Platform, // 获取平台信息
    public ble: BLE, // 蓝牙插件
    public alertCtrl: AlertController // Alert消息弹出框
  ) {
    this.paramId = this.navParams.get("id"); // 获取详情数据时需要的ID
    this.platformStr = this.gloService.getPlatform();
    console.error("传递过来的参数ID", this.paramId);
  }

  ionViewDidLoad() {
    console.log("ionViewDidLoad PrintTagPage");
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
                this.getPositPermi().then(
                  getSuc => {
                    this.checkBleIsOpen().then(
                      openSuc => {
                        const devInfo: any = Local.getObj("devInfo"); // 获取存储的蓝牙设备信息
                        if (_.isObject(devInfo) && !_.isEmpty(devInfo)) {
                          this.bleDevName = devInfo.name;
                          this.bleDevMac = devInfo.address;

                          this.conGetState(devInfo.name, devInfo.address).then(
                            (getSuc: any) => {
                              this.isConnected = true;
                              this.bleDevName = getSuc.name; // 设备名称
                              this.bleDevMac = getSuc.address; // 设备地址
                              const devInfo: any = {};
                              devInfo.name = getSuc.name;
                              devInfo.address = getSuc.address;
                              Local.setObj("devInfo", devInfo); // 保存打印设备名称和 Mac 地址
                            },
                            getErr => {
                              this.isConnected = false;
                              this.gloService.showMsg("连接匹配打印设备失败");
                            }
                          );
                        } else {
                          this.scanDevice();
                        }
                      },
                      openErr => {}
                    );
                  },
                  getErr => {}
                );
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

  ionViewDidEnter() {}

  ionViewWillUnload() {
    this.closeConnect(); // 关闭连接
  }

  /**
   * 获取位置权限，安卓6.0以后使用蓝牙必须要的权限
   * @memberof PrintTagPage
   */
  public getPositPermi() {
    return new Promise((resolve, reject) => {
      if (this.platformStr == "android") {
        const posPerm = this.andPerm.PERMISSION.ACCESS_FINE_LOCATION; // 安卓位置权限
        this.andPerm.checkPermission(posPerm).then(
          (result: any) => {
            const isPerm = result.hasPermission;
            if (!isPerm) {
              this.andPerm.requestPermission(posPerm).then(
                (getSuc: any) => {
                  resolve();
                },
                (getErr: any) => {
                  this.gloService.showMsg("获取位置权限失败，请开启应用权限");
                  reject();
                }
              );
            } else {
              resolve();
            }
          },
          (err: any) => {
            this.andPerm.requestPermission(posPerm).then(
              (getSuc: any) => {
                resolve();
              },
              (getErr: any) => {
                this.gloService.showMsg("获取位置权限失败，请开启应用权限");
                reject();
              }
            );
          }
        );
      } else {
        reject();
      }
    });
  }

  /**
   * 检查蓝牙是否开启
   * @returns
   * @memberof PrintTagPage
   */
  public checkBleIsOpen() {
    return new Promise((resolve, reject) => {
      if (this.platformStr == "android") {
        cordova["plugins"]["qiruiPrint"].checkBleEnable(
          (success: any) => {
            console.error(JSON.stringify(success));
            if (success.isEnabled) {
              this.isBleOpen = true; // 蓝牙已开启
              resolve();
              // this.scanDevice();
            } else {
              this.openBle().then(
                (openSuc: any) => {
                  console.error("开启蓝牙成功");
                  // resObj.state = true;
                  // resObj.msg = "蓝牙开启成功！";
                  this.isBleOpen = openSuc.state;
                  this.gloService.showMsg(openSuc.msg);
                  resolve();
                },
                (openErr: any) => {
                  console.error("开启蓝牙失败");
                  this.isBleOpen = openErr.state;
                  this.gloService.showMsg(openErr.msg);
                  reject();
                }
              );
            }
          },
          (error: any) => {
            console.error(error);
            reject();
          }
        );
      } else {
        reject();
      }
    });
  }

  /**
   * 开启蓝牙
   * @memberof PrintTagPage
   */
  public openBle() {
    return new Promise((resolve, reject) => {
      const manual = this.alertCtrl.create({
        title: "提示",
        message: "开启蓝牙失败，请前往手动开启！",
        buttons: [
          {
            text: "不开启",
            handler: () => {
              const resObj: any = {};
              resObj.state = false;
              resObj.msg = "蓝牙开启失败！";
              reject(resObj);
            }
          },
          {
            text: "前往开启",
            handler: () => {
              this.ble.showBluetoothSettings().then(
                openSuc => {
                  console.error("打开蓝牙设置成功", openSuc);
                  this.scanDevice();
                },
                openErr => {
                  console.error("打开蓝牙设置失败", openErr);
                  const resObj: any = {};
                  resObj.state = false;
                  resObj.msg = "蓝牙开启失败！";
                  reject(resObj);
                }
              );
            }
          }
        ]
      });
      const confirm = this.alertCtrl.create({
        title: "提示",
        message: "检测到蓝牙未开启，是否开启？",
        buttons: [
          {
            text: "否",
            handler: () => {
              const resObj: any = {};
              resObj.state = false;
              resObj.msg = "蓝牙未开启！";
              reject(resObj);
            }
          },
          {
            text: "是",
            handler: () => {
              this.ble.enable().then(
                (enaSuc: any) => {
                  console.error("开启蓝牙成功", enaSuc);
                  const resObj: any = {};
                  resObj.state = true;
                  resObj.msg = "蓝牙开启成功！";
                  resolve(resObj);
                },
                (enaErr: any) => {
                  console.error("开启蓝牙失败", enaErr);
                  if (enaErr == "User did not enable Bluetooth") {
                    const resObj: any = {};
                    resObj.state = false;
                    resObj.msg = "蓝牙开启失败！";
                    reject(resObj);
                  } else {
                    manual.present();
                  }
                }
              );
            }
          }
        ]
      });
      confirm.present();
    });
  }

  /**
   * 切换是否显示弹出框
   * @memberof PrintTagPage
   */
  public toggleShowBox() {
    this.isShowBox = !this.isShowBox;
  }

  /**
   * 扫描设备
   * @memberof PrintTagPage
   */
  public scanDevice(ev?: Event) {
    if (ev) {
      ev.stopPropagation();
    }
    this.isScaning = true; // 正在扫描
    this.isShowBox = true; // 显示弹出框
    this.bleObjArr = []; // 清空扫描到的设备
    // this.ble.scan([], 5).subscribe(
    //   device => {
    //     console.error("扫描成功的数据", device);
    //     this.bleObjArr.push(device);
    //     console.log(JSON.stringify(device));
    //   },
    //   error => {
    //     console.error("扫描失败的数据", error);
    //     console.log(error);
    //   }
    // );
    const bleObjArr: Array<any> = [];
    console.error("==========开始进行蓝牙扫描操作========");
    if (this.platformStr == "android") {
      cordova["plugins"]["qiruiPrint"].doDiscovery(
        (device: any) => {
          console.error(
            "==========扫描到设备========：" + JSON.stringify(device)
          );
          bleObjArr.push(device);
        },
        (error: any) => {
          console.error(error);
        }
      );
      setTimeout(() => {
        this.bleObjArr = bleObjArr;
        this.cancelScanDevice().then(
          canSuc => {
            this.isScaning = false; // 扫描状态停止
          },
          canErr => {
            this.isScaning = true; // 扫描状态停止
            this.gloService.showMsg("关闭扫描失败");
          }
        );
      }, 5000);
    }
  }

  /**
   * 终止扫描操作
   */
  public cancelScanDevice() {
    return new Promise((resolve, reject) => {
      if (this.platformStr == "android") {
        cordova["plugins"]["qiruiPrint"].cancelDiscovery(
          (success: any) => {
            console.error("==========终止扫描成功！========");
            resolve();
          },
          (error: any) => {
            console.error("==========终止扫描失败！========");
            reject();
          }
        );
      } else {
        reject();
      }
    });
  }

  /**
   * 连接并获取连接状态，成功后获取返回打印机名称和mac地址,
   * @param {String} [name]
   * @param {String} [mac]
   * @memberof PrintTagPage
   */
  public conGetState(name?: String, mac?: String) {
    return new Promise((resolve, reject) => {
      const loading = this.gloService.showLoading("正在连接打印机，请稍候...");
      const cusTimer: any = setTimeout(() => {
        let rootNav = this.app.getRootNavs()[0]; // 获取根导航
        let ionicApp = rootNav._app._appRoot;
        let activePortal = ionicApp._overlayPortal.getActive();
        if (activePortal) {
          loading.dismiss();
          this.isConnected = false; // 蓝牙未连接
          this.gloService.showMsg("连接蓝牙设备失败，请重新选择设备！");
        }
      }, 10000);

      // 连接打印机
      if (this.platformStr == "android") {
        cordova["plugins"]["qiruiPrint"].connectPrinter(
          name,
          mac,
          (success: any) => {
            console.error("==========开始连接打印机========" + name);
          },
          (error: any) => {
            console.error("==========终止扫描失败！========");
          }
        );

        // 通知打印机连接状态
        cordova["plugins"]["qiruiPrint"].notifyConnectState(
          (device: any) => {
            if (
              (_.isString(device.name) && device.name.length == 0) ||
              (_.isString(device.address) && device.address.length == 0)
            ) {
              console.error("==========连接打印机失败！========");
              console.error(
                "==========this.isConnected========",
                this.isConnected
              );
              loading.dismiss();
              window.clearTimeout(cusTimer);
              reject();
            } else {
              console.error("==========已经连接打印机========" + device.name);
              console.error(
                "==========已经连接打印机========" + device.address
              );
              console.error(
                "==========this.isConnected========",
                this.isConnected
              );
              loading.dismiss();
              window.clearTimeout(cusTimer);
              resolve(device);
            }
          },
          (error: any) => {
            console.error("==========连接打印机失败！========");
            console.error(
              "==========this.isConnected========",
              this.isConnected
            );
            loading.dismiss();
            window.clearTimeout(cusTimer);
            reject();
          }
        );
      } else {
        reject();
      }
    });
  }

  /**
   * 关闭蓝牙打印机连接
   * @memberof PrintTagPage
   */
  public closeConnect() {
    return new Promise((resolve, reject) => {
      if (this.platformStr == "android") {
        cordova["plugins"]["qiruiPrint"].cancelPrinterServe(
          (closeSuc: any) => {
            console.error("断开蓝牙连接成功");
            this.isConnected = false;
            // const devInfo: any = {};
            // Local.setObj("devInfo", devInfo); // 保存打印设备名称和 Mac 地址
            resolve();
          },
          (closeErr: any) => {
            console.error("断开蓝牙连接失败");
            this.isConnected = true;
            reject();
          }
        );
      } else {
        reject();
      }
    });
  }

  /**
   * 连接蓝牙打印机操作
   * @memberof PrintTagPage
   */
  public clickConnect(name?: String, mac?: String) {
    if (!this.isBleOpen) {
      this.gloService.showMsg("蓝牙未开启");
      this.openBle().then(
        (openSuc: any) => {
          console.error("开启蓝牙成功");
          // resObj.state = true;
          // resObj.msg = "蓝牙开启成功！";
          this.isBleOpen = openSuc.state;
          this.gloService.showMsg(openSuc.msg);
          this.scanDevice(); // 扫描成功
        },
        (openErr: any) => {
          console.error("开启蓝牙失败");
          this.isBleOpen = openErr.state;
          this.gloService.showMsg(openErr.msg);
        }
      );
      return;
    }

    if (name && mac) {
      this.conGetState(name, mac).then(
        (getSuc: any) => {
          this.isConnected = true;
          this.bleDevName = getSuc.name; // 设备名称
          this.bleDevMac = getSuc.address; // 设备地址
          const devInfo: any = {};
          devInfo.name = getSuc.name;
          devInfo.address = getSuc.address;
          Local.setObj("devInfo", devInfo); // 保存打印设备名称和 Mac 地址
        },
        getErr => {
          this.isConnected = false;
          this.gloService.showMsg("连接匹配打印设备失败");
        }
      );
    } else {
      console.error(name);
      console.error(mac);
      if (_.isUndefined(name) && _.isUndefined(mac)) {
        if (!this.isConnected) {
          this.scanDevice();
        }
      } else if (_.isUndefined(name) || _.isUndefined(mac)) {
        this.gloService.showMsg("未知设备,请重新选择");
        return;
      }
    }
  }

  /**
   * 打印内容
   */
  public printContent() {
    let outPutContent = {
      setup: {
        pageWidth: 586,
        pageHeight: 357
      },
      drawBox: [
        {
          lineWidth: 2,
          top_left_x: 0,
          top_left_y: 0,
          bottom_right_x: 564,
          bottom_right_y: 340
        }
      ],
      drawText: [
        {
          text_x: 200,
          text_y: 26,
          width: 586,
          height: 33,
          text: "食品留样标签",
          fontSize: 3,
          rotate: 0,
          bold: 0,
          underline: false,
          reverse: false
        },
        {
          text_x: 12,
          text_y: 70,
          width: 348,
          height: 33,
          text: "留样时间：" + this.formInfo.createTime,
          fontSize: 3,
          rotate: 0,
          bold: 0,
          underline: false,
          reverse: false
        },
        {
          text_x: 12,
          text_y: 115,
          width: 586,
          height: 33,
          text: "留样餐别：" + this.formInfo.timeFrame + "餐",
          fontSize: 3,
          rotate: 0,
          bold: 0,
          underline: false,
          reverse: false
        },
        {
          text_x: 12,
          text_y: 160,
          width: 348,
          height: 33,
          text: "留样品名：" + this.formInfo.name,
          fontSize: 3,
          rotate: 0,
          bold: 0,
          underline: false,
          reverse: false
        },
        {
          text_x: 12,
          text_y: 210,
          width: 348,
          height: 33,
          text: "留样人：" + this.formInfo.reservedPeople,
          fontSize: 3,
          rotate: 0,
          bold: 0,
          underline: false,
          reverse: false
        },
        {
          text_x: 200,
          text_y: 300,
          width: 348,
          height: 33,
          text: "常熟市敬老院",
          fontSize: 2,
          rotate: 0,
          bold: 0,
          underline: false,
          reverse: false
        }
      ],
      drawBarCode: [],
      drawQrCode: [
        {
          start_x: 410,
          start_y: 130,
          text: this.formInfo.id,
          rotate: 0,
          ver: 5,
          lel: 2
        }
      ],
      print: {
        horizontal: 0,
        skip: 1
      }
    };
    cordova["plugins"]["qiruiPrint"].printContent(
      JSON.stringify(outPutContent),
      (success: any) => {
        console.error("==========打印成功========");
      },
      (error: any) => {
        console.error("==========打印失败========");
      }
    );
  }
}
