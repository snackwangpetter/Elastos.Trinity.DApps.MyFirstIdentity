import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { HiveService } from 'src/app/services/hive.service';
import { IdentityService } from 'src/app/services/identity.service';
import { PersistenceService } from 'src/app/services/persistence.service';
import { Clipboard } from '@ionic-native/clipboard/ngx';

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-exportidentity',
  templateUrl: 'exportidentity.html',
  styleUrls: ['exportidentity.scss']
})
export class ExportIdentityPage {
  public mnemonicCopiedToClipboard = false;
  public didString: string = null;
  public mnemonicWords: string = null;
  private titleBarListener: (icon: TitleBarPlugin.TitleBarIcon) => void = null;

  constructor(private navCtrl: NavController, public identityService: IdentityService, private clipboard: Clipboard) {}

  async ionViewWillEnter() {
    titleBarManager.setNavigationMode(TitleBarPlugin.TitleBarNavigationMode.HOME);
    titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_LEFT, {
      key: "back",
      iconPath: TitleBarPlugin.BuiltInIcon.BACK
    });

    this.titleBarListener = (icon: TitleBarPlugin.TitleBarIcon) => {
      if (icon.key == "back")
        this.navCtrl.back();
    };
    titleBarManager.addOnItemClickedListener(this.titleBarListener);

    // Get the DID string info
    let did = await this.identityService.getLocalDID();
    this.didString = did.getDIDString();

    // Get the DID mnemonic info
    this.mnemonicWords = await this.identityService.getDIDMnemonic();
  }

  ionViewWillLeave() {
    titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_LEFT, null);

    titleBarManager.removeOnItemClickedListener(this.titleBarListener);
    this.titleBarListener = null;
  }

  ionViewDidEnter() {
    appManager.setVisible("show");
    titleBarManager.setTitle("Export identity");
  }

  public showMnemonic() {
    // TODO
  }

  public async copyMnemonicToClipboard() {
    await this.clipboard.copy(this.mnemonicWords);
    this.mnemonicCopiedToClipboard = true;
  }

  public async copyDIDStringToClipboard() {
    await this.clipboard.copy(this.didString);
  }
}
