import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Filenames } from './constants/Filenames';
import { ModuleExplorerLevel } from './enums/ModuleExplorerLevel';

export class ArtConfigProvider implements vscode.TreeDataProvider<ArtModules> {
  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.createArtConfigFileWatcher();
  }

  private workspaceRoot: string;

  private _onDidChangeTreeData: vscode.EventEmitter<ArtModules> =
    new vscode.EventEmitter<ArtModules>();
  public onDidChangeTreeData: vscode.Event<ArtModules | null | undefined> =
    this._onDidChangeTreeData.event;

  private createArtConfigFileWatcher() {
    const fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/art.config.js', true, false, false);
    fileSystemWatcher.onDidChange((event: vscode.Uri) => {
      console.log('changed file: ', event.fsPath);

      this.refresh();
    });
  }

  public refresh = () => {
    this._onDidChangeTreeData.fire();
  };

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
        return new ArtModules(entry, vscode.TreeItemCollapsibleState.Collapsed, ModuleExplorerLevel.module);
      });
  
      return Promise.resolve(artModules);

    } else {

      if (element.level === ModuleExplorerLevel.command) {
        return Promise.resolve([]);
      } else {
        return Promise.resolve([
          new ArtModules('serve', vscode.TreeItemCollapsibleState.None, ModuleExplorerLevel.command),
          new ArtModules('build', vscode.TreeItemCollapsibleState.None, ModuleExplorerLevel.command)
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
      const artConfigPath = path.join(this.workspaceRoot, Filenames.artConfigFile);
      delete require.cache[require.resolve(artConfigPath)];
      artConfig = require(artConfigPath);
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

export class ArtModules extends vscode.TreeItem {
  constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState, level: number) {
    super(label, collapsibleState);
    this.level = level;
  }
  public level: number;
};