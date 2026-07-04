import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

jest.mock('electron', () => ({
  app: {
    isPackaged: false,
  },
  dialog: {
    showMessageBox: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

describe('configStore legacy custom styles', () => {
  const originalXdgConfigHome = process.env.XDG_CONFIG_HOME;
  let tempConfigHome: string;

  beforeEach(() => {
    jest.resetModules();
    tempConfigHome = fs.mkdtempSync(path.join(os.tmpdir(), 'maxlaunchpad-config-'));
    process.env.XDG_CONFIG_HOME = tempConfigHome;
  });

  afterEach(() => {
    if (originalXdgConfigHome === undefined) {
      delete process.env.XDG_CONFIG_HOME;
    } else {
      process.env.XDG_CONFIG_HOME = originalXdgConfigHome;
    }
    fs.rmSync(tempConfigHome, { force: true, recursive: true });
  });

  it('does not expose or load the deleted class custom style', async () => {
    const stylesDir = path.join(tempConfigHome, 'MaxLaunchpad', 'styles');
    fs.mkdirSync(stylesDir, { recursive: true });
    fs.writeFileSync(path.join(stylesDir, 'class.css'), 'body { color: red; }', 'utf8');
    fs.writeFileSync(path.join(stylesDir, 'modern.css'), 'body { color: blue; }', 'utf8');

    const { listCustomStyles, loadCustomStyleContent } = await import('../configStore');

    expect(listCustomStyles()).toEqual(['modern']);
    expect(loadCustomStyleContent('class')).toBeNull();
  });

  it('migrates a stale class customStyle setting back to default', async () => {
    const settingsPath = path.join(tempConfigHome, 'MaxLaunchpad', 'settings.yaml');
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(
      settingsPath,
      [
        'hotkey:',
        '  modifiers:',
        '    - Alt',
        "  key: '`'",
        'activeTabOnShow: lastUsed',
        'lockWindowCenter: true',
        'launchOnStartup: true',
        'startInTray: false',
        'theme: dark',
        'language: zh',
        'customStyle: class',
        'windowSize:',
        '  width: 1000',
        '  height: 600',
        'hideElements:',
        '  menu: false',
        '  buttonIcons: false',
        '  buttonText: false',
        '  emptyButtons: false',
        '  rowF: false',
        '  row1: false',
        '  row2: false',
        '  row3: false',
      ].join('\n'),
      'utf8',
    );

    const { loadSettings } = await import('../configStore');

    expect(loadSettings().customStyle).toBe('default');
  });

  it('defaults missing menu reveal key to Alt for old settings files', async () => {
    const settingsPath = path.join(tempConfigHome, 'MaxLaunchpad', 'settings.yaml');
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(
      settingsPath,
      [
        'hotkey:',
        '  modifiers:',
        '    - Alt',
        "  key: '`'",
        'activeTabOnShow: lastUsed',
        'lockWindowCenter: true',
        'launchOnStartup: true',
        'startInTray: false',
        'theme: dark',
        'language: zh',
        'customStyle: default',
        'windowSize:',
        '  width: 1000',
        '  height: 600',
        'hideElements:',
        '  menu: false',
        '  buttonIcons: false',
        '  buttonText: false',
        '  emptyButtons: false',
        '  rowF: false',
        '  row1: false',
        '  row2: false',
        '  row3: false',
      ].join('\n'),
      'utf8',
    );

    const { loadSettings } = await import('../configStore');

    expect(loadSettings().menuRevealKey).toBe('Alt');
  });
});
