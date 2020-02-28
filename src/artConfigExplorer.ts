import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Filenames } from './constants/Filenames';
import { ModuleExplorerLevel } from './enums/ModuleExplorerLevel';
import { ProjectType } from './enums/ProjectType';

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

  public refresh = () => {
    console.log('refresh art config');
    delete require.cache[require.resolve(this.artConfigPath)];
    this._onDidChangeTreeData.fire();
  };

  public createProject = () => {
    console.log('creare art project');
    const pick = vscode.window.createQuickPick();
    pick.items = [
      { label: 'SPA-React', description: 'Client-Side Rendering Single Page Application, Using React.js' },
      { label: 'SPA-Vue', description: 'Client-Side Rendering Single Page Application, Using Vue.js' },
      { label: 'SSR-React', description: 'Server-Side Rendering Application, Using React.js' },
      { label: 'SSR-Vue', description: 'Server-Side Rendering Application, Using Vue.js' },
      { label: 'Miniprogram', description: 'Tencent Miniprogram Application' }
    ];
    pick.placeholder = 'Please choose the project you would like to create';
    pick.show();
    pick.onDidAccept((event) => {
      const artProjectTypeMap = new Map([
        ['SPA-React', 'react'],
        ['SPA-Vue', 'vue'],
        ['SSR-React', 'ssr-react'],
        ['SSR-Vue', 'ssr-vue'],
        ['Miniprogram', 'miniprogram']
      ]);
      const selectedItem = pick.activeItems[0];
      const projectType = artProjectTypeMap.get(selectedItem.label);
      console.log('Art Create Project, user selected: ', selectedItem);
      console.log('Project Type: ', projectType);

      pick.hide();

      const terminal = vscode.window.createTerminal()
      terminal.sendText(`art create project -s="${projectType}"`);
      terminal.show();
    });
  };

  public createModule = () => {
    console.log('creare art module');
    const artProjectType = this.getArtConfig('projectType') || ProjectType.SPA_REACT;
    const terminal = vscode.window.createTerminal();
    terminal.show();
    terminal.sendText(`art create module -s="${artProjectType}"`);
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
      const terminal = vscode.window.createTerminal();
      terminal.show();
      terminal.sendText(`art serve -m="${moduleName}"`);
    });
    vscode.commands.registerCommand('artCommand.build', (moduleName: string) => {
      console.log('build art module: ', moduleName);
      const terminal = vscode.window.createTerminal();
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
      artConfig = (artConfig as any)[v];
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