import { NgModule } from "@angular/core";
import { IonicPageModule, IonicModule } from "ionic-angular";
import { RetenSampDetailPage } from "./reten-samp-detail";

@NgModule({
  declarations: [RetenSampDetailPage],
  imports: [IonicPageModule.forChild(RetenSampDetailPage), IonicModule],
  exports: [RetenSampDetailPage]
})
export class RetenSampDetailPageModule {}
