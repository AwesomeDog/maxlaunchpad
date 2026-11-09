import { parseKeyDragPayload, serializeKeyDragPayload } from '../keyDrag';

const source = { tabId: '2', keyId: 'Q' };

describe('key drag payload', () => {
  it('round-trips the source tab and key', () => {
    expect(parseKeyDragPayload(serializeKeyDragPayload(source))).toEqual(source);
  });

  it('only reads the source location from the payload', () => {
    expect(parseKeyDragPayload(JSON.stringify({ ...source, label: 'Ignored' }))).toEqual(source);
  });

  it.each([
    undefined,
    null,
    '',
    'not JSON',
    'null',
    '[]',
    '42',
    'true',
    '"Q"',
    '{}',
    '{"tabId":"2"}',
    '{"keyId":"Q"}',
    '{"tabId":2,"keyId":"Q"}',
    '{"tabId":"2","keyId":null}',
  ])('ignores an invalid payload: %p', (raw) => {
    expect(parseKeyDragPayload(raw)).toBeNull();
  });
});
