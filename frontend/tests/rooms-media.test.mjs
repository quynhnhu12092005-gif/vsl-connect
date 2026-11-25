import test from 'node:test';
import assert from 'node:assert/strict';
import { requestRoomDevice, startRoomDevices } from '../src/features/rooms/roomMedia.ts';

function fakeDevices(rejectKind) {
  const calls = [];
  return { calls, async getUserMedia(constraints) {
    calls.push(constraints);
    const kind = constraints.video ? 'video' : 'audio';
    if (kind === rejectKind) throw new DOMException('Denied by test', 'NotAllowedError');
    return { kind, getTracks: () => [{ kind, enabled: true, readyState: 'live' }] };
  } };
}

for (const [camera, microphone] of [[false, false], [true, false], [false, true], [true, true]]) {
  test(`join opens exactly selected devices: camera=${camera}, microphone=${microphone}`, async () => {
    const devices = fakeDevices();
    const streams = [];
    const failures = await startRoomDevices(camera, microphone, stream => streams.push(stream), devices);
    assert.deepEqual(failures, []);
    assert.deepEqual(streams.map(stream => stream.kind), [camera && 'video', microphone && 'audio'].filter(Boolean));
    assert.equal(devices.calls.length, Number(camera) + Number(microphone));
    assert(devices.calls.every(call => !(call.video && call.audio)));
  });
}

for (const failedKind of ['audio', 'video']) {
  test(`${failedKind} permission denial does not disable the other selected device`, async () => {
    const devices = fakeDevices(failedKind);
    const streams = [];
    const failures = await startRoomDevices(true, true, stream => streams.push(stream), devices);
    assert.deepEqual(streams.map(stream => stream.kind), [failedKind === 'audio' ? 'video' : 'audio']);
    assert.equal(failures.length, 1);
    assert.match(failures[0], /Chưa được cấp quyền/);
    assert(failures[0].includes(failedKind === 'audio' ? 'micro' : 'camera'));
    assert.equal(devices.calls.length, 2, 'denied permissions must not be requested repeatedly');
  });
}

test('unsupported camera constraints fall back to the device default', async () => {
  const stream = { kind: 'video' };
  const calls = [];
  const devices = { async getUserMedia(constraints) {
    calls.push(constraints);
    if (calls.length === 1) throw new DOMException('Frame rate unavailable', 'OverconstrainedError');
    return stream;
  } };
  assert.equal(await requestRoomDevice('video', devices), stream);
  assert.deepEqual(calls[1], { video: true, audio: false });
});

test('capture starts synchronously with join and delivers ready devices without waiting for the other', async () => {
  let completeMicrophone;
  const streams = [];
  const calls = [];
  const pending = startRoomDevices(true, true, stream => streams.push(stream), {
    getUserMedia(constraints) {
      calls.push(constraints);
      if (constraints.video) return Promise.resolve({ kind: 'video' });
      return new Promise(resolve => { completeMicrophone = resolve; });
    },
  });
  assert.equal(calls.length, 2, 'request permissions before any network wait');
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(streams, [{ kind: 'video' }]);
  completeMicrophone({ kind: 'audio' });
  await pending;
  assert.deepEqual(streams, [{ kind: 'video' }, { kind: 'audio' }]);
});
