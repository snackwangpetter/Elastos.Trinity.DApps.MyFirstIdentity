import { Component, OnInit } from '@angular/core';
import { ToastController, ModalController } from '@ionic/angular';
import { StorageService } from 'src/app/services/storage.service';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
})
export class EditProfileComponent implements OnInit {

  public name: string = "";
  public email: string = "";

  constructor(
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    private storage: StorageService,
    public theme: ThemeService,
    public translate: TranslateService
  ) { }

  ngOnInit() {}

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
