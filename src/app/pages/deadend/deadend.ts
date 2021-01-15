import { Component } from '@angular/core';
import { HiveService } from 'src/app/services/hive.service';
import { PersistenceService } from 'src/app/services/persistence.service';

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-deadend',
  templateUrl: 'deadend.html',
  styleUrls: ['deadend.scss']
})
export class DeadEndPage {
  constructor(private hiveService: HiveService, private persistence: PersistenceService) {}

  ionViewDidEnter() {
    appManager.setVisible("show");
    titleBarManager.setTitle("Forbidden");
    titleBarManager.setNavigationMode(TitleBarPlugin.TitleBarNavigationMode.CLOSE);
  }

  public async debugRevokeHiveAuth() {
    let vault = await this.hiveService.getUserVault();
    vault.revokeAccessToken();

    appManager.setSetting("dappsdk_appinstancedidstoreid", null);
    appManager.setSetting("dappsdk_appinstancedidstring", null);
    appManager.setSetting("dappsdk_appinstancedidstorepassword", null);
  }

  public async debugCallVaultAPI() {
    let persistentInfo = this.persistence.getPersistentInfo();
    console.log("User DID:",persistentInfo.did.didString);

    console.log("Getting user vault");
    // Force creating a new client otherwise the hive SDK is messed up with DID documents
    // and JWTs (JWT parse error - did document doesn't match the JWT signature)
    let vault = await this.hiveService.getUserVault(true);
    console.log("Getting active plan");
    let plan = await vault.getPayment().getActivePricingPlan();
    console.log("Done", plan);
  }
}
