import { Injectable, NgZone, Directive } from '@angular/core';
import { Platform, PopoverController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as TrinitySDK from '@elastosfoundation/trinity-dapp-sdk';

import { Router } from '@angular/router';
import { StorageService } from './storage.service';

declare let appManager: AppManagerPlugin.AppManager;
declare let didManager: DIDPlugin.DIDManager;
declare let passwordManager: PasswordManagerPlugin.PasswordManager;

@Injectable({
    providedIn: 'root'
})
export class DAppService {
    private receivedIntent: AppManagerPlugin.ReceivedIntent = null; // Intent as originally received, if started as a intent.

    constructor(
        private navCtrl: NavController,
        public zone: NgZone
    ) {}

    public init(): Promise<any> {
        return new Promise((resolve)=>{
            appManager.getStartupMode((startupInfo)=>{
                if (startupInfo.startupMode == AppManagerPlugin.StartupMode.INTENT) {
                    // Do nothing yet, the intent handle will navigate.
                    appManager.setIntentListener(receivedIntent => {
                        this.handleReceivedIntent(receivedIntent);
                    });
                    resolve();
                }
                else {
                    // Starting app as default UI: not handle - this application must always start with an intent.
                    console.error("Application started with default UI mode. This is not supported.");
                    resolve();
                }
            })
        });
    }

    private handleReceivedIntent(receivedIntent: AppManagerPlugin.ReceivedIntent) {
        this.receivedIntent = receivedIntent;

        console.log("Intent received:", receivedIntent);

        if (receivedIntent.action == "intentdestinationproxy") {
            let originalIntentAction: string = receivedIntent.params.originalIntentAction;
            if (originalIntentAction.startsWith("https://did.elastos.net/credaccess")) {
                // We need to ask user if he wants to sign in with elastOS or if he wants us to generate
                // a temporary DID.
                this.navCtrl.navigateRoot("credaccessprompt");
            }
            else {
                console.error("Unhandled proxy intent received:", receivedIntent);
            }
        }
        else if (receivedIntent.action.startsWith("https://did.elastos.net/credaccess")) {
            // Identity creation or management, followed by a real sign in (inside this app).
            this.navCtrl.navigateRoot("home");
        }
    }

    public getReceivedIntent(): AppManagerPlugin.ReceivedIntent {
        return this.receivedIntent;
    }
}
