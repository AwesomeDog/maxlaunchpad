/** Minimal drag data storage shared by the keyboard interaction tests. */
export function createDataTransfer() {
  const data = new Map<string, string>();
  return {
    effectAllowed: 'none',
    dropEffect: 'none',
    files: [] as { path: string }[],
    setData: jest.fn((type: string, value: string) => {
      data.set(type, value);
    }),
    getData: jest.fn((type: string) => data.get(type) ?? ''),
  };
}
