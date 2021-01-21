import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DIDPublicationStatus } from 'src/app/model/didpublicationstatus.model';
import { PersistentInfo } from 'src/app/model/persistentinfo.model';
import { DAppService } from 'src/app/services/dapp.service';
import { HiveService } from 'src/app/services/hive.service';
import { IdentityService } from 'src/app/services/identity.service';
import { PersistenceService } from 'src/app/services/persistence.service';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-manageidentity',
  templateUrl: 'manageidentity.html',
  styleUrls: ['manageidentity.scss']
})
export class ManageIdentityPage {
  constructor(
    public navCtrl: NavController,
    public dappService: DAppService,
    private identityService: IdentityService,
    private hiveService: HiveService,
    private persistence: PersistenceService,
    public theme: ThemeService,
    public translate: TranslateService
  ) {
  }

  ionViewDidEnter() {
    appManager.setVisible("show");
    titleBarManager.setTitle(this.translate.instant('manageidentity.titlebar-title'));
    titleBarManager.setNavigationMode(TitleBarPlugin.TitleBarNavigationMode.CLOSE);
  }

  public exportIdentity() {
    this.navCtrl.navigateForward("exportidentity");
  }

  public stopUsingTemporaryIdentity() {

  }
}
