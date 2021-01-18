import { Component, NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { CredAccessPage } from './pages/credaccess/credaccess';
import { CredAccessPromptPage } from './pages/credaccessprompt/credaccessprompt';
import { DeadEndPage } from './pages/deadend/deadend';
import { ExportIdentityPage } from './pages/exportidentity/exportidentity';

import { IdentitySetupPage } from './pages/identitysetup/identitysetup';
import { ManageIdentityPage } from './pages/manageidentity/manageidentity';

@Component({ template: "<div></div>" })
export class EmptyPage { }

const routes: Routes = [
  { path: 'deadend', component: DeadEndPage },
  { path: 'identitysetup', component: IdentitySetupPage },
  { path: 'credaccessprompt', component: CredAccessPromptPage },
  { path: 'credaccess', component: CredAccessPage },
  { path: 'manageidentity', component: ManageIdentityPage },
  { path: 'exportidentity', component: ExportIdentityPage },
  { path: '**', component: EmptyPage }, // Prevent angular from calling a random default route sometimes when starting, leading to crashes if platform is not ready yet
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
