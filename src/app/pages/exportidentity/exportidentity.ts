import { Component } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
import { HiveService } from 'src/app/services/hive.service';
import { IdentityService } from 'src/app/services/identity.service';
import { PersistenceService } from 'src/app/services/persistence.service';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from '@ngx-translate/core';

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
  public hideMnemonic = true;

  private titleBarListener: (icon: TitleBarPlugin.TitleBarIcon) => void = null;

  constructor(
    private navCtrl: NavController,
    public identityService: IdentityService,
    private toastCtrl: ToastController,
    private clipboard: Clipboard,
    public theme: ThemeService,
    public translate: TranslateService
  ) {}

  async ionViewWillEnter() {
    titleBarManager.setTitle(this.translate.instant('exportidentity.titlebar-title'));
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

    appManager.setVisible("show");

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
  }

  public showMnemonic() {
    this.hideMnemonic = !this.hideMnemonic;
  }

  public getButtonLabel() {
    if(this.hideMnemonic) {
      return 'exportidentity.show-mnemonic';
    } else {
      return 'exportidentity.hide-mnemonic';
    }
  }

  public async copyMnemonicToClipboard() {
    await this.clipboard.copy(this.mnemonicWords);
    this.toast('copied');
    this.mnemonicCopiedToClipboard = true;
  }

  public async copyDIDStringToClipboard() {
    await this.clipboard.copy(this.didString);
    this.toast('copied');
  }

  async toast(msg: string) {
    const toast = await this.toastCtrl.create({
      mode: 'ios',
      color: 'primary',
      header: this.translate.instant(msg),
      duration: 3000,
      position: 'top'
    });
    toast.present();
  }
}
