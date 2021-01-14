import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as TrinitySDK from '@elastosfoundation/trinity-dapp-sdk';
import { DIDPublicationStatus } from '../model/didpublicationstatus.model';
import { PersistenceService } from './persistence.service';
import { StorageService } from './storage.service';
import { resolve } from 'url';

declare let didManager: DIDPlugin.DIDManager;

type AssistCreateTxResponse =
{
    meta: {
        code: number,
        message: string
    },
    data: {
        confirmation_id: string,
        service_count: number,
        duplicate: boolean
    }
}

@Injectable({
    providedIn: 'root'
})
export class IdentityService {
    private didHelper: TrinitySDK.DID.DIDHelper;

    constructor(private persistence: PersistenceService, private http: HttpClient) {
        this.didHelper = new TrinitySDK.DID.DIDHelper();
    }

    public async createLocalIdentity() {
        let persistentInfo = this.persistence.getPersistentInfo();
        let createdDIDInfo = await this.didHelper.fastCreateDID(DIDPlugin.MnemonicLanguage.ENGLISH);

        if (!createdDIDInfo) {
            console.error("Null DID returned!");
            return;
        }

        console.log("DID has been created:", createdDIDInfo);

        // Save the created DID info. We don't bother user with manual passwords or mnemonics, as this is a "temporary"
        // identity only.
        persistentInfo.did.didString = createdDIDInfo.did.getDIDString();
        persistentInfo.did.storeId = createdDIDInfo.didStore.getId();
        persistentInfo.did.storePassword = createdDIDInfo.storePassword;
        persistentInfo.did.publicationStatus = DIDPublicationStatus.PUBLICATION_NOT_REQUESTED;

        await this.persistence.savePersistentInfo(persistentInfo);
    }

    /**
     * Queries the DID sidechain to check if the given DID is published or not.
     */
    public async getIdentityOnChain(didString: string): Promise<DIDPlugin.DIDDocument> {
        return new Promise((resolve, reject)=>{
            didManager.resolveDidDocument(didString, true, (document)=>{
                resolve(document);
            }, (err)=>{
                reject(err);
            });
        });
    }

    /**
     * Publish the DID using assist api
     */
    public async publishIdentity(): Promise<void> {
        console.log("Starting the DID publication process");

        return new Promise(async (resolve, reject)=>{
            let persistentInfo = this.persistence.getPersistentInfo();

            let didStore = await this.openDidStore(persistentInfo.did.storeId, async (payload: string, memo: string)=>{
                // Callback called by the DID SDK when trying to publish a DID.
                console.log("Create ID transaction callback is being called", payload, memo);
                let payloadAsJson = JSON.parse(payload);
                try {
                    await this.publishDIDOnAssist(persistentInfo.did.didString, payloadAsJson, memo);
                    resolve();
                }
                catch (err) {
                    reject(err);
                }
            });

            let localDIDDocument = await this.loadLocalDIDDocument(didStore, persistentInfo.did.didString);
            localDIDDocument.publish(persistentInfo.did.storePassword, ()=>{}, (err)=>{
                // Local "publish" process errored
                console.log("Local DID Document publish(): error", err);
                reject(err);
            });
        });
    }

    // DOC FOR ASSIST API: https://github.com/tuum-tech/assist-restapi-backend#verify
    private publishDIDOnAssist(didString: string, payloadObject: any, memo: string) {
        return new Promise((resolve, reject)=>{
            console.log("Requesting identity publication to Assist");

            let assistAPIEndpoint = "https://wogbjv3ci3.execute-api.us-east-1.amazonaws.com/prod";
            let assistAPIKey = "IdSFtQosmCwCB9NOLltkZrFy5VqtQn8QbxBKQoHPw7zp3w0hDOyOYjgL53DO3MDH";

            let requestBody = {
                "did": didString,
                "memo": memo || "",
                "requestFrom": "org.elastos.trinity.dapp.myfirstidentity",
                "didRequest": payloadObject
            };

            console.log("Assist API request body:", requestBody);

            let headers = new HttpHeaders({
                "Content-Type": "application/json",
                "Authorization": assistAPIKey
            });

            this.http.post(assistAPIEndpoint+"/v1/didtx/create", requestBody, {
                headers: headers
            }).toPromise().then(async (response: AssistCreateTxResponse) => {
                console.log("Assist successful response:", response);
                if (response && response.meta && response.meta.code == 200 && response.data.confirmation_id) {
                    console.log("All good, DID has been submitted. Now waiting.");

                    let persistentInfo = this.persistence.getPersistentInfo();
                    persistentInfo.did.publicationStatus = DIDPublicationStatus.AWAITING_PUBLICATION_CONFIRMATION;
                    persistentInfo.did.assistPublicationID = response.data.confirmation_id;
                    await this.persistence.savePersistentInfo(persistentInfo);

                    resolve();
                } else {
                    let error = "Successful response received from the assist API, but response can't be understood";
                    reject(error);
                }
            }).catch((err) => {
                console.log("Assist api call error:", err);
                reject(err);
            });
        });
    }

    /**
     * Checks the publication status on the assist API, for a previously saved ID.
     */
    public async checkRemotePublicationStatus(): Promise<void> {
        // TODO
        return Promise.resolve();
    }

    private openDidStore(storeId: string, createIdTransactionCallback: DIDPlugin.OnCreateIdTransaction): Promise<DIDPlugin.DIDStore> {
        return new Promise((resolve)=>{
            didManager.initDidStore(storeId, createIdTransactionCallback, (didstore)=>{
                resolve(didstore);
            }, (err)=>{
                resolve(null);
            })
        });
    }

    private loadLocalDIDDocument(didStore: DIDPlugin.DIDStore, didString: string): Promise<DIDPlugin.DIDDocument> {
        return new Promise((resolve)=>{
            didStore.loadDidDocument(didString, (didDocument)=>{
                resolve(didDocument);
            }, (err)=>{
                resolve(null);
            });
        });
    }

    public createCredaccessPresentation(): Promise<DIDPlugin.VerifiablePresentation> {
        return new Promise(async (resolve)=>{
            let persistentInfo = this.persistence.getPersistentInfo();
            let didStore = await this.didHelper.openDidStore(persistentInfo.did.storeId);
            let did = await this.didHelper.loadDID(didStore, persistentInfo.did.didString);

            // TODO: embed the "name" credential when we have this configuration available on the UI.
            did.createVerifiablePresentation([], "", "", persistentInfo.did.storePassword, (presentation)=>{
                resolve(presentation);
            }, (err)=>{
                console.error("Error while creating the credaccess presentation:", err);
                resolve(null);
            });
        });
    }
}
