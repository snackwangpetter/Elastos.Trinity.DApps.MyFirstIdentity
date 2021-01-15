import { Component } from '@angular/core';
import { HiveService } from 'src/app/services/hive.service';
import { PersistenceService } from 'src/app/services/persistence.service';

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-exportmnemonic',
  templateUrl: 'exportmnemonic.html',
  styleUrls: ['exportmnemonic.scss']
})
export class ExportMnemonicPage {
  constructor(private hiveService: HiveService, private persistence: PersistenceService) {}

  ionViewDidEnter() {
    appManager.setVisible("show");
    titleBarManager.setTitle("Forbidden");
    titleBarManager.setNavigationMode(TitleBarPlugin.TitleBarNavigationMode.CLOSE);
  }
}
