interface VSCodeMock {
  window: {
      showInformationMessage: jest.Mock;
      showErrorMessage: jest.Mock;
      createOutputChannel: jest.Mock;
  };
  workspace: {
      workspaceFolders: Array<{ uri: { fsPath: string } }>;
  };
  Uri: {
      file: (path: string) => { fsPath: string };
      joinPath: (...parts: string[]) => { fsPath: string };
  };
}

// Mock VS Code API
const vscode: VSCodeMock = {
  window: {
      showInformationMessage: jest.fn(),
      showErrorMessage: jest.fn(),
      createOutputChannel: jest.fn().mockReturnValue({
          appendLine: jest.fn(),
          show: jest.fn(),
      }),
  },
  workspace: {
      workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
  },
  Uri: {
      file: (path: string) => ({ fsPath: path }),
      joinPath: (...parts: string[]) => ({ fsPath: parts.join('/') }),
  },
};

// Add VS Code API to global scope
declare global {
  // eslint-disable-next-line no-var
  var vscode: VSCodeMock;
}
global.vscode = vscode;

// Clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});