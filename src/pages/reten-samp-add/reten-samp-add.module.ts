import { NgModule } from "@angular/core";
import { IonicPageModule, IonicModule } from "ionic-angular";
import { RetenSampAddPage } from "./reten-samp-add";

@NgModule({
  declarations: [RetenSampAddPage],
  imports: [IonicPageModule.forChild(RetenSampAddPage), IonicModule],
  exports: [RetenSampAddPage]
})
export class RetenSampAddPageModule {}
