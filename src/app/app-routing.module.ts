import { Component, NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { CredAccessPromptPage } from './pages/credaccessprompt/credaccessprompt';

import { HomePage } from './pages/home/home';

@Component({ template: "<div></div>" })
export class EmptyPage { }

const routes: Routes = [
  { path: 'home', component: HomePage },
  { path: 'credaccessprompt', component: CredAccessPromptPage },
  { path: '**', component: EmptyPage }, // Prevent angular from calling a random default route sometimes when starting, leading to crashes if platform is not ready yet
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
