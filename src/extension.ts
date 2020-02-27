// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ArtConfigProvider } from './artConfigExplorer';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// const isArtProject = vscode.workspace.workspaceFolders &&
	// 	fs.existsSync(path.join(vscode.workspace.workspaceFolders[0].uri.path, 'art.config.js'));

	// if (!isArtProject) {
	// 	console.log('Not Art Project');
	// 	return;
	// }

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "art-vscode-plugin" is now active!');


	// @ts-ignore
	const artConfigProvider = new ArtConfigProvider(vscode.workspace.workspaceFolders[0].uri.path);
	vscode.window.createTreeView('artProjectExplorer', { treeDataProvider: artConfigProvider });
	vscode.commands.registerCommand('artProjectExplorer:refresh', artConfigProvider.refresh);
	// vscode.commands.registerCommand('artProjectExplorer:refresh', () => {
	// 	vscode.window.showInformationMessage('111');
	// });

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
