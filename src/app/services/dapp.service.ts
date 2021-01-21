import { Injectable, NgZone, Directive } from '@angular/core';
import { Platform, PopoverController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as TrinitySDK from '@elastosfoundation/trinity-dapp-sdk';

import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import { IdentityService } from './identity.service';
import { ThemeService } from './theme.service';
import { TranslateService } from '@ngx-translate/core';

declare let appManager: AppManagerPlugin.AppManager;
declare let didManager: DIDPlugin.DIDManager;
declare let passwordManager: PasswordManagerPlugin.PasswordManager;

enum MessageType {
  INTERNAL = 1,
  IN_RETURN = 2,
  IN_REFRESH = 3,

  EXTERNAL = 11,
  EX_LAUNCHER = 12,
  EX_INSTALL = 13,
  EX_RETURN = 14,
};

@Injectable({
    providedIn: 'root'
})
export class DAppService {
    private receivedIntent: AppManagerPlugin.ReceivedIntent = null; // Intent as originally received, if started as a intent.

    constructor(
        private navCtrl: NavController,
        public zone: NgZone,
        private translate: TranslateService,
        private identityService: IdentityService,
        private theme: ThemeService
    ) {}

    public init(): Promise<any> {
        this.getLanguage();
        console.log("DApp service is initializing");

        return new Promise((resolve)=>{
            appManager.setListener((msg) => {
              this.onMessageReceived(msg);
            });

            console.log("Getting startup info");
            appManager.getStartupMode((startupInfo)=>{
                console.log("Startup info:", startupInfo);

                if (startupInfo.startupMode == AppManagerPlugin.StartupMode.INTENT) {
                    appManager.hasPendingIntent((hasIntent)=>{
                        console.log("Got has pending intent result:", hasIntent);
                        if (hasIntent) {
                            // Do nothing yet, the intent handle will navigate.
                            appManager.setIntentListener(receivedIntent => {
                                this.handleReceivedIntent(receivedIntent);
                            });
                            resolve();
                        }
                        else {
                            // Should not happen but helps for debugging: if start as intent mode but no pending intent
                            // (ex: during ionic hot reload): go back to default ui screen
                            this.zone.run(()=>this.navCtrl.navigateRoot("deadend"));
                        }
                    });
                }
                else {
                    // Starting app as default UI: not handle - this application must always start with an intent.
                    console.warn("Application started with default UI mode. This is not supported.");
                    // this.zone.run(()=>this.navCtrl.navigateRoot("deadend"));
                    // this.zone.run(()=>this.navCtrl.navigateRoot("credaccessprompt"));
                    this.zone.run(()=>this.navCtrl.navigateRoot("exportidentity"));

                    resolve();
                }
            })
        });
    }

    onMessageReceived(msg: AppManagerPlugin.ReceivedMessage) {
      let params: any = msg.message;
      if (typeof (params) == "string") {
        try {
            params = JSON.parse(params);
        } catch (e) {
            console.log('Params are not JSON format: ', params);
        }
      }
      switch (msg.type) {
        case MessageType.IN_REFRESH:
          if (params.action === "currentLocaleChanged") {
            this.setCurLang(params.data);
          }
          if(params.action === 'preferenceChanged' && params.data.key === "ui.darkmode") {
            this.zone.run(() => {
              console.log('Dark Mode toggled');
              this.theme.setTheme(params.data.value);
            });
          }
          break;
      }
    }

    setCurLang(lang: string) {
      console.log("Setting current language to "+ lang);

      this.zone.run(()=>{
        this.translate.use(lang);
      });
    }

    getLanguage() {
      appManager.getLocale(
        (defaultLang, currentLang, systemLang) => {
          this.setCurLang(currentLang);
        }
      );
    }

    private async handleReceivedIntent(receivedIntent: AppManagerPlugin.ReceivedIntent) {
        this.receivedIntent = receivedIntent;

        console.log("Intent received:", receivedIntent, JSON.stringify(receivedIntent));

        if (receivedIntent.action == "intentdestinationproxy") {
            console.log("Proxy action request");
            let originalIntentAction: string = receivedIntent.params.originalIntentAction;
            if (originalIntentAction.startsWith("https://did.elastos.net/credaccess")) {
                // We need to ask user if he wants to sign in with elastOS or if he wants us to generate
                // a temporary DID.
                console.log("Navigating to credential access prompt");
                this.zone.run(()=>this.navCtrl.navigateRoot("credaccessprompt"));
            }
            else {
                console.error("Unhandled proxy intent received:", receivedIntent);
            }
        }
        else if (receivedIntent.action.startsWith("https://did.elastos.net/credaccess")) {
            console.log("Cred access intent request");
            if (await this.identityService.identityIsFullyReadyToUse()) {
                this.zone.run(()=>this.navCtrl.navigateRoot("credaccess"));
            }
            else {
                // Identity creation or management, followed by a real sign in (inside this app).
                this.zone.run(()=>this.navCtrl.navigateRoot("identitysetup"));
            }
        }
        else if (receivedIntent.action.startsWith("https://did.elastos.net/appidcredissue")) {
            console.log("App ID cred issue intent request");
            let applicationDID = await this.getApplicationDID();
            await this.identityService.generateAndSendApplicationIDCredentialIntentResponse(applicationDID, receivedIntent);
        }
        else if (receivedIntent.action.startsWith("https://myfirstidentity.elastos.net/manageidentity")) {
            console.log("Manage identity intent request");
            this.zone.run(()=>this.navCtrl.navigateRoot("manageidentity"));
        }
        else {
            console.error("Unhandled intent!");
        }
    }

    public getReceivedIntent(): AppManagerPlugin.ReceivedIntent {
        return this.receivedIntent;
    }

    /**
     * Returns the application DID as defined in the manifest
     */
    public getApplicationDID(): Promise<string> {
        return new Promise((resolve, reject)=>{
            let intent = this.getReceivedIntent();
            appManager.getAppInfo(intent.from, (appInfo)=>{
                resolve(appInfo.did);
            }, (err)=>{
                reject(err);
            });
        });
    }

    public sleep(ms: number): Promise<void> {
        return new Promise((resolve)=>{
            setTimeout(()=>resolve(), ms);
        });
    }
}
