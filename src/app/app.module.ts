import { NgModule, ErrorHandler, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy, Platform } from '@ionic/angular';
import { AppRoutingModule } from './app-routing.module';
import { IonicStorageModule } from '@ionic/storage';

import { MyApp } from './app.component';

import { StatusBar } from '@ionic-native/status-bar/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { HttpClientModule } from '@angular/common/http';
import { CredAccessPromptPage } from './pages/credaccessprompt/credaccessprompt';
import { StorageService } from './services/storage.service';
import { IdentitySetupPage } from './pages/identitysetup/identitysetup';
import { CredAccessPage } from './pages/credaccess/credaccess';
import { DeadEndPage } from './pages/deadend/deadend';
import { ManageIdentityPage } from './pages/manageidentity/manageidentity';
import { ExportIdentityPage } from './pages/exportidentity/exportidentity';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { EditprofilePage } from './pages/editprofile/editprofile.page';
import { EditProfileComponent } from './components/edit-profile/edit-profile.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    MyApp,
    IdentitySetupPage,
    CredAccessPromptPage,
    CredAccessPage,
    DeadEndPage,
    ManageIdentityPage,
    ExportIdentityPage,
    EditprofilePage,
    EditProfileComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    IonicModule.forRoot(),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [MyApp],
  entryComponents: [
    MyApp,
    IdentitySetupPage,
    CredAccessPromptPage,
    CredAccessPage,
    DeadEndPage,
    ManageIdentityPage,
    ExportIdentityPage,
    EditprofilePage,
    EditProfileComponent
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Platform,
    Clipboard,
    StorageService,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: ErrorHandler, useClass: ErrorHandler}
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
