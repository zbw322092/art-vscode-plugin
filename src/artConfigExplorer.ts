import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Filenames } from './constants/Filenames';
import { ModuleExplorerLevel } from './enums/ModuleExplorerLevel';

export class ArtConfigProvider implements vscode.TreeDataProvider<ArtModules> {
  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.artConfigPath = path.join(this.workspaceRoot, Filenames.artConfigFile);
    this.createArtConfigFileWatcher();
    this.registerArtCommand();
  }

  private workspaceRoot: string;
  private artConfigPath: string;

  private _onDidChangeTreeData: vscode.EventEmitter<ArtModules> =
    new vscode.EventEmitter<ArtModules>();
  public onDidChangeTreeData: vscode.Event<ArtModules | null | undefined> =
    this._onDidChangeTreeData.event;

  private createArtConfigFileWatcher() {
    const fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/art.config.js', true, false, false);
    fileSystemWatcher.onDidChange((event: vscode.Uri) => {
      this.refresh();
    });
  }

  public refresh() {
    delete require.cache[require.resolve(this.artConfigPath)];
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
      const artVirtualPath = this.getArtConfig('projectVirtualPath');
      const artModules = Object.keys(artWebpackEntries).map((entry) => {
        entry = entry.split(artVirtualPath)[1].slice(1);
        return new ArtModules(entry, vscode.TreeItemCollapsibleState.Collapsed, ModuleExplorerLevel.module);
      });
  
      return Promise.resolve(artModules);

    } else {

      if (element.level === ModuleExplorerLevel.command) {
        return Promise.resolve([]);
      } else {
        const artServe = new ArtModules('serve', vscode.TreeItemCollapsibleState.None, ModuleExplorerLevel.command);
        const artBuild = new ArtModules('build', vscode.TreeItemCollapsibleState.None, ModuleExplorerLevel.command);
        artServe.command = {
          title: 'serve',
          command: 'artCommand.serve',
          arguments: [element.label]
        };
        artBuild.command = {
          title: 'build',
          command: 'artCommand.build',
          arguments: [element.label]
        };
        return Promise.resolve([
          artServe, artBuild
        ]);
      }
    }

  }

  private registerArtCommand() {
    vscode.commands.registerCommand('artCommand.serve', (moduleName: string) => {
      console.log('serve art module: ', moduleName);
      const terminal = vscode.window.createTerminal({});
      terminal.show();
      terminal.sendText(`art serve -m="${moduleName}"`);
    });
    vscode.commands.registerCommand('artCommand.build', (moduleName: string) => {
      console.log('build art module: ', moduleName);
      const terminal = vscode.window.createTerminal({});
      terminal.show();
      terminal.sendText(`art build -m="${moduleName}"`);
    });
  }

  private isArtProject() {
    return fs.existsSync(path.join(this.workspaceRoot, Filenames.artConfigFile));
  }

  private getArtConfig(key: string) {
    let artConfig: any;
    try {
      artConfig = require(this.artConfigPath);
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