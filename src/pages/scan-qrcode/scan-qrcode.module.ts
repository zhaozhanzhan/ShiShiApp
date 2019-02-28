import { NgModule } from "@angular/core";
import { IonicPageModule, IonicModule } from "ionic-angular";
import { ScanQrcodePage } from "./scan-qrcode";

@NgModule({
  declarations: [ScanQrcodePage],
  imports: [IonicPageModule.forChild(ScanQrcodePage), IonicModule],
  exports: [ScanQrcodePage]
})
export class ScanQrcodePageModule {}
