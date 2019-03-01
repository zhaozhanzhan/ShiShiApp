import { NgModule } from "@angular/core";
import { IonicPageModule, IonicModule } from "ionic-angular";
import { FindOldManPage } from "./find-old-man";

@NgModule({
  declarations: [FindOldManPage],
  imports: [IonicPageModule.forChild(FindOldManPage), IonicModule],
  exports: [FindOldManPage]
})
export class FindOldManPageModule {}
