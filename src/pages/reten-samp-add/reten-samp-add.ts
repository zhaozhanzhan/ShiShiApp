import { Component, ViewChild } from "@angular/core";
import {
  AlertController,
  NavController,
  NavParams,
  ActionSheetController,
  Platform,
  MenuController,
  IonicPage,
  Content,
  ViewController
} from "ionic-angular";
import { Storage } from "@ionic/storage";
import _ from "underscore"; // 工具类
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { GlobalService } from "../../common/service/GlobalService";
import { JsUtilsService } from "../../common/service/JsUtils.Service";
import { GlobalMethod } from "../../common/service/GlobalMethod";
import { HttpReqService } from "../../common/service/HttpUtils.Service";
import { ParamService } from "../../common/service/Param.Service";
import { Camera, CameraOptions } from "@ionic-native/camera";
// import { FormValidService } from "../../common/service/FormValid.Service";

@IonicPage()
@Component({
  selector: "page-reten-samp-add",
  templateUrl: "reten-samp-add.html"
})
export class RetenSampAddPage {
  @ViewChild(Content)
  content: Content;

  public paramObj: any = null; // 传递过来的对象
  public formData: FormGroup; // 定义表单对象
  public imgBase64Arr: Array<string> = [""];
  public cameraIndex: any = null; // 当前点击图标索引值

