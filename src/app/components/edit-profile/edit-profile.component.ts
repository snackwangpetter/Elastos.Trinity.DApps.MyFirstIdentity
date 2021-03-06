import { Component, OnInit } from '@angular/core';
import { ToastController, ModalController, NavParams } from '@ionic/angular';
import { StorageService } from 'src/app/services/storage.service';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from '@ngx-translate/core';

export enum Page {
  IDENTITYSETUP = 1,
  MANAGEIDENTITY = 2,
}

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
})
export class EditProfileComponent implements OnInit {

  public pageRequestedFrom: Page;
  public name: string = "";
  public email: string = "";

  constructor(
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    private navParams: NavParams,
    private storage: StorageService,
    public theme: ThemeService,
    public translate: TranslateService
  ) { }

  ngOnInit() {
    if(this.navParams.get('from') !== null) {
      this.pageRequestedFrom = this.navParams.get('from');
      console.log('Requested from', this.pageRequestedFrom);

      if(this.pageRequestedFrom === Page.MANAGEIDENTITY) {
        this.getProfileInfo();
      }
    };
  }

  async getProfileInfo() {
    const localProfile = await this.storage.get('profile') || {};
    console.log('Local profile', localProfile);

    this.name = localProfile.name || "";
    this.email = localProfile.email || "";
  }

  async toast(msg: string) {
    const toast = await this.toastCtrl.create({
      mode: 'ios',
      color: 'primary',
      header: msg,
      duration: 3000,
      position: 'bottom'
    });
    toast.present();
  }

  continue() {
 /*    if(!this.name.length) {
      this.toast('Please fill in your name');
      this.name = 'Anonymous user'
    } else if (!this.email.length) {
      this.email = 'unknown@email.com'
      this.toast('Please fill in your email');
    } else {
      this.storage.set(
        'profile',
        {
          name: this.name,
          email: this.email
        }
      );
      this.storage.setProfile({ name: this.name, email: this.email });
      this.modalCtrl.dismiss({
        profileFilled: true
      });
    } */

    this.storage.set(
      'profile',
      {
        name: this.name ? this.name : 'Anonymous user',
        email: this.email ? this.email : 'unknown@email.com'
      }
    );
    this.storage.setProfile(
      {
        name: this.name ? this.name : 'Anonymous user',
        email: this.email ? this.email : 'unknown@email.com'
      }
    );
    this.modalCtrl.dismiss({
      profileFilled: true
    });
  }

}
