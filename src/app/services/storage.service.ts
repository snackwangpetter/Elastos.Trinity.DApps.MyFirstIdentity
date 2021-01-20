import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

declare let appManager: AppManagerPlugin.AppManager;

/***
 * Local storage using app manager settings to make sure debug (CLI) and no debug app versions share the same
 * data.
 */
@Injectable()
export class StorageService {
    constructor(
      private storage: Storage
    ) { }

    public set(key: string, value: any): Promise<any> {
        return new Promise((resolve)=>{
            appManager.setSetting(key, value, ()=>{
                resolve();
            });
        });
    }

    public async get(key: string): Promise<any> {
        return new Promise((resolve)=>{
            appManager.getSetting(key, (val)=>{
                resolve(val);
            }, (err)=>{
                // Key not found in setting
                resolve(null);
            });
        });
    }

    public setProfile(value: any) {
      return this.storage.set("profile", JSON.stringify(value)).then((data) => {
      });
    }

    public getProfile(): Promise<any> {
      return this.storage.get("profile").then((data) => {
        return JSON.parse(data);
      });
    }
}


