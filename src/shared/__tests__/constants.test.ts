import { DEFAULT_FOLDER_ICON_URL } from '../constants';

describe('shared constants', () => {
  it('uses a local data URL for the default folder icon', () => {
    expect(DEFAULT_FOLDER_ICON_URL).toMatch(/^data:image\/svg\+xml,/);
    expect(DEFAULT_FOLDER_ICON_URL).not.toMatch(/^https?:/);
  });
});
