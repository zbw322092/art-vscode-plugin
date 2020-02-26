import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Filenames } from './constants/Filenames';

export class ArtConfigProvider implements vscode.TreeDataProvider<ArtModules> {
  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  private workspaceRoot: string;
  private commandLevelGenerated = false;

  onDidChangeTreeData?: vscode.Event<ArtModules | null | undefined> | undefined;

  public getTreeItem(element: ArtModules): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return Promise.resolve(element);
  }

  public getChildren(element?: ArtModules | undefined): vscode.ProviderResult<ArtModules[]> {
    if (!(this.workspaceRoot && this.isArtProject())) {
      vscode.window.showInformationMessage('Not Art Project');
      return Promise.resolve([]);
    }

    if (!element) {
      const artWebpackEntries = this.getArtConfig('webpack.entry') || {};
      const artModules = Object.keys(artWebpackEntries).map((entry) => {
        return new ArtModules(entry, vscode.TreeItemCollapsibleState.Collapsed);
      });
  
      console.log('artModules: ', artModules);
      return Promise.resolve(artModules);

    } else {

      if (this.commandLevelGenerated) {
        return Promise.resolve([]);
      } else {
        this.commandLevelGenerated = true;
        return Promise.resolve([
          new ArtModules('serve', vscode.TreeItemCollapsibleState.None),
          new ArtModules('build', vscode.TreeItemCollapsibleState.None)
        ]);
      }
    }

  }

  private isArtProject() {
    return fs.existsSync(path.join(this.workspaceRoot, Filenames.artConfigFile));
  }

  private getArtConfig(key: string) {
    let artConfig = {};
    try {
      artConfig = require(path.join(this.workspaceRoot, Filenames.artConfigFile));
    } catch (err) {
      console.error(err);
      return artConfig;
    }

    const keys = key.split('.');
    keys.forEach((v) => {
      artConfig = (artConfig as any)[v] || {};
    });

    return artConfig;
  }
}

export class ArtModules extends vscode.TreeItem {};