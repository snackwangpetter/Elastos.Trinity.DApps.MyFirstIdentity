import { Injectable } from '@angular/core';

declare let appManager: AppManagerPlugin.AppManager;

/***
 * Local storage using app manager settings to make sure debug (CLI) and no debug app versions share the same
 * data.
 */
@Injectable()
export class StorageService {
    constructor() { }

    public set(key: string, value: any): Promise<any> {
        return new Promise((resolve)=>{
            appManager.setSetting(key, value, ()=>{
                resolve();
            });
        });
    }

    public async get<T>(key: string): Promise<T> {
        return new Promise((resolve)=>{
            appManager.getSetting(key, (val)=>{
                resolve(val);
            }, (err)=>{
                // Key not found in setting
                resolve(null);
            });
        });
    }

    public async getSignedInDID(): Promise<string> {
        return this.get<string>("signedindid");
    }

    public async setSignedInDID(didString: string): Promise<void> {
        return this.set("signedindid", didString);
    }
}


