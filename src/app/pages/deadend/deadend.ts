import { Component } from '@angular/core';
import { HiveService } from 'src/app/services/hive.service';
import { IdentityService } from 'src/app/services/identity.service';
import { PersistenceService } from 'src/app/services/persistence.service';
import { StorageService } from 'src/app/services/storage.service';
import { TranslateService } from '@ngx-translate/core';

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-deadend',
  templateUrl: 'deadend.html',
  styleUrls: ['deadend.scss']
})
export class DeadEndPage {
  constructor(
    private hiveService: HiveService,
    private persistence: PersistenceService,
    private identityService: IdentityService,
    private storage: StorageService,
    public translate: TranslateService
  ) {}

  async ionViewDidEnter() {
    appManager.setVisible("show");
    titleBarManager.setTitle(this.translate.instant('deadend.titlebar-title'));
    titleBarManager.setNavigationMode(TitleBarPlugin.TitleBarNavigationMode.CLOSE);

    let settingProfile = await this.storage.get('profile');
    let storageProfile = await this.storage.getProfile();
    console.log('setting profile', settingProfile.name, settingProfile.email);
    console.log('storage profile', storageProfile.name, storageProfile.email);
  }

  public async debugRevokeHiveAuth() {
    this.identityService.resetOnGoingProcess();
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