  // public imgBase64: string = null; // 定义表单对象
  constructor(
    public navCtrl: NavController, // 导航控制器
    public viewCtrl: ViewController, // 视图控制器
    public navParams: NavParams, // 导航参数传递控制
    public menuCtrl: MenuController, // 侧边栏控制
    private jsUtil: JsUtilsService, // 自定义JS工具类
    private httpReq: HttpReqService, // Http请求服务
    private ionicStorage: Storage, // IonicStorage
    public camera: Camera, // 相机
    public gloService: GlobalService, // 全局自定义服务
    private fb: FormBuilder, // 响应式表单
    public actionSheetCtrl: ActionSheetController, // 操作表控制器
    public platform: Platform, // 获取平台信息
    public alertCtrl: AlertController // Alert消息弹出框
  ) {
    this.paramObj = this.navParams["data"];
    this.formData = this.fb.group({
      id: [""], // ID
      noteTaker: ["", [Validators.required]], // 留样时间
      createTime: ["", [Validators.required]], // 留样时间
      timeFrame: ["", [Validators.required]], // 时间段
      name: ["", [Validators.required]], // 名称
      reservedAmount: ["100(克)", [Validators.required]], // 留样量
      reservedPeople: ["", [Validators.required]] // 留样人
    });
    if (this.paramObj.state == "add") {
      this.ionicStorage.get("loginInfo").then(loginObj => {
        console.error("loginInfo", loginObj);
        if (!_.isNull(loginObj) && !_.isEmpty(loginObj)) {
          if (_.isString(loginObj.UserName) && loginObj.UserName.length > 0) {
            console.error(this.paramObj);
            GlobalMethod.setForm(this.formData, {
              noteTaker: loginObj.UserName
            });
          } else {
            this.gloService.showMsg("未获取到用户名", null, 3000);
            if (this.navCtrl.canGoBack()) {
              this.navCtrl.pop();
            }
          }
        } else {
          this.gloService.showMsg("未获取到用户名", null, 3000);
          if (this.navCtrl.canGoBack()) {
            this.navCtrl.pop();
          }
          return;
        }
      });
    } else if (this.paramObj.state == "edit") {
      const paramId = this.navParams.get("id"); // 修改数据时获取到的ID
      if (_.isString(paramId) && paramId.length > 0) {
        console.error("this.paramId", paramId);
        const sendObj = {
          id: paramId
        };
        this.httpReq.post(
          "foodRetention/findById",
          null,
          sendObj,
          (data: any) => {
            if (data["status"] == 200) {
              if (data["code"] == 0) {
                if (_.isObject(data["data"]) && !_.isEmpty(data["data"])) {
                  data["data"]["createTime"] = this.jsUtil.dateFormat(
                    data["data"]["createTime"],
                    "YYYY-MM-DDTHH:mm:ss"
                  );
                  GlobalMethod.setForm(this.formData, data["data"]);

                  if (
                    _.isString(data["data"]["reservedImg"]) &&
                    data["data"]["reservedImg"].length > 0
                  ) {
                    const imgUrlArr = data["data"]["reservedImg"].split(",");
                    for (let i = 0; i < imgUrlArr.length; i++) {
                      const imgArrL = this.imgBase64Arr.length; // 图片数组长度
                      this.imgBase64Arr.splice(imgArrL - 1, 0, imgUrlArr[i]);
                      // this.imgUrlToObj(imgUrlArr[i]).then(
                      //   (suc: any) => {
                      //     console.error(suc);
                      //     const imgArrL = this.imgBase64Arr.length; // 图片数组长度
                      //     this.imgBase64Arr.splice(imgArrL - 1, 0, suc);
                      //   },
                      //   err => {
                      //     console.error(err);
                      //   }
                      // );
                      // this.imgBase64Arr.splice(imgArrL - 1, 0, comprImgSuc);
                    }
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
  }

  ionViewDidLoad() {
    console.log("ionViewDidLoad RetenSampAddPage");
  }

  ionViewDidEnter() {
    //=================手机键盘遮住输入框处理 Begin=================//
    GlobalMethod.keyboardHandle(this.content);
    //=================手机键盘遮住输入框处理 End=================//
  }

  /**
   * 返回上一页
   * @memberof RetenSampAddPage
   */
  public backPrevPage() {
    let alert = this.alertCtrl.create({
      title: "提示",
      message: "是否退出编辑？",
      buttons: [
        {
          text: "取消",
          role: "cancel",
          handler: () => {}
        },
        {
          text: "确定",
          handler: () => {
            if (this.navCtrl.canGoBack()) {
              this.navCtrl.pop();
            } else {
              console.error("没有上一页");
              return;
            }
          }
        }
      ]
    });
    alert.present();
  }

  /**
   * 单击相机图标选择相册或拍照
   * @param {number} index 当前点击相机图标的索引值
   * @memberof RetenSampAddPage
   */
  public clickCamera(index: number) {
    this.cameraIndex = index; // 当前点击相机图标的索引值
    const actionSheet = this.actionSheetCtrl.create({
      title: "选择图片",
      buttons: [
        {
          text: "从相册中选择",
          handler: () => {
            this.getPicture(this.camera.PictureSourceType.PHOTOLIBRARY, index);
          }
        },
        {
          text: "使用相机",
          handler: () => {
            this.getPicture(this.camera.PictureSourceType.CAMERA, index);
          }
        },
        {
          text: "取消",
          role: "cancel",
          handler: () => {
            console.log("取消");
          }
        }
      ]
    });
    actionSheet.present();
  }

  /**
   * 获取图片
   * @param {number} sourceType 获取图片的方式 PHOTOLIBRARY：0，CAMERA：1
   * @param {number} idx 点击的图片索引
   * @memberof RegisterPage
   */
  public getPicture(sourceType: number, idx: number) {
    const options: CameraOptions = {
      quality: 50, // 图片质量范围为0-100。默认值为50
      destinationType: this.camera.DestinationType.DATA_URL, //返回的数据类型，默认DATA_URL
      // encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      sourceType: sourceType, // 设置图片的来源。在Camera.PictureSourceType中定义。默认是CAMERA。PHOTOLIBRARY：0，CAMERA：1，SAVEDPHOTOALBUM：2
      saveToPhotoAlbum: false, //是否保存拍摄的照片到相册中去
      correctOrientation: true //是否纠正拍摄的照片的方向
    };

    this.camera.getPicture(options).then(
      imageData => {
        console.error(imageData);
        let base64Image = "data:image/jpeg;base64," + imageData;
        const imgArrL = this.imgBase64Arr.length; // 图片数组长度
        if (idx == imgArrL - 1) {
          // 点击的添加图片图标
          if (imgArrL + 1 <= 7) {
            // 判定图片数组长度是否大于6
            this.imgBase64Arr.splice(imgArrL - 1, 0, base64Image);
          } else {
            this.gloService.showMsg("最多上传6张照片");
            return;
          }
        } else {
          // 点击的已有图片图标，替换图片
          this.imgBase64Arr.splice(idx, 1, base64Image);
        }
        // this.base64Img = 'data:image/jpeg;base64,' + imageData;
        /* const isAndroid = this.platform.is("android"); // 判断是否是安卓
        const isPhotoLib =
          sourceType === this.camera.PictureSourceType.PHOTOLIBRARY; // 判断是否是相册
        //===========安卓平台文件路径特殊处理 Begin===========//
        if (isAndroid && isPhotoLib) {
          //特别处理 android 平台的文件路径问题
          // Android相册
          this.filePath
            .resolveNativePath(imagePath) //获取 android 平台下的真实路径
            .then(filePath => {
              // 解析获取Android真实路径
              console.error(window);
              // 获取图片正确的路径;
              const correctPath = GlobalMethod.getFilePath(filePath);
              // 获取图片文件名和文件类型;
              const correctNameType = GlobalMethod.getFileNameAndType(
                imagePath
              );
              // 获取图片文件名;
              // const correctName = GlobalMethod.getFileName(filePath);
              // 获取图片文件类型;
              const correctType = GlobalMethod.getFileType(filePath);
              this.imgArr[this.cameraIndex]["fileType"] = correctType; // 文件类型扩展名
              this.copyFileToLocalDir(
                correctPath,
                correctNameType,
                this.createFileName(correctType)
              );
              // this.uploadImg(correctPath + correctNameType, correctNameType);
            });
        } else {
          // 非安卓Android平台及相册
          console.error(window);
          // 获取图片正确的路径;
          const correctPath = GlobalMethod.getFilePath(imagePath);
          // 获取图片文件名和文件类型;
          const correctNameType = GlobalMethod.getFileNameAndType(imagePath);
          // 获取图片文件名;
          // const correctName = GlobalMethod.getFileName(imagePath);
          // 获取图片文件类型;
          const correctType = GlobalMethod.getFileType(imagePath);
          this.imgArr[this.cameraIndex]["fileType"] = correctType; // 文件类型扩展名
          this.copyFileToLocalDir(
            correctPath,
            correctNameType,
            this.createFileName(correctType)
          );
          // this.uploadImg(correctPath + correctNameType, correctNameType);
        } */

        //===========安卓平台文件路径特殊处理 End===========//
      },
      err => {
        console.log(err);
        this.gloService.showMsg("未获取到图片或图片格式不支持", null, 3000);
      }
    );
  }

  /**
   * 读取图片文件对象
   * @param {Blob} fileBlob
   * @returns
   * @memberof RetenSampAddPage
   */
  public readImg(fileBlob: Blob) {
    return new Promise((resolve, reject) => {
      if (fileBlob instanceof Blob) {
        const fileRead = new FileReader(); // 文件读取对象
        // readAsDataURL(blob)该方法会读取指定的Blob或File对象.读取完成,readyState会变成已完成(DONE),
        // 并触发loadend事件,同时result属性将包含一个data:URL格式的字符串(base64编码)以表示文件的内容
        fileRead.readAsDataURL(fileBlob);
        fileRead.addEventListener("load", e => {
          const image = new Image();
          image.src = e.target["result"]; // base64就是图片的转换的结果
          resolve(image);
        });
      } else {
        const errObj: any = {
          errMsg: "读取文件对象出错"
        };
        reject(errObj);
      }
    });
  }

  /**
   * 压缩图片
   * @param {*} img
   * @memberof RetenSampAddPage
   */
  public comprImg(img: any) {
    return new Promise((resolve, reject) => {
      img.addEventListener(
        "load",
        () => {
          console.error("执行图片加载完成事件");
          console.error("height", img.height);
          console.error("width", img.width);
          let expectWidth: number = img.width;
          let expectHeight: number = img.height;

          if (img.width > img.height && img.height > 2000) {
            expectWidth = 2000;
            expectHeight = (expectWidth * img.height) / img.width;
          } else if (img.height > img.width && img.height > 2000) {
            expectHeight = 2000;
            expectWidth = (expectHeight * img.width) / img.height;
          }
          console.error("height", expectHeight);
          console.error("width", expectWidth);
          const canvas = document.createElement("canvas"); // createElement()方法通过指定名称创建一个元素
          const ctx = canvas.getContext("2d"); // getContext()方法返回一个用于在画布上绘图的环境。
          canvas.width = expectWidth; // 设置画布的宽度
          canvas.height = expectHeight; // 设置画布的高度
          // drawImage()方法在画布上绘制图像、画布或视频,也能够绘制图像的某些部分,以及/或者增加或减少图像的尺寸。
          ctx.drawImage(img, 0, 0, expectWidth, expectHeight); // http://www.w3school.com.cn/html5/canvas_drawimage.asp
          let base64: string = null;
          base64 = canvas.toDataURL("image/jpeg", 0.7); // toDataURL()方法返回一个包含图片展示的data URI.可以使用type参数其类型,默认为PNG格式
          if (!_.isNull(base64)) {
            resolve(base64);
          } else {
            const errObj: any = {
              errMsg: "转换压缩图片对象失败"
            };
            reject(errObj);
          }
        },
        false
      );
    });
  }

  /**
   * 添加或改变图片
   * @param {Event} ev
   * @param {number} idx
   * @memberof RetenSampAddPage
   */
  public selImg(ev: Event, idx: number) {
    console.error(ev["target"]["files"]);
    let fileBlob = ev["target"]["files"][0];

    // 读取图片文件对象
    this.readImg(fileBlob).then(
      readSuc => {
        // 压缩图片
        this.comprImg(readSuc).then(
          (comprImgSuc: any) => {
            const imgArrL = this.imgBase64Arr.length; // 图片数组长度
            if (idx == imgArrL - 1) {
              // 点击的添加图片图标
              if (imgArrL + 1 <= 7) {
                // 判定图片数组长度是否大于6
                this.imgBase64Arr.splice(imgArrL - 1, 0, comprImgSuc);
              } else {
                this.gloService.showMsg("最多上传6张照片");
                return;
              }
            } else {
              // 点击的已有图片图标，替换图片
              this.imgBase64Arr.splice(idx, 1, comprImgSuc);
            }
            // this.imgBase64 = comprImgSuc; // base64就是图片的转换的结果
          },
          (comprImgErr: any) => {
            this.gloService.showMsg(comprImgErr.errMsg);
          }
        );
      },
      readErr => {
        this.gloService.showMsg(readErr.errMsg);
      }
    );
  }

  /**
   * 删除图片
   * @param {Event} ev
   * @param {number} idx
   * @memberof RetenSampAddPage
   */
  public delImg(ev: Event, idx: number) {
    if (ev instanceof Event) {
      ev.stopPropagation();
    }

    let alert = this.alertCtrl.create({
      title: "提示",
      message: "确认删除选择的图片？",
      buttons: [
        {
          text: "取消",
          role: "cancel",
          handler: () => {}
        },
        {
          text: "确定",
          handler: () => {
            this.imgBase64Arr.splice(idx, 1);
          }
        }
      ]
    });
    alert.present();
  }

  /**
   * 上传图片
   * @param {Array<string>} imgArr base64图片数组
   * @memberof RetenSampAddPage
   */
  public imgUpload(imgArr: Array<string>) {
    return new Promise((resolve, reject) => {
      const imgUploading = this.gloService.showLoading("正上传图片，请稍候...");
      this.httpReq.post("image/saveMoreUrl", null, imgArr, (data: any) => {
        if (data["status"] == 200) {
          if (data["code"] == 0) {
            // this.gloService.showMsg("提交成功", null, 3000);
            imgUploading.dismiss();
            resolve(data["data"]);
            // this.navCtrl.pop();
            // this.navCtrl.push("MyTaskPage", { selfOpenOrder: true });
          } else {
            imgUploading.dismiss();
            this.gloService.showMsg(data["message"], null, 3000);
            reject();
          }
        } else {
          imgUploading.dismiss();
          this.gloService.showMsg("请求服务器出错", null, 3000);
          reject();
        }
      });
    });
  }

  /**
   * 将图片转换为base64
   * @param {*} imgObj
   * @returns 返回base64图片编码
   * @memberof RetenSampAddPage
   */
  public getBase64Image(imgObj: any) {
    const canvas = document.createElement("canvas"); // createElement()方法通过指定名称创建一个元素
    const ctx = canvas.getContext("2d"); // getContext()方法返回一个用于在画布上绘图的环境。
    canvas.width = imgObj.width; // 设置画布的宽度
    canvas.height = imgObj.height; // 设置画布的高度
    // drawImage()方法在画布上绘制图像、画布或视频,也能够绘制图像的某些部分,以及/或者增加或减少图像的尺寸。
    ctx.drawImage(imgObj, 0, 0, imgObj.width, imgObj.height); // http://www.w3school.com.cn/html5/canvas_drawimage.asp
    let dataURL: string = null;
    console.error(canvas);
    dataURL = canvas.toDataURL("image/jpeg", 1); // toDataURL()方法返回一个包含图片展示的data URI.可以使用type参数其类型,默认为PNG格式
    return dataURL;
    // canvas.width = imgObj.width;
    // canvas.height = imgObj.height;
    // const ctx = canvas.getContext("2d");
    // ctx.drawImage(imgObj, 0, 0, imgObj.width, imgObj.height);
    // const ext = imgObj.src
    //   .substring(imgObj.src.lastIndexOf(".") + 1)
    //   .toLowerCase();
    // const dataURL = canvas.toDataURL("image/jpeg" + ext);
  }

  /**
   * 该方法未使用，需后台解决跨域
   * 将图片URL转换成图片实体对象
   * @param {string} imgUrl 图片URL地址
   * @memberof RetenSampAddPage
   */
  public imgUrlToObj(imgUrl: string) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      console.error(imgUrl);
      image.src = imgUrl + "?v=" + Math.random(); // 处理缓存
      image.crossOrigin = "*"; // 支持跨域图片
      image.addEventListener("load", e => {
        const base64 = this.getBase64Image(image);
        if (!_.isNull(base64)) {
          resolve(base64);
        } else {
          const errObj: any = {
            errMsg: "转换图片对象失败"
          };
          reject(errObj);
        }
      });
    });
  }

  /**
   * 请求保存数据
   * @param {string} state 请求状态
   * @param {*} formData
   * @memberof RetenSampAddPage
   */
  public reqSaveData(state: string, formData: any) {
    let url = null;
    if (state == "add") {
      url = "foodRetention/save";
    } else {
      url = "foodRetention/edit";
    }

    return new Promise((resolve, reject) => {
      const loading = this.gloService.showLoading("正在提交，请稍候...");
      this.httpReq.post(url, null, formData, (data: any) => {
        if (data["status"] == 200) {
          if (data["code"] == 0) {
            // this.gloService.showMsg("提交成功", null, 3000);
            loading.dismiss();
            resolve();
            // this.navCtrl.pop();
            // this.navCtrl.push("MyTaskPage", { selfOpenOrder: true });
          } else {
            loading.dismiss();
            this.gloService.showMsg(data["message"], null, 3000);
            reject();
          }
        } else {
          loading.dismiss();
          this.gloService.showMsg("请求服务器出错", null, 3000);
          reject();
        }
      });
    });
  }

  /**
   * 保存表单数据
   * @memberof RetenSampAddPage
   */
  public saveForm() {
    console.error("this.formData:", this.formData);
    console.error("this.formData.value:", this.formData.value);
    // console.error("this.selCityStr:", this.selCityStr);
    const formDataCtrl = this.formData.controls;
    const formData = this.jsUtil.deepClone(this.formData.value); // 深度拷贝表单数据
    for (const i in formDataCtrl) {
      // 较验整个表单标记非法字段
      formDataCtrl[i].markAsDirty();
      formDataCtrl[i].updateValueAndValidity();
    }

    if (this.formData.invalid) {
      // 表单较验未通过
      return;
    }

    formData.createTime = this.jsUtil.dateFormat(
      formData.createTime,
      "YYYY-MM-DD HH:mm:ss"
    );

    const backRefreshObj = ParamService.getParamObj();

    if (this.paramObj.state == "add") {
      console.error("formData:", formData);
      // return;
    } else if (this.paramObj.state == "edit") {
      console.error("formData:", formData);
      // return;
    }
    const imgBase64L = this.imgBase64Arr.length;
    console.error(this.imgBase64Arr);

    if (imgBase64L > 1) {
      // 有图片
      const copyImgBase64Arr = this.jsUtil.deepClone(this.imgBase64Arr);
      const imgRegExp = /^data:image\/(jpeg|png|gif);base64,/;
      const httpUrl: Array<string> = [];
      const base64Url: Array<string> = [];
      for (let i = 0; i < copyImgBase64Arr.length; i++) {
        if (imgRegExp.test(copyImgBase64Arr[i])) {
          base64Url.push(copyImgBase64Arr[i]);
        } else {
          if (
            _.isString(copyImgBase64Arr[i]) &&
            copyImgBase64Arr[i].length > 0
          ) {
            httpUrl.push(copyImgBase64Arr[i]);
          }
        }
      }
      console.log(httpUrl);
      console.log(base64Url);
      // return;
      // copyImgBase64Arr.splice(imgBase64L - 1, 1);
      if (base64Url.length > 0) {
        // 添加了新的base64图片
        console.error("添加了新的base64图片");
        const sendImgArr: any = {
          base64: base64Url
        };
        this.imgUpload(sendImgArr).then(
          (uploadSuc: any) => {
            const newImgArr = httpUrl.concat(uploadSuc); // 合并新的图片url数组
            const imgArrStr = newImgArr.join(","); // 拼接图片url数组为字符串
            console.error("imgArrStr", imgArrStr);
            formData.reservedImg = imgArrStr;
            this.reqSaveData(this.paramObj.state, formData).then(
              saveSuc => {
                // 保存成功
                console.error("保存成功", saveSuc);

                console.error(backRefreshObj.backRefEvent);
                if (_.isFunction(backRefreshObj.backRefEvent)) {
                  console.error("执行返回刷新事件");
                  backRefreshObj.backRefEvent(backRefreshObj.that); // 执行返回刷新事件
                }

                this.navCtrl.pop();
              },
              saveErr => {
                // 保存失败
                console.error("保存失败", saveErr);
              }
            );
          },
          uploadErr => {
            console.error("上传图片失败", uploadErr);
          }
        );
      } else {
        // 未添加新的base64图片
        console.error("未添加新的base64图片");
        const newImgArr = httpUrl.concat([]); // 合并新的图片url数组
        const imgArrStr = newImgArr.join(","); // 拼接图片url数组为字符串
        console.error("imgArrStr", imgArrStr);
        formData.reservedImg = imgArrStr;
        this.reqSaveData(this.paramObj.state, formData).then(
          saveSuc => {
            // 保存成功
            console.error("保存成功", saveSuc);

            console.error(backRefreshObj.backRefEvent);
            if (_.isFunction(backRefreshObj.backRefEvent)) {
              console.error("执行返回刷新事件");
              backRefreshObj.backRefEvent(backRefreshObj.that); // 执行返回刷新事件
            }

            this.navCtrl.pop();
          },
          saveErr => {
            // 保存失败
            console.error("保存失败", saveErr);
          }
        );
      }
    } else {
      // 没有图片
      this.reqSaveData(this.paramObj.state, formData).then(
        saveSuc => {
          // 保存成功
          console.error("保存成功", saveSuc);
          console.error(backRefreshObj.backRefEvent);
          if (_.isFunction(backRefreshObj.backRefEvent)) {
            console.error("执行返回刷新事件");
            backRefreshObj.backRefEvent(backRefreshObj.that); // 执行返回刷新事件
          }

          this.navCtrl.pop();
        },
        saveErr => {
          // 保存失败
          console.error("保存失败", saveErr);
        }
      );
    }
  }
}
