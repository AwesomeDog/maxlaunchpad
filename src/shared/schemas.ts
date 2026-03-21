import { z } from 'zod';

// Key configuration schema
export const KeyConfigSchema = z
  .object({
    tabId: z.string(),
    id: z.string(),
    label: z.string(),
    filePath: z.string(),
    arguments: z.string().optional(),
    workingDirectory: z.string().optional(),
    description: z.string().optional(),
    runAsAdmin: z.boolean().optional(),
    iconPath: z.string().optional(),
  })
  .strip();

// Tab configuration schema
export const TabConfigSchema = z
  .object({
    id: z.string(),
    label: z.string(),
  })
  .strip();

// Keyboard profile schema
export const KeyboardProfileSchema = z
  .object({
    tabs: z.array(TabConfigSchema),
    keys: z.array(KeyConfigSchema),
  })
  .strip();

// Hotkey configuration schema
export const HotkeyConfigSchema = z
  .object({
    modifiers: z.array(z.string()),
    key: z.string(),
  })
  .strip();

// Window size schema
export const WindowSizeSchema = z
  .object({
    width: z.number(),
    height: z.number(),
  })
  .strip();

// Hide elements schema
export const HideElementsSchema = z
  .object({
    menu: z.boolean(),
    buttonIcons: z.boolean(),
    buttonText: z.boolean(),
    emptyButtons: z.boolean(),
    rowF: z.boolean(),
    row1: z.boolean(),
    row2: z.boolean(),
    row3: z.boolean(),
  })
  .strip();

// App settings schema
export const AppSettingsSchema = z
  .object({
    hotkey: HotkeyConfigSchema,
    activeTabOnShow: z.string(),
    activeProfilePath: z.string(),
    lockWindowCenter: z.boolean(),
    launchOnStartup: z.boolean(),
    startInTray: z.boolean(),
    theme: z.enum(['light', 'dark', 'system']),
    customStyle: z.string(),
    windowSize: WindowSizeSchema,
    hideElements: HideElementsSchema,
  })
  .strip();

// Partial schemas for loading (all fields optional)
export const PartialAppSettingsSchema = AppSettingsSchema.partial().strip();
export const PartialKeyboardProfileSchema = z
  .object({
    tabs: z.array(TabConfigSchema).optional(),
    keys: z.array(KeyConfigSchema).optional(),
  })
  .strip();
