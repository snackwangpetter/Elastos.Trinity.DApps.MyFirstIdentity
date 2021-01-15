import { NgModule, ErrorHandler, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy, Platform } from '@ionic/angular';
import { AppRoutingModule } from './app-routing.module';

import { MyApp } from './app.component';

import { StatusBar } from '@ionic-native/status-bar/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { HttpClientModule } from '@angular/common/http';
import { CredAccessPromptPage } from './pages/credaccessprompt/credaccessprompt';
import { StorageService } from './services/storage.service';
import { IdentitySetupPage } from './pages/identitysetup/identitysetup';
import { CredAccessPage } from './pages/credaccess/credaccess';
import { DeadEndPage } from './pages/deadend/deadend';

@NgModule({
  declarations: [
    MyApp,
    IdentitySetupPage,
    CredAccessPromptPage,
    CredAccessPage,
    DeadEndPage
  ],
  imports: [
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    IonicModule.forRoot()
  ],
  bootstrap: [MyApp],
  entryComponents: [
    MyApp,
    IdentitySetupPage,
    CredAccessPromptPage,
    CredAccessPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Platform,
    StorageService,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    {provide: ErrorHandler, useClass: ErrorHandler}
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
