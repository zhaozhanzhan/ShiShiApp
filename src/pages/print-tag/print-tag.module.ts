import { NgModule } from "@angular/core";
import { IonicPageModule, IonicModule } from "ionic-angular";
import { PipesModule } from "../../common/pipe/pipes.module";
import { PrintTagPage } from "./print-tag";

@NgModule({
  declarations: [PrintTagPage],
  imports: [IonicPageModule.forChild(PrintTagPage), IonicModule, PipesModule],
  exports: [PrintTagPage]
})
export class PrintTagPageModule {}
